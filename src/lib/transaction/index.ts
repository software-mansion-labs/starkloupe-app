import { ChainId } from '@/lib/types';
import { addCairoLocationsToContractCalls, fetchApi } from '@/lib/utils';
import { TransactionSimulationResult } from './types';
import { CallTrace, InternalFnCallTrace } from '@/lib/simulation';
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
	addCairoLocationsToContractCalls([transactionSimulationResult.simulationResult.callTrace]);
	return transactionSimulationResult;
}
