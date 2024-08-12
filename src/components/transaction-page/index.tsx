'use client';

import { useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Loader } from '../ui/loader';
import { simulateTransactionByHash, TransactionSimulationResult } from '@/lib/simulation';
import { formatTimestampToUTC } from '@/lib/utils';
import { ChainId } from '@/lib/types';
import { CallTraceRoot } from '@/components/call-trace';
import { InfoBoxItem, InfoBox } from '../ui/info-box';
import { SimulateDialog } from '../simulate-dialog';
import { Button } from '../ui/button';
import { PlayIcon } from '@heroicons/react/24/outline';
import { Error } from '../ui/error';

export function TransactionPage({ chainId, txHash }: { chainId: string; txHash: string }) {
	const [transactionSimulation, setTransactionSimulation] = useState<TransactionSimulationResult>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setTransactionSimulation(
					await simulateTransactionByHash({ chainId: chainId as ChainId, txHash })
				);
			} catch (error: any) {
				setError(error.toString());
			}
		};

		fetchData();
	}, [chainId, txHash]);

	return (
		<>
			<HeaderNav />
			<main>
				<Container>
					<div className="bg-white border-x border-b shadow-sm border-neutral-200 p-4 pb-0">
						<div className="flex flex-row items-baseline justify-between">
							<h1 className="text-l font-medium leading-6 mt-4 mb-2 mr-2">Transaction {txHash}</h1>
							<SimulateDialog
								title="Re-simulate transaction"
								description="Edit the transaction details below and click “Run Simulation” to re-simulate."
								dialogTrigger={
									<Button
										variant="outline"
										disabled={
											!transactionSimulation || transactionSimulation.transactionType === 'DECLARE'
										}
									>
										<PlayIcon className="h-4 w-4 mr-2" /> Re-simulate
									</Button>
								}
								senderAddress={transactionSimulation?.senderAddress}
								blockNumber={transactionSimulation?.blockNumber.toString()}
								chainId={transactionSimulation?.chainId}
								calldata={transactionSimulation?.calldata.join('\n')}
								transactionVersion={transactionSimulation?.transactionVersion}
							/>
						</div>
						{transactionSimulation && <TransactionDetails txSimResult={transactionSimulation} />}
						{transactionSimulation ? (
							<CallTraceRoot simulationResult={transactionSimulation.simulationResult} />
						) : error ? (
							<Error message={error} />
						) : (
							<Loader />
						)}
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}

export function TransactionDetails({ txSimResult }: { txSimResult: TransactionSimulationResult }) {
	const details: InfoBoxItem[] = [
		{
			name: 'Chain',
			value: txSimResult.chainId
		},
		{
			name: 'Block',
			value: txSimResult.blockNumber.toString(),
			isCopyable: true
		},
		{
			name: 'Timestamp',
			value: formatTimestampToUTC(txSimResult.blockTimestamp)
		},
		{
			name: 'Sender',
			value: txSimResult.senderAddress,
			isCopyable: true
		}
	];

	if (txSimResult.nonce) {
		// Nonce only exists on real transactions, not simulations
		details.push({
			name: 'Nonce',
			value: txSimResult.nonce.toString()
		});
	}

	if (txSimResult.transactionVersion) {
		details.push({
			name: 'Transaction Version',
			value: txSimResult.transactionVersion.toString()
		});
	}

	if (txSimResult.simulationResult.executionResult.executionStatus === 'SUCCEEDED') {
		details.unshift({
			name: 'Execution status',
			value: (
				<span className="text-green-600">
					{txSimResult.simulationResult.executionResult.executionStatus}
				</span>
			)
		});
	} else {
		details.unshift({
			name: 'Execution status',
			value: (
				<span className="text-red-600">
					{txSimResult.simulationResult.executionResult.executionStatus}: &quot;
					{txSimResult.simulationResult.executionResult.revertReason}&quot;
				</span>
			)
		});
	}

	if (txSimResult.transactionType) {
		details.unshift({
			name: 'Transaction Type',
			value: <span className="text-blue-600">{txSimResult.transactionType}</span>,
			isCopyable: true
		});
	}

	return (
		<div className="mt-4 py-1 px-2 bg-neutral-100 rounded-sm flex flex-col">
			<InfoBox details={details} />
		</div>
	);
}
