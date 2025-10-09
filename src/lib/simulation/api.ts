import { ChainId } from '@/lib/types';
import { fetchApi } from '@/lib/utils';
import {
	SimulationPayloadWithCalldata,
	SimulationPayloadWithParameters,
	TransactionSimulationResult
} from '@/lib/simulation';

export async function simulateTransactionByData(
	simulationPayload: SimulationPayloadWithCalldata,
	skipTracking?: boolean
): Promise<TransactionSimulationResult> {
	const payload: any = {
		sender_address: simulationPayload.senderAddress,
		calldata: simulationPayload.calldata,
		transaction_version: simulationPayload.transactionVersion,
		nonce: simulationPayload.nonce,
		rpc_url: simulationPayload.rpcUrl,
		chain_id: simulationPayload.chainId
	};

	if (simulationPayload.blockNumber !== undefined) {
		payload.block_number = simulationPayload.blockNumber;
	}

	const a = await fetchApi<TransactionSimulationResult>(`/v1/simulate-transaction`, {
		method: 'POST',
		data: {
			WithCalldata: payload
		},
		renameToCamelCase: true,
		queryParams: skipTracking ? { skip_tracking: 'true' } : undefined
	});
	return a;
}

export async function simulateTransactionByParameters(
	simulationPayload: SimulationPayloadWithParameters,
	skipTracking?: boolean
): Promise<TransactionSimulationResult> {
	const payload: any = {
		sender_address: simulationPayload.senderAddress,
		decoded_calldata: simulationPayload.decoded_calldata,
		transaction_version: simulationPayload.transactionVersion,
		nonce: simulationPayload.nonce,
		rpc_url: simulationPayload.rpcUrl,
		chain_id: simulationPayload.chainId
	};

	if (simulationPayload.blockNumber !== undefined) {
		payload.block_number = simulationPayload.blockNumber;
	}

	const a = await fetchApi<TransactionSimulationResult>(`/v1/simulate-transaction`, {
		method: 'POST',
		data: {
			WithDecodedCalldata: payload
		},
		renameToCamelCase: true,
		queryParams: skipTracking ? { skip_tracking: 'true' } : undefined
	});
	return a;
}

export async function simulateTransactionByHash({
	chainId,
	txHash,
	skipTracking
}: {
	chainId: ChainId;
	txHash: string;
	skipTracking?: boolean;
}): Promise<TransactionSimulationResult> {
	const a = await fetchApi<TransactionSimulationResult>(
		`/v1/${chainId}/simulate-transaction/${txHash}`,
		{
			renameToCamelCase: true,
			queryParams: skipTracking ? { skip_tracking: 'true' } : undefined
		}
	);
	return a;
}

export async function simulateCustomNetworkTransactionByHash({
	rpcUrl,
	txHash,
	skipTracking
}: {
	rpcUrl: string;
	txHash: string;
	skipTracking?: boolean;
}): Promise<TransactionSimulationResult> {
	return await fetchApi<TransactionSimulationResult>(`/v1/simulate-transaction`, {
		method: 'POST',
		renameToCamelCase: true,
		data: {
			WithTxHash: {
				rpc_url: rpcUrl,
				tx_hash: txHash
			}
		},
		queryParams: skipTracking ? { skip_tracking: 'true' } : undefined
	});
}
