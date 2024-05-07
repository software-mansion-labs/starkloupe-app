'use client';

import { ReactNode, useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { copyToClipboard } from '@/lib/utils';
import { Loader } from '../ui/loader';
import { simulateTransactionByHash } from '@/lib/simulation';
import { ChainId } from '@/lib/types';
import { TransactionSimulationResult } from '@/lib/transaction';
import { CallTraceRoot } from '@/components/call-trace';
import { CallDetails } from '../ui/call-details';

export function TransactionPage({ chainId, txHash }: { chainId: string; txHash: string }) {
	const [transactionSimulation, setTransactionSimulation] = useState<TransactionSimulationResult>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setTransactionSimulation(
					await simulateTransactionByHash({ chainId: chainId as ChainId, txHash })
				);
			} catch (error) {
				setError('Error fetching data');
			}
		};

		fetchData();
	}, [chainId, txHash]);

	return (
		<>
			<HeaderNav />
			<main>
				<Container>
					<div className="bg-white border-x border-b shadow-sm border-neutral-200 p-4">
						<h1 className="text-l font-medium leading-6 mt-4 mb-2">Transaction {txHash}</h1>
						{transactionSimulation && <TransactionDetails txSimResult={transactionSimulation} />}
						{transactionSimulation ? (
							<CallTraceRoot simulationResult={transactionSimulation.simulationResult} />
						) : error ? (
							error
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

function TransactionDetails({ txSimResult }: { txSimResult: TransactionSimulationResult }) {
	const details = [
		{
			name: 'Chain',
			value: txSimResult.chainId
		},
		{
			name: 'Nonce',
			value: txSimResult.nonce.toString()
		},
		{
			name: 'Block',
			value: txSimResult.blockNumber.toString(),
			isCopyable: true
		},
		{
			name: 'Sender',
			value: txSimResult.senderAddress,
			isCopyable: true
		}
	];
	return (
		<div className="mt-4 py-1 px-2 bg-neutral-100 rounded-sm">
			<CallDetails details={details} />
		</div>
	);
}

// export function SimulationPage({ simulationId }: { simulationId: string }) {
// 	const [simulationData, setSimulationData] = useState<SimulationResponse>();
// 	const [error, setError] = useState<string | undefined>();

// 	useEffect(() => {
// 		const fetchData = async () => {
// 			try {
// 				setSimulationData(await fetchSimulation(simulationId));
// 			} catch (error) {
// 				setError('Error fetching data');
// 			}
// 		};

// 		fetchData();
// 	}, [simulationId]);

// 	return (
// 		<>
// 			<HeaderNav />
// 			<main>
// 				<Container>
// 					<div className="bg-white border-x border-b shadow-sm border-neutral-200 p-4">
// 						<div className="flex items-baseline">
// 							<h1 className="text-l font-medium leading-6 mt-4 mb-2">Simulation {simulationId}</h1>
// 							<p className="ml-2 mt-1 truncate text-sm text-gray-500">
// 								{simulationData?.simulation.team_id &&
// 									`in project ${simulationData?.simulation.team_id}`}
// 							</p>
// 						</div>
// 						{simulationData && <SimulationInfo simulation={simulationData.simulation} />}
// 						{simulationData?.trace.execute_invocation ? (
// 							<Trace
// 								executeInvocation={processTraceData(simulationData.trace.execute_invocation)}
// 								classes={simulationData.classes}
// 							/>
// 						) : error ? (
// 							error
// 						) : (
// 							<Loader />
// 						)}
// 					</div>
// 				</Container>
// 			</main>
// 			<Footer />
// 		</>
// 	);
// }

// function Details(
// 	info: { name: string; value: ReactNode | string; isCopyable?: boolean; valueToCopy?: string }[]
// ) {
// 	return (
// 		<div className="rounded text-xs flex flex-row gap-x-3 flex-wrap leading-loose">
// 			{info.map(
// 				({ name, value, isCopyable, valueToCopy }) =>
// 					value && (
// 						<span key={name} className="whitespace-nowrap">
// 							<span className="text-neutral-500">{name}:</span>{' '}
// 							<span
// 								onClick={() =>
// 									isCopyable && valueToCopy
// 										? copyToClipboard(valueToCopy)
// 										: typeof value === 'string'
// 										? copyToClipboard(value)
// 										: () => {}
// 								}
// 								className={`rounded-sm font-mono px-1 ${
// 									isCopyable ? 'cursor-pointer hover:bg-black/10' : ''
// 								}`}
// 							>
// 								{value}
// 							</span>
// 						</span>
// 					)
// 			)}
// 		</div>
// 	);
// }

// function SimulationInfo({ simulation }: { simulation: Simulation }) {
// 	const info = [
// 		{
// 			name: 'Execution status',
// 			value: (
// 				<span
// 					className={` ${
// 						simulation.status === 'success'
// 							? 'text-lime-600'
// 							: simulation.status === 'simulating'
// 							? 'text-blue-600'
// 							: 'text-red-600'
// 					}`}
// 				>
// 					{(simulation.status ?? '').toUpperCase()}
// 				</span>
// 			)
// 		},
// 		{
// 			name: 'Chain id',
// 			value: hexToText(simulation.chain_id)
// 		},
// 		{
// 			name: 'Timestamp',
// 			value: formatTimestamp(simulation.created_at)
// 		},
// 		{
// 			name: 'Wallet address',
// 			value: simulation.wallet_address
// 		}
// 	];
// 	return <div className="mt-4">{Details(info)}</div>;
// }
