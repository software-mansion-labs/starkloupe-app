import { useState, useEffect } from 'react';
import { DecodedContractCall, StarknetTransactionData } from '@/lib/contracts';
import { SimpleContractCall } from '@/lib/utils';
import { getDefaultValue } from '../../lib/utils/calldata-parser';

export function useDecodeCalldata(
	contractCalls: SimpleContractCall[],
	contractCallsFunctions: { [key: string]: any },
	serverDataLoaded: boolean,
	txHash?: string
) {
	const [decodeCalldata, setDecodeCalldata] = useState<StarknetTransactionData>();

	useEffect(() => {
		if (serverDataLoaded) {
			return;
		}

		if (!contractCallsFunctions || Object.keys(contractCallsFunctions).length === 0) {
			return;
		}

		const createOrUpdateDecodeCalldata = () => {
			const hasAnyRawCalldata = contractCalls.some(
				(call) => call.calldata && call.calldata.trim() !== ''
			);

			if (hasAnyRawCalldata) {
				return;
			}

			if (!hasAnyRawCalldata) {
				const decodedCalls: DecodedContractCall[] = contractCalls.map((call) => {
					if (!call.address || !call.function_name) {
						return {
							contract_address: call.address || '',
							function_selector: '',
							function_name: call.function_name || '',
							parameters: []
						};
					}

					const functions = contractCallsFunctions[call.address];
					if (!functions) {
						return {
							contract_address: call.address,
							function_selector: call.function_name,
							function_name: '',
							parameters: []
						};
					}

					const functionData = functions.find((fn: any) => fn[0] === call.function_name);
					if (!functionData) {
						return {
							contract_address: call.address,
							function_selector: call.function_name,
							function_name: '',
							parameters: []
						};
					}

					const functionSelector = functionData[0] || '';
					const functionInfo = functionData[1];
					const parameters = (functionInfo?.inputs || []).map((input: any) => {
						const defaultValue = getDefaultValue(input.type, input);
						const type_name =
							input.enum_variants &&
							input.enum_variants.length > 0 &&
							typeof defaultValue === 'string'
								? `${input.type}::${defaultValue}`
								: input.type;

						return {
							name: input.name || '',
							type_name,
							value: defaultValue
						};
					});

					return {
						contract_address: call.address,
						function_selector: functionSelector,
						function_name: functionData[1].name,
						parameters
					};
				});

				setDecodeCalldata({
					decoded_calldata: decodedCalls,
					raw_calldata: []
				} as unknown as StarknetTransactionData);
			}
		};

		createOrUpdateDecodeCalldata();
	}, [contractCalls, contractCallsFunctions, serverDataLoaded, txHash]);

	return { decodeCalldata, setDecodeCalldata };
}
