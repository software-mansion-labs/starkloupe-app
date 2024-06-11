'use client';

import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChainId } from '@/lib/types';
import { simulateTransactionByData } from '@/lib/simulation';
import { SimulateDialog } from '../simulate-dialog';
import { Button } from '../ui/button';
import { PlayIcon } from '@heroicons/react/24/outline';
import { TransactionDetails } from '../transaction-page';
import { TransactionSimulationResult } from '@/lib/transaction';
import { CallTraceRoot } from '../call-trace';
import { Loader } from '../ui/loader';
import { SimulationError } from '../ui/error';

export function SimulationPage({ chainId }: { chainId: string }) {
	const searchParams = useSearchParams();

	const senderAddress = searchParams.get('senderAddress');
	const calldata = searchParams.get('calldata');
	const blockNumber = searchParams.get('blockNumber');
	const transactionVersion = searchParams.get('transactionVersion');

	const [transactionSimulation, setTransactionSimulation] = useState<TransactionSimulationResult>();
	const [error, setError] = useState<string | undefined>();

	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		const fetchData = async () => {
			if (senderAddress && calldata && blockNumber && transactionVersion) {
				try {
					setIsLoading(true);
					setTransactionSimulation(
						await simulateTransactionByData({
							chainId: chainId as ChainId,
							senderAddress: senderAddress as string,
							calldata: (calldata as string).split('\n').map((data) => data.substring(2)),
							blockNumber: parseInt(blockNumber as string),
							transactionVersion: parseInt(transactionVersion as string, 10)
						})
					);
				} catch (err: any) {
					setError(err.toString());
				} finally {
					setIsLoading(false);
				}
			}
		};

		fetchData();
	}, [chainId, senderAddress, calldata, blockNumber, transactionVersion]);

	let content = null;
	if (isLoading) {
		content = <Loader />;
	} else if (error) {
		content = <SimulationError message={error} />;
	} else if (transactionSimulation) {
		content = (
			<>
				<TransactionDetails txSimResult={transactionSimulation} />
				<CallTraceRoot simulationResult={transactionSimulation.simulationResult} />
			</>
		);
	}

	return (
		<>
			<HeaderNav />
			<main>
				<Container>
					<div className="bg-white border-x border-b shadow-sm border-neutral-200 p-4 pb-0 min-h-[50vh]">
						<div className="flex flex-row items-baseline justify-between">
							<h1 className="text-l font-medium leading-6 mt-4 mb-2 mr-2">
								Transaction simulation
							</h1>
							<SimulateDialog
								title="Re-simulate transaction"
								description="Edit the transaction details below and click “Run Simulation” to re-simulate."
								dialogTrigger={
									<Button variant="outline" disabled={isLoading}>
										<PlayIcon className="h-4 w-4 mr-2" /> Re-simulate
									</Button>
								}
								senderAddress={senderAddress || ''}
								blockNumber={blockNumber || ''}
								chainId={chainId}
								calldata={calldata || ''}
								transactionVersion={parseInt(transactionVersion as string, 10)}
							/>
						</div>
						{content}
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}
