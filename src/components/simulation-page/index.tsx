'use client';

import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { useEffect, useState } from 'react';
import {
	simulateTransactionByData,
	SimulationPayloadWithCalldata,
	TransactionSimulationResult
} from '@/lib/simulation';
import { Button } from '../ui/button';
import { PlayIcon } from '@heroicons/react/24/outline';
import { TransactionDetails } from '../transaction-page';
import { CallTraceRoot } from '../call-trace';
import { Loader } from '../ui/loader';
import { Error } from '../ui/error';
import { useSettings } from '@/lib/context/settings-context-provider';

export function SimulationPage({
	simulationPayload
}: {
	simulationPayload?: SimulationPayloadWithCalldata;
}) {
	const [transactionSimulation, setTransactionSimulation] = useState<TransactionSimulationResult>();
	const [error, setError] = useState<string | undefined>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { trackingActive, trackingFlagLoaded } = useSettings();

	useEffect(() => {
		const fetchData = async () => {
			if (simulationPayload) {
				try {
					setIsLoading(true);
					const skipTracking = !trackingActive;
					setTransactionSimulation(
						await simulateTransactionByData(simulationPayload, skipTracking)
					);
				} catch (err: any) {
					setError(err.toString());
				} finally {
					setIsLoading(false);
				}
			} else {
				setError('Invalid simulation parameters');
			}
		};
		if (trackingFlagLoaded) {
			fetchData();
		}
	}, [simulationPayload, trackingActive, trackingFlagLoaded]);

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
				<CallTraceRoot
					simulationResult={transactionSimulation.simulationResult}
					flamegraph={transactionSimulation.flamechart}
				/>
			</>
		);
	}
	const handleReSimulateClick = () => {
		if (transactionSimulation) {
			const params = new URLSearchParams();
			params.set('senderAddress', transactionSimulation.senderAddress);

			if (transactionSimulation.calldata && transactionSimulation.calldata.length > 0) {
				params.set('calldata', transactionSimulation.calldata.join(','));
			}

			if (transactionSimulation.transactionVersion)
				params.set('transactionVersion', transactionSimulation.transactionVersion.toString());
			if (transactionSimulation.blockNumber)
				params.set('blockNumber', transactionSimulation.blockNumber.toString());
			if (simulationPayload?.chainId) params.set('chainId', simulationPayload?.chainId);
			else if (simulationPayload?.rpcUrl) params.set('rpcUrl', simulationPayload?.rpcUrl);
			window.location.href = `/simulate-transaction?${params.toString()}`;
		}
	};
	return (
		<>
			<HeaderNav />
			<main className="overflow-y-auto flex-grow">
				<Container className="py-6">
					<div className="flex flex-row items-baseline justify-between">
						<h1 className="text-xl font-medium leading-6 mt-4 mr-2">Transaction simulation</h1>
						<Button variant="outline" disabled={isLoading} onClick={handleReSimulateClick}>
							<PlayIcon className="h-4 w-4 mr-2" /> Re-simulate
						</Button>
					</div>
					{content}
				</Container>
			</main>
			<Footer />
		</>
	);
}
