import { ChainId } from '@/lib/types';
import { fetchApi } from '@/lib/utils';
import { SimulationPayloadWithCalldata, TransactionSimulationResult } from '@/lib/simulation';

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
	return transactionSimulationResult;
}

export async function simulateTransactionByHash({
	chainId,
	txHash,
	skipTracking = false
}: {
	chainId: ChainId;
	txHash: string;
	skipTracking?: boolean;
}): Promise<TransactionSimulationResult> {
	const transactionSimulationResult = await fetchApi<TransactionSimulationResult>(
		`/v1/${chainId}/simulate-transaction/${txHash}`,
		{
			renameToCamelCase: true,
			queryParams: skipTracking ? { skip_tracking: 'true' } : undefined
		}
	);
	return transactionSimulationResult;
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
	return transactionSimulationResult;
}
