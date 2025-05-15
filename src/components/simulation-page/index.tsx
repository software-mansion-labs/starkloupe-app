'use client';

import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { useEffect, useState } from 'react';
import {
	simulateTransactionByData,
	SimulationPayloadWithCalldata,
	TransactionSimulationResult,
	L2TransactionData
} from '@/lib/simulation';
import { Button } from '../ui/button';
import { PlayIcon } from '@heroicons/react/24/outline';
import { TransactionDetails } from '../transaction-page/l2-transaction-details';
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
	const [l2TransactionData, setL2TransactionData] = useState<L2TransactionData>();
	const [error, setError] = useState<string | undefined>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { trackingActive, trackingFlagLoaded } = useSettings();

	useEffect(() => {
		const fetchData = async () => {
			if (simulationPayload) {
				try {
					setIsLoading(true);
					const skipTracking = !trackingActive;
					const simulation = await simulateTransactionByData(simulationPayload, skipTracking);
					setTransactionSimulation(simulation);
					if (simulation.l2TransactionData) {
						setL2TransactionData(simulation.l2TransactionData);
					}
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
	} else if (l2TransactionData) {
		content = (
			<>
				<TransactionDetails
					transactionData={l2TransactionData}
					rpcUrl={simulationPayload?.rpcUrl}
				/>
				<CallTraceRoot simulationResult={l2TransactionData.simulationResult} />
			</>
		);
	}
	const handleReSimulateClick = () => {
		if (l2TransactionData) {
			const params = new URLSearchParams();
			params.set('senderAddress', l2TransactionData.senderAddress);

			if (l2TransactionData.calldata && l2TransactionData.calldata.length > 0) {
				params.set('calldata', l2TransactionData.calldata.join(','));
			}

			if (l2TransactionData.transactionVersion)
				params.set('transactionVersion', l2TransactionData.transactionVersion.toString());
			if (l2TransactionData.blockNumber)
				params.set('blockNumber', l2TransactionData.blockNumber.toString());
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
