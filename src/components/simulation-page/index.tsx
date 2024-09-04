'use client';

import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChainId } from '@/lib/types';
import {
	simulateTransactionByData,
	SimulationPayloadWithCalldata,
	TransactionSimulationResult
} from '@/lib/simulation';
import { SimulateDialog } from '../simulate-dialog';
import { Button } from '../ui/button';
import { PlayIcon } from '@heroicons/react/24/outline';
import { TransactionDetails } from '../transaction-page';
import { CallTraceRoot } from '../call-trace';
import { Loader } from '../ui/loader';
import { Error } from '../ui/error';

export function SimulationPage({
	simulationPayload
}: {
	simulationPayload?: SimulationPayloadWithCalldata;
}) {
	const [transactionSimulation, setTransactionSimulation] = useState<TransactionSimulationResult>();
	const [error, setError] = useState<string | undefined>();

	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		const fetchData = async () => {
			if (simulationPayload) {
				try {
					setIsLoading(true);
					setTransactionSimulation(await simulateTransactionByData(simulationPayload));
				} catch (err: any) {
					setError(err.toString());
				} finally {
					setIsLoading(false);
				}
			} else {
				setError('Invalid simulation parameters');
			}
		};

		fetchData();
	}, [simulationPayload]);

	let content = null;
	if (isLoading) {
		content = <Loader />;
	} else if (error) {
		content = <Error message={error} />;
	} else if (transactionSimulation) {
		content = (
			<>
				<TransactionDetails
					txSimResult={transactionSimulation}
					rpcUrl={simulationPayload?.rpcUrl}
				/>
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
								description="Edit the invoke transaction details below and click “Run Simulation” to re-simulate."
								dialogTrigger={
									<Button variant="outline" disabled={isLoading}>
										<PlayIcon className="h-4 w-4 mr-2" /> Re-simulate
									</Button>
								}
								simulationPayload={simulationPayload}
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
