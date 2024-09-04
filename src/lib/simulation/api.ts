import { ChainId } from '@/lib/types';
import { addCairoLocationsToContractCalls, fetchApi } from '@/lib/utils';
import {
	CallTrace,
	CallsMap,
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
	return processTransactionSimulationResult(transactionSimulationResult);
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
	return processTransactionSimulationResult(transactionSimulationResult);
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
	return processTransactionSimulationResult(transactionSimulationResult);
}

function processTransactionSimulationResult(
	transactionSimulationResult: TransactionSimulationResult
) {
	addCairoLocationsToContractCalls([transactionSimulationResult.simulationResult.callTrace]);
	addNestedCallsIdsToContractCalls(transactionSimulationResult);
	const callsMap = makeCallsMap(transactionSimulationResult);
	transactionSimulationResult.simulationResult.callsMap = callsMap;
	return transactionSimulationResult;
}

function addNestedCallsIdsToContractCalls(
	transactionSimulationResult: TransactionSimulationResult
) {
	const contractCallsIds: string[] = [];
	processContractCall(transactionSimulationResult.simulationResult.callTrace, contractCallsIds);
}

function processContractCall(contractCall: CallTrace, contractCallsIds: string[]) {
	processFnCalls(contractCall.fnCalls, contractCallsIds);
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
		if (!contractCallsIds.includes(nestedCall.contractCallId)) {
			contractCall.nestedCallsIds.push(nestedCall.contractCallId);
		}
		processContractCall(nestedCall, contractCallsIds);
	}
}

function processFnCalls(fnCalls: InternalFnCallTrace[], contractCallsIds: string[]) {
	for (const fnCall of fnCalls) {
		for (const nestedCallId of fnCall.data.nestedCallsIds) {
			if (!nestedCallId.includes('fp')) {
				contractCallsIds.push(nestedCallId);
			}
		}
		processFnCalls(fnCall.nestedCalls, contractCallsIds);
	}
}

/**
 * Makes a map of call id to contract call or fn call
 */
function makeCallsMap(transactionSimulationResult: TransactionSimulationResult): CallsMap {
	const callsMap: CallsMap = new Map();
	makeContractCallsMap([transactionSimulationResult.simulationResult.callTrace], callsMap);
	return callsMap;
}

function makeContractCallsMap(contractCalls: CallTrace[], callsMap: CallsMap) {
	for (const contractCall of contractCalls) {
		callsMap.set(contractCall.contractCallId, { contractCall });
		makeFnCallsMap(contractCall.fnCalls, callsMap);
		makeContractCallsMap(contractCall.nestedCalls, callsMap);
	}
}

function makeFnCallsMap(fnCalls: InternalFnCallTrace[], callsMap: CallsMap) {
	for (const fnCall of fnCalls) {
		callsMap.set(fnCall.data.id, { fnCall });
		makeFnCallsMap(fnCall.nestedCalls, callsMap);
	}
}
