import { SimpleContractCall, SimulationPayload, openSimulationPage } from '@/lib/utils';
import { simulateTransactionByParameters, SimulationPayloadWithParameters } from '@/lib/simulation';
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

function cleanEnumValue(value: any): any {
	if (typeof value !== 'object' || value === null) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(cleanEnumValue);
	}

	if ('__enum_value' in value && typeof value.__enum_value === 'object') {
		return cleanEnumValue(value.__enum_value);
	}

	const cleaned: any = {};
	for (const key in value) {
		if (key !== '__enum_variant') {
			cleaned[key] = cleanEnumValue(value[key]);
		}
	}

	return cleaned;
}

function cleanDecodedCalldata(decodedCalldata: any[]): any[] {
	return decodedCalldata.map((call) => ({
		...call,
		parameters: call.parameters.map((param: any) => ({
			...param,
			value: cleanEnumValue(param.value)
		}))
	}));
}

export async function handleParameterSubmission(
	_senderAddress: string,
	decodeCalldata: any,
	_blockNumber: number | '',
	_transactionVersion: number,
	_chain: Chain | undefined,
	setIsSimulating: (value: boolean) => void,
	setAlert: (value: boolean) => void
) {
	const cleanedCalldata = cleanDecodedCalldata(decodeCalldata.decoded_calldata);

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
	} catch (e) {
		setIsSimulating(false);
		toast({
			description: formatErrorMessage(e)
		});
		setAlert(true);
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
