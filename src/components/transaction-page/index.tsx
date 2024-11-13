'use client';

import { useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Loader } from '../ui/loader';
import {
	simulateCustomNetworkTransactionByHash,
	simulateTransactionByHash,
	TransactionSimulationResult
} from '@/lib/simulation';
import { formatTimestampToUTC, shortenHash } from '@/lib/utils';
import { ChainId } from '@/lib/types';
import { CallTraceRoot } from '@/components/call-trace';
import { InfoBox, InfoBoxItem } from '../ui/info-box';
import { SimulateDialog } from '../simulate-dialog';
import { Button } from '../ui/button';
import { PlayIcon } from '@heroicons/react/24/outline';
import { Error } from '../ui/error';
import { useSettings } from '@/lib/context/settings-context-provider';
import CopyToClipboardElement from '../ui/copy-to-clipboard';

export function TransactionPage({
	txHash,
	chainId,
	rpcUrl
}: {
	txHash: string;
	chainId?: ChainId;
	rpcUrl?: string;
}) {
	const [transactionSimulation, setTransactionSimulation] = useState<TransactionSimulationResult>();
	const [error, setError] = useState<string | undefined>();
	const { trackingActive, isSettingsLoaded } = useSettings();
	const shortHash = shortenHash(txHash);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const skipTracking = !trackingActive;
				if (chainId) {
					setTransactionSimulation(
						await simulateTransactionByHash({ chainId, txHash, skipTracking })
					);
				} else if (rpcUrl) {
					setTransactionSimulation(
						await simulateCustomNetworkTransactionByHash({ txHash, rpcUrl, skipTracking })
					);
				}
			} catch (error: any) {
				setError(error.toString());
			}
		};
		if (isSettingsLoaded) {
			fetchData();
		}
	}, [chainId, txHash, rpcUrl, isSettingsLoaded]);

	return (
		<>
			<HeaderNav />
			<main className="overflow-y-auto flex-grow flex-col flex justify-between">
				<Container className="py-6">
					<div className="lg:flex flex-row items-baseline justify-between">
						<h1 className="text-l font-medium leading-6 mt-4 mb-2 mr-2 flex flex-nowrap items-center">
							Transaction{' '}
							<CopyToClipboardElement
								value={txHash}
								toastDescription="The address has been copied."
								className="hidden lg:block"
							>
								{txHash}
							</CopyToClipboardElement>
							<CopyToClipboardElement
								value={txHash}
								toastDescription="The address has been copied."
								className=" lg:hidden"
							>
								{shortHash}
							</CopyToClipboardElement>
						</h1>

						{transactionSimulation && (
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
								simulationPayload={{
									senderAddress: transactionSimulation.senderAddress,
									calldata: transactionSimulation.calldata,
									chainId: chainId,
									transactionVersion: transactionSimulation.transactionVersion,
									rpcUrl: rpcUrl,
									blockNumber: transactionSimulation.blockNumber
								}}
							/>
						)}
					</div>
					{transactionSimulation && (
						<TransactionDetails txSimResult={transactionSimulation} rpcUrl={rpcUrl} />
					)}
					{transactionSimulation ? (
						<CallTraceRoot simulationResult={transactionSimulation.simulationResult} />
					) : error ? (
						<Error message={error} />
					) : (
						<Loader />
					)}
				</Container>

				<Footer />
			</main>
		</>
	);
}

export function TransactionDetails({
	txSimResult,
	rpcUrl
}: {
	txSimResult: TransactionSimulationResult;
	rpcUrl?: string;
}) {
	const { getNetworkByRpcUrl } = useSettings();
	let details: InfoBoxItem[] = [];

	if (rpcUrl) {
		const network = getNetworkByRpcUrl(rpcUrl);
		if (network) {
			details.push({
				name: 'Custom Network',
				value: network.networkName
			});
		}
		details.push({
			name: 'RPC URL',
			value: rpcUrl
		});
	}

	if (txSimResult.chainId) {
		details.push({
			name: 'Chain',
			value: txSimResult.chainId
		});
	}

	details = details.concat([
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
	]);

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
		<div className="mt-4">
			<InfoBox details={details} />
		</div>
	);
}
