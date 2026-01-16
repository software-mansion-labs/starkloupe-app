import { SimpleContractCall, SimulationPayload, openSimulationPage } from '@/lib/utils';
import {
	simulateTransactionByParameters,
	SimulationPayloadWithCalldata,
	SimulationPayloadWithParameters
} from '@/lib/simulation';
import { validateHexFormat, validateCalldata } from './validation-utils';
import { Chain } from '@/components/networks-select';
import { toast } from '../../components/hooks/use-toast';

function formatErrorMessage(error: unknown): string {
	const errorStr = String(error);
	if (errorStr.length > 300) {
		return errorStr.substring(0, 297) + '...';
	}

	return errorStr;
}

function cleanEnumValue(value: any, isUnitEnum: boolean = false): any {
	if (isUnitEnum) {
		return {};
	}

	if (typeof value !== 'object' || value === null) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => cleanEnumValue(item, false));
	}

	if ('__enum_variant' in value) {
		const keys = Object.keys(value).filter(k => k !== '__enum_variant');
		if (keys.length === 0) {
			return {};
		}
		
		const cleaned: any = {};
		for (const key in value) {
			if (key !== '__enum_variant' && key !== '__enum_value') {
				const fieldValue = value[key];
				if (fieldValue && typeof fieldValue === 'object' && 'value' in fieldValue) {
					cleaned[key] = cleanEnumValue(fieldValue.value, false);
				} else {
					cleaned[key] = cleanEnumValue(fieldValue, false);
				}
			} else if (key === '__enum_value') {
				cleaned[key] = cleanEnumValue(value[key], false);
			}
		}
		return cleaned;
	}

	const cleaned: any = {};
	for (const key in value) {
		if (value[key] && typeof value[key] === 'object' && 'name' in value[key] && 'type_name' in value[key] && 'value' in value[key]) {

			cleaned[key] = cleanEnumValue(value[key].value, false);
		} else {
			cleaned[key] = cleanEnumValue(value[key], false);
		}
	}

	return cleaned;
}

function detectEnumVariantByFieldNames(
	value: any,
	enumVariants: any[]
): string | null {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return null;
	}

	const fieldNames = Object.keys(value)
		.filter((key) => /^\d+$/.test(key))
		.sort((a, b) => parseInt(a) - parseInt(b))
		.map((key) => value[key]?.name)
		.filter(Boolean);

	if (fieldNames.length === 0) {
		return null;
	}

	for (const variant of enumVariants) {
		if (!variant.struct_members || variant.struct_members.length === 0) {
			continue;
		}

		const variantFieldNames = variant.struct_members.map((m: any) => m.name);

		if (
			variantFieldNames.length === fieldNames.length &&
			variantFieldNames.every((name: string, idx: number) => name === fieldNames[idx])
		) {
			return variant.name;
		}
	}

	return null;
}

function normalizeEnumTypeName(
	param: any,
	functionInput: any
): { type_name: string; value: any } {
	if (!functionInput?.enum_variants || functionInput.enum_variants.length === 0) {
		return { type_name: param.type_name, value: param.value };
	}

	if (param.type_name.includes('::')) {
		return { type_name: param.type_name, value: param.value };
	}

	const enumBase = functionInput.type || param.type_name;

	if (
		typeof param.value === 'object' &&
		param.value !== null &&
		'__enum_variant' in param.value
	) {
		return {
			type_name: `${enumBase}::${param.value.__enum_variant}`,
			value: param.value
		};
	}

	const detectedVariant = detectEnumVariantByFieldNames(param.value, functionInput.enum_variants);
	if (detectedVariant) {
		return {
			type_name: `${enumBase}::${detectedVariant}`,
			value: param.value
		};
	}

	return { type_name: param.type_name, value: param.value };
}

function cleanDecodedCalldata(decodedCalldata: any[], contractCallsFunctions?: any): any[] {
	return decodedCalldata.map((call) => {
		const functions = contractCallsFunctions?.[call.contract_address];
		const functionData = functions?.find(
			(fn: any) =>
				fn[0] === call.function_name ||
				fn[0] === call.function_selector ||
				fn[1]?.name === call.function_name
		);
		const inputs = functionData?.[1]?.inputs || [];

		return {
			...call,
			parameters: call.parameters.map((param: any, idx: number) => {
				const functionInput = inputs[idx];
				const { type_name, value } = normalizeEnumTypeName(param, functionInput);

				const isEnum = type_name.includes('::');
				let cleanedValue = value;
				
				if (isEnum) {
					const variantName = type_name.split('::')[1];
					const isUnitEnum = 
						typeof value === 'string' ||
						(typeof value === 'object' && value !== null && 
						 Object.keys(value).filter(k => k !== '__enum_variant').length === 0);
					
					if (isUnitEnum) {
						cleanedValue = {};
					} else {
						cleanedValue = cleanEnumValue(value, false);
					}
				} else {
					cleanedValue = cleanEnumValue(value, false);
				}

				return {
					...param,
					type_name,
					value: cleanedValue
				};
			})
		};
	});
}

export async function handleParameterSubmission(
	_senderAddress: string,
	decodeCalldata: any,
	_blockNumber: number | '',
	_transactionVersion: number,
	_chain: Chain | undefined,
	setIsSimulating: (value: boolean) => void,
	setAlert: (value: boolean) => void,
	contractCallsFunctions?: { [key: string]: any }
) {
	const cleanedCalldata = cleanDecodedCalldata(
		decodeCalldata.decoded_calldata,
		contractCallsFunctions
	);

	const simulationPayload = {
		senderAddress: _senderAddress,
		decoded_calldata: cleanedCalldata,
		blockNumber: _blockNumber === '' ? undefined : _blockNumber,
		transactionVersion: _transactionVersion,
		chainId: _chain?.chainId
	};

	try {
		setIsSimulating(true);
		const response = await simulateTransactionByParameters(
			simulationPayload as SimulationPayloadWithParameters
		);
		const simulationPagePayload: SimulationPayload = {
			senderAddress: _senderAddress,
			calldata: response.l2TransactionData?.calldata,
			blockNumber: _blockNumber === '' ? undefined : _blockNumber,
			transactionVersion: _transactionVersion
		};

		if (_chain) {
			if (_chain.chainId) {
				simulationPagePayload.chainId = _chain.chainId;
			} else if (_chain.network) {
				simulationPagePayload.rpcUrl = _chain.network.rpcUrl;
			}
		} else {
			throw new Error('Chain is not defined');
		}

		openSimulationPage(simulationPagePayload);

		setIsSimulating(false);
	} catch (e: any) {
		setIsSimulating(false);

		if (JSON.parse(e.message).simulation_args.WithCalldata) {
			const simulation_args: SimulationPayloadWithCalldata = JSON.parse(e.message).simulation_args
				.WithCalldata;
			if (simulation_args) {
				const simulationPagePayload: SimulationPayload = {
					senderAddress: _senderAddress,
					calldata: simulation_args.calldata,
					blockNumber: _blockNumber === '' ? undefined : _blockNumber,
					transactionVersion: _transactionVersion
				};

				if (_chain) {
					if (_chain.chainId) {
						simulationPagePayload.chainId = _chain.chainId;
					} else if (_chain.network) {
						simulationPagePayload.rpcUrl = _chain.network.rpcUrl;
					}
				} else {
					throw new Error('Chain is not defined');
				}
				openSimulationPage(simulationPagePayload);
			}
		} else {
			toast({
				description: formatErrorMessage(JSON.parse(e.message).error)
			});
			setAlert(true);
		}
	}
}

export async function handleRawSubmission(
	_senderAddress: string,
	_contractCalls: SimpleContractCall[],
	_blockNumber: number | '',
	_transactionVersion: number,
	_chain: Chain | undefined,
	setAlert: (value: boolean) => void
) {
	const processedCalls = _contractCalls.map((call) => ({
		...call,
		calldata: call.calldata.trim() === '' ? '' : call.calldata
	}));

	const allCallsValid = processedCalls.every(
		(call) => validateHexFormat(call.address) && call.function_name
	);

	const allCalldataValid = processedCalls.every((call) => {
		if (call.calldata.trim() === '') {
			return true;
		}

		const calldataLines = call.calldata
			.trim()
			.split('\n')
			.filter((line) => line.trim() !== '');
		return validateCalldata(calldataLines);
	});

	if (!allCallsValid || !allCalldataValid) {
		setAlert(true);
		return;
	}

	const simulationPayload: SimulationPayload = {
		senderAddress: _senderAddress,
		calls: processedCalls,
		blockNumber: _blockNumber === '' ? undefined : _blockNumber,
		transactionVersion: _transactionVersion
	};

	if (_chain) {
		if (_chain.chainId) {
			simulationPayload.chainId = _chain.chainId;
		} else if (_chain.network) {
			simulationPayload.rpcUrl = _chain.network.rpcUrl;
		}
	} else {
		throw new Error('Chain is not defined');
	}

	if (
		!simulationPayload.senderAddress ||
		simulationPayload.senderAddress === '' ||
		!validateHexFormat(simulationPayload.senderAddress) ||
		!simulationPayload.transactionVersion ||
		![1, 3].includes(simulationPayload.transactionVersion)
	) {
		setAlert(true);
	} else {
		openSimulationPage(simulationPayload);
	}
}

export function handleNumberOfContractsChange(
	e: React.ChangeEvent<HTMLInputElement>,
	setNumberOfContracts: (value: number) => void
) {
	const inputValue = e.target.value;
	const numValue = Math.max(1, parseInt(inputValue) || 1);
	setNumberOfContracts(numValue);
}

export function handleBlockNumberChange(
	e: React.ChangeEvent<HTMLInputElement>,
	_blockNumber: number | '',
	setBlockNumber: (value: number | '') => void
) {
	const inputValue = e.target.value;

	if (inputValue === '') {
		setBlockNumber('');
		return;
	}

	if (/^0$|^[1-9]\d*$/.test(inputValue)) {
		const numValue = parseInt(inputValue, 10);
		setBlockNumber(numValue);
	} else {
		e.target.value = _blockNumber !== null ? _blockNumber.toString() : '';
	}
}
