import { ChainId } from '@/lib/types';
import { addCairoLocationsToContractCalls, fetchApi } from '@/lib/utils';
import { TransactionSimulationResult } from '../transaction';

export * from './types';

export async function simulateTransactionByData({
	chainId,
	senderAddress,
	calldata,
	blockNumber,
	transactionVersion
}: {
	chainId: ChainId;
	senderAddress: string;
	calldata: string[];
	blockNumber: number;
	transactionVersion: number;
}): Promise<TransactionSimulationResult> {
	const transactionSimulationResult = await fetchApi<TransactionSimulationResult>(
		`/v1/simulate-transaction`,
		{
			method: 'POST',
			data: {
				chain_id: chainId,
				block_number: blockNumber,
				sender_address: senderAddress,
				calldata: calldata,
				transaction_version: transactionVersion
			},
			renameToCamelCase: true
		}
	);
	addCairoLocationsToContractCalls([transactionSimulationResult.simulationResult.callTrace]);
	return transactionSimulationResult;
}
