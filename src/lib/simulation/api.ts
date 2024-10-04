import { ChainId } from '@/lib/types';
import { fetchApi } from '@/lib/utils';
import {
	CallTrace,
	InternalFnCallTrace,
	SimulationPayloadWithCalldata,
	TransactionSimulationResult
} from '@/lib/simulation';

export async function simulateTransactionByData(
	simulationPayload: SimulationPayloadWithCalldata
): Promise<TransactionSimulationResult> {
	const transactionSimulationResult = await fetchApi<TransactionSimulationResult>(
		`/v1/simulate-transaction`,
		{
			method: 'POST',
			data: {
				WithCalldata: {
					sender_address: simulationPayload.senderAddress,
					calldata: simulationPayload.calldata,
					block_number: simulationPayload.blockNumber,
					transaction_version: simulationPayload.transactionVersion,
					nonce: simulationPayload.nonce,
					rpc_url: simulationPayload.rpcUrl,
					chain_id: simulationPayload.chainId
				}
			},
			renameToCamelCase: true
		}
	);
	return extendTransactionSimulationResult(transactionSimulationResult);
}

export async function simulateTransactionByHash({
	chainId,
	txHash
}: {
	chainId: ChainId;
	txHash: string;
}): Promise<TransactionSimulationResult> {
	const transactionSimulationResult = await fetchApi<TransactionSimulationResult>(
		`/v1/${chainId}/simulate-transaction/${txHash}`,
		{
			renameToCamelCase: true
		}
	);
	return extendTransactionSimulationResult(transactionSimulationResult);
}

export async function simulateCustomNetworkTransactionByHash({
	rpcUrl,
	txHash
}: {
	rpcUrl: string;
	txHash: string;
}): Promise<TransactionSimulationResult> {
	const transactionSimulationResult = await fetchApi<TransactionSimulationResult>(
		`/v1/simulate-transaction`,
		{
			method: 'POST',
			renameToCamelCase: true,
			data: {
				WithTxHash: {
					rpc_url: rpcUrl,
					tx_hash: txHash
				}
			}
		}
	);
	return extendTransactionSimulationResult(transactionSimulationResult);
}

type TraverseCallsContext = {
	contractCallsIds: string[];
};

// Here we extend the simulation API response with additional information like Cairo locations for contract calls, nestedCallsIds, and so on.
// Ideally, this should be done on the backend
function extendTransactionSimulationResult(
	transactionSimulationResult: TransactionSimulationResult
) {
	const context: TraverseCallsContext = { contractCallsIds: [] };
	traverseContractCall(transactionSimulationResult.simulationResult.callTrace, context);
	return transactionSimulationResult;
}

function traverseContractCall(contractCall: CallTrace, context: TraverseCallsContext) {
	// Add cairo location to the contract call
	if (contractCall.fnCalls[0] && contractCall.fnCalls[0].nestedCalls.length > 0) {
		const wrapper = contractCall.fnCalls[0];
		const entryPointFunction = wrapper?.nestedCalls[1];
		if (wrapper && entryPointFunction) {
			contractCall.additionalInfo.cairoLocation =
				entryPointFunction.data.cairoLocation ?? undefined;
		}
	}

	traverseFnCalls(contractCall.fnCalls, context);
	contractCall.nestedCallsIds = [];
	for (const fnCall of contractCall.fnCalls) {
		if (fnCall.nestedCalls[1]) {
			fnCall.isHidden = true;
			fnCall.nestedCalls[0].isHidden = true;
			fnCall.nestedCalls[1].isHidden = true;
		}
		contractCall.nestedCallsIds.push(fnCall.data.id);
	}
	for (const nestedCall of contractCall.nestedCalls) {
		if (!context.contractCallsIds.includes(nestedCall.contractCallId)) {
			contractCall.nestedCallsIds.push(nestedCall.contractCallId);
		}
		traverseContractCall(nestedCall, context);
	}
}

function traverseFnCalls(fnCalls: InternalFnCallTrace[], context: TraverseCallsContext) {
	for (const fnCall of fnCalls) {
		if (!fnCall.data.fnName) fnCall.isHidden = true;
		for (const nestedCallId of fnCall.data.nestedCallsIds) {
			if (!nestedCallId.includes('fp')) {
				context.contractCallsIds.push(nestedCallId);
			}
		}
		traverseFnCalls(fnCall.nestedCalls, context);
	}
}
