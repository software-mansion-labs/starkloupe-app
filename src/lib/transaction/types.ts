import { SimulationResult } from '@/lib/simulation';

export interface TransactionSimulationResult {
	simulationResult: SimulationResult;
	chainId: string;
	blockNumber: number;
	nonce: number;
	senderAddress: string;
	calldata: string[];
}
