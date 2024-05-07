import { ChainId } from '@/lib/types';
import { fetchApi } from '@/lib/utils';
import { TransactionSimulationResult } from './types';
export * from './types';

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
	console.log('simulateTransactionByHash', transactionSimulationResult);
	return transactionSimulationResult;
}
