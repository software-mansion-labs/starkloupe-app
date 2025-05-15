'use client';

import { useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Loader } from '../ui/loader';
import {
	simulateCustomNetworkTransactionByHash,
	simulateTransactionByHash,
	TransactionSimulationResult,
	L1TransactionData,
	L2TransactionData
} from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';
import { TransactionDetails } from './l2-transaction-details';
import { L1TransactionDetails } from './l1-transaction-details';
import { ChainId } from '@/lib/types';
import { CallTraceRoot } from '@/components/call-trace';
import { InfoBox, InfoBoxItem } from '../ui/info-box';
import { Button } from '../ui/button';
import { PlayIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Error } from '../ui/error';
import { useSettings } from '@/lib/context/settings-context-provider';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import { useUserContext } from '@/lib/context/user-context-provider';
import Link from 'next/link';

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
	const [l1TransactionData, setL1TransactionData] = useState<L1TransactionData>();
	const [l2TransactionData, setL2TransactionData] = useState<L2TransactionData>();
	const { isLogged } = useUserContext();
	const [error, setError] = useState<string | undefined>();
	const { trackingActive, trackingFlagLoaded } = useSettings();
	const [l2TxHash, setL2TxHash] = useState<string>();
	const [l1TxHash, setL1TxHash] = useState<string | undefined>();
	const [l1TxHashShort, setL1TxHashShort] = useState<string | undefined>();
	const [l2TxHashShort, setL2TxHashShort] = useState<string>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				const skipTracking = !trackingActive;
				if (chainId) {
					const simulation = await simulateTransactionByHash({ chainId, txHash, skipTracking });
					setTransactionSimulation(simulation);
					if (simulation.l2TransactionData) {
						setL2TransactionData(simulation.l2TransactionData);
						if (simulation.l2TransactionData.l2TxHash) {
							setL2TxHash(simulation.l2TransactionData.l2TxHash);
							setL2TxHashShort(shortenHash(simulation.l2TransactionData.l2TxHash));
						}
						if (simulation.l2TransactionData.l1TxHash) {
							setL1TxHash(simulation.l2TransactionData.l1TxHash);
							setL1TxHashShort(shortenHash(simulation.l2TransactionData.l1TxHash));
						}
					} else if (simulation.l1TransactionData) {
						setL1TransactionData(simulation.l1TransactionData);
					}
				} else if (rpcUrl) {
					const simulation = await simulateCustomNetworkTransactionByHash({
						txHash,
						rpcUrl,
						skipTracking
					});
					setTransactionSimulation(simulation);
					if (simulation.l2TransactionData) {
						setL2TransactionData(simulation.l2TransactionData);
						if (simulation.l2TransactionData.l2TxHash) {
							setL2TxHash(simulation.l2TransactionData.l2TxHash);
							setL2TxHashShort(shortenHash(simulation.l2TransactionData.l2TxHash));
						}
						if (simulation.l2TransactionData.l1TxHash) {
							setL1TxHash(simulation.l2TransactionData.l1TxHash);
							setL1TxHashShort(shortenHash(simulation.l2TransactionData.l1TxHash));
						}
					} else if (simulation.l1TransactionData) {
						setL1TransactionData(simulation.l1TransactionData);
					}
				}
			} catch (error: any) {
				setError(error.toString());
			}
		};
		if (trackingFlagLoaded) {
			fetchData();
		}
	}, [chainId, txHash, rpcUrl, trackingFlagLoaded, trackingActive]);

	const handleReSimulateClick = () => {
		if (l2TransactionData) {
			const params = new URLSearchParams();
			params.set('txHash', txHash);
			params.set('senderAddress', l2TransactionData.senderAddress);

			if (l2TransactionData.calldata && l2TransactionData.calldata.length > 0) {
				params.set('calldata', l2TransactionData.calldata.join(','));
			}

			if (l2TransactionData.transactionVersion)
				params.set('transactionVersion', l2TransactionData.transactionVersion.toString());
			if (l2TransactionData.blockNumber)
				params.set('blockNumber', l2TransactionData.blockNumber.toString());
			if (chainId) params.set('chainId', chainId);
			else if (rpcUrl) params.set('rpcUrl', rpcUrl);
			window.location.href = `/simulate-transaction?${params.toString()}`;
		}
	};

	return (
		<>
			<HeaderNav />
			<main className="overflow-y-auto flex-grow flex-col flex justify-between">
				<Container className="py-6">
					{l2TransactionData ? (
						<>
							{/* === L2 Transaction === */}
							<div className="lg:flex flex-row items-baseline justify-between">
								<div className="flex flex-col gap-2 mt-4 mb-2 mr-2">
									{l2TxHash && (
										<h1 className="text-base font-medium leading-6 flex flex-nowrap items-center">
											Transaction{' '}
											<CopyToClipboardElement
												value={l2TxHash}
												toastDescription="The address has been copied."
												className="hidden lg:block"
											>
												{l2TxHash}
											</CopyToClipboardElement>
											<CopyToClipboardElement
												value={txHash}
												toastDescription="The address has been copied."
												className="lg:hidden"
											>
												{l2TxHashShort}
											</CopyToClipboardElement>
										</h1>
									)}
									{l1TxHash && (
										<h2 className="text-base leading-6 flex flex-nowrap items-center">
											Corresponding L1 Transaction{' '}
											<CopyToClipboardElement
												value={l1TxHash}
												toastDescription="The address has been copied."
												className="hidden lg:block"
											>
												{l1TxHash}
											</CopyToClipboardElement>
											<CopyToClipboardElement
												value={txHash}
												toastDescription="The address has been copied."
												className="lg:hidden"
											>
												{l1TxHashShort}
											</CopyToClipboardElement>
										</h2>
									)}
								</div>
								{isLogged ? (
									<Button
										onClick={handleReSimulateClick}
										variant="outline"
										disabled={l2TransactionData.transactionType !== 'INVOKE'}
									>
										<PlayIcon className="h-4 w-4 mr-2" /> Re-simulate
									</Button>
								) : (
									<Link href="/login">
										<Button variant="outline">
											<PlayIcon className="mr-2 h-4 w-4" /> Re-simulate transaction
										</Button>
									</Link>
								)}
							</div>
							<TransactionDetails transactionData={l2TransactionData} rpcUrl={rpcUrl} />
							<CallTraceRoot simulationResult={l2TransactionData.simulationResult} />
						</>
					) : l1TransactionData ? (
						<>
							{/* === L1 Transaction Dat === */}
							<div className="lg:flex flex-row items-baseline justify-between">
								<div className="flex flex-col gap-2 mt-4 mb-2 mr-2">
									{l1TransactionData.l1TxHash && (
										<h1 className="text-base font-medium leading-6 flex flex-nowrap items-center">
											L1 Transaction{' '}
											<CopyToClipboardElement
												value={l1TransactionData.l1TxHash}
												toastDescription="The address has been copied."
												className="hidden lg:block"
											>
												{l1TransactionData.l1TxHash}
											</CopyToClipboardElement>
											<CopyToClipboardElement
												value={l1TransactionData.l1TxHash}
												toastDescription="The address has been copied."
												className="lg:hidden"
											>
												{shortenHash(l1TransactionData.l1TxHash)}
											</CopyToClipboardElement>
										</h1>
									)}
								</div>
								{isLogged ? (
									<Button onClick={handleReSimulateClick} variant="outline" disabled={true}>
										<PlayIcon className="h-4 w-4 mr-2" /> Re-simulate
									</Button>
								) : (
									<Link href="/login">
										<Button variant="outline">
											<PlayIcon className="mr-2 h-4 w-4" /> Re-simulate transaction
										</Button>
									</Link>
								)}
							</div>
							<L1TransactionDetails transactionData={l1TransactionData} rpcUrl={rpcUrl} />
							{l1TransactionData.messageHashes && l1TransactionData.messageHashes.length > 0 && (
								<div className="mt-4">
									<div className="rounded-xl border bg-white">
										<div className="p-4">
											<h3 className="text-sm mb-2">Cross-Chain Source: Transactions on Starknet</h3>
											<p className="text-neutral-400 text-[0.7rem] mb-2">
												{l1TransactionData.messageHashes.length > 1
													? 'This L1 transaction was triggered by three messages sent from Starknet.'
													: 'This L1 transaction was triggered by a message sent from Starknet.'}
											</p>
											<div className="flex flex-col gap-1 text-xs">
												{l1TransactionData.messageHashes.map((hash, index) => {
													const isSepolia = l1TransactionData.chainId
														?.toLowerCase()
														.includes('sepolia');
													const voyagerUrl = isSepolia
														? `https://sepolia.voyager.online/message/${hash}`
														: `https://voyager.online/message/${hash}`;

													return (
														<div
															key={index}
															className="flex items-baseline gap-2 whitespace-nowrap"
														>
															{l1TransactionData.messageHashes.length > 1 && (
																<span className="text-neutral-500">Message {index + 1}:</span>
															)}
															<div className="flex items-center gap-1">
																<CopyToClipboardElement
																	value={hash}
																	toastDescription="Message hash copied"
																	className="font-mono cursor-pointer hover:bg-black/10 rounded-sm px-1"
																>
																	<span className="hidden lg:inline">{hash}</span>
																	<span className="lg:hidden">{shortenHash(hash)}</span>
																</CopyToClipboardElement>
																<a
																	href={voyagerUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="font-bold text-lg underline"
																	title="View on Voyager"
																>
																	<LinkIcon className="h-4 w-4" />
																</a>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									</div>
								</div>
							)}
						</>
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
