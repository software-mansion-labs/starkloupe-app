import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { shortenHash } from '@/lib/utils';
import React, { useMemo, useState } from 'react';
import CopyToClipboardElement from './ui/copy-to-clipboard';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AddressLink from './address-link';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StorageChangesProps {
	// Define your props here if needed
}

const StorageChanges: React.FC<StorageChangesProps> = (props) => {
	const {
		simulationResult,
		contractCallsMap,
		customSettings,
		updateContractName,
		updateContractColor,
		updateContractSettings
	} = useCallTrace();
	const [expandedCalls, setExpandedCalls] = useState<Record<number, boolean>>({});
	const storageChanges = useMemo(() => {
		const combined: Record<
			string,
			{
				contractName?: string;
				storageChanges: Record<string, string[]>;
			}
		> = {};
		for (const [contractCallId, storageChanges] of Object.entries(
			simulationResult.storageChanges
		)) {
			const call = contractCallsMap[parseInt(contractCallId)];
			const contractAddress = call.entryPoint.codeAddress;
			if (!combined[contractAddress]) {
				let contractName: string | undefined = undefined;
				if (call.contractName) {
					contractName = call.contractName;
				} else if (call.erc20TokenName || call.erc20TokenSymbol) {
					contractName = [call.erc20TokenName, `(${call.erc20TokenSymbol})`].join(' ');
				} else if (call.entryPointInterfaceName) {
					contractName = call.entryPointInterfaceName.split('::').pop();
				}

				// if (!contractName) {
				// 	contractName = shortenHash(call.entryPoint.storageAddress, 13);
				// }
				combined[contractAddress] = {
					contractName,
					storageChanges: {}
				};
			}
			Object.assign(combined[contractAddress].storageChanges, storageChanges);
		}
		return combined;
	}, [contractCallsMap, simulationResult.storageChanges]);
	const toggleCallExpand = (index: number) => {
		setExpandedCalls((prev) => ({
			...prev,
			[index]: !prev[index]
		}));
	};

	if (Object.entries(storageChanges).length > 0) {
		return (
			<div className="flex flex-col">
				{Object.entries(storageChanges).map(
					([contractAddress, { contractName, storageChanges }], index) => {
						const isExpanded = expandedCalls[index];
						return (
							<div
								key={contractAddress}
								className="flex-1 flex flex-col min-h-0 border-b border-border bg-card"
							>
								<button
									onClick={() => toggleCallExpand(index)}
									className="w-full flex items-center justify-between p-3 gap-4 transition-colors hover:bg-muted/50"
								>
									<div className="flex flex-row items-baseline gap-2">
										{contractName ? (
											<>
												<a href={`/contracts/${contractAddress}`} className=" font-mono">
													<AddressLink
														customSettings={customSettings}
														updateContractName={updateContractName}
														updateContractColor={updateContractColor}
														updateContractSettings={updateContractSettings}
														address={contractAddress}
														addressClassName=" px-0.5 p-1"
													>
														{contractName}
													</AddressLink>
												</a>
												<CopyToClipboardElement
													className="font-mono text-muted py-1 px-0"
													toastDescription="The address has been copied."
													value={contractAddress}
												>
													<AddressLink address={contractAddress}>
														{shortenHash(contractAddress, 13)}
													</AddressLink>
												</CopyToClipboardElement>
											</>
										) : (
											<>
												<span className="font-mono">Contract address:</span>

												<AddressLink
													address={contractAddress}
													addressClassName="font-mono px-0.5 p-1"
												>
													{shortenHash(contractAddress, 13)}
												</AddressLink>
											</>
										)}
									</div>
									{isExpanded ? (
										<ChevronUp size={18} className="text-muted-foreground" />
									) : (
										<ChevronDown size={18} className="text-muted-foreground" />
									)}
								</button>
								{isExpanded && (
									<div className="flex flex-col gap-2 dark:bg-background border-t py-2 px-4">
										{Object.entries(storageChanges).map(([storageAddress, [before, after]]) => (
											<div key={storageAddress} className="flex flex-col gap-1">
												<div className="flex flex-row items-center gap-2">
													<span className="text-gray-400">Key:</span>
													<CopyToClipboardElement
														className="font-mono py-1 px-0"
														toastDescription="The key has been copied."
														value={storageAddress}
													>
														<AddressLink address={storageAddress} addressClassName="font-mono">
															{storageAddress}
														</AddressLink>
													</CopyToClipboardElement>
												</div>
												<div className="flex flex-col pl-4">
													<div className="flex flex-row gap-2">
														<span className="text-gray-400">Before:</span>
														<CopyToClipboardElement
															className="font-mono py-1 px-0"
															toastDescription="The key has been copied."
															value={before}
														>
															<AddressLink address={before} addressClassName="font-mono">
																{before}
															</AddressLink>
														</CopyToClipboardElement>
													</div>
													<div className="flex flex-row gap-2">
														<span className="text-gray-400">After:</span>
														<CopyToClipboardElement
															className="font-mono py-1 px-0"
															toastDescription="The key has been copied."
															value={after}
														>
															<AddressLink address={after} addressClassName="font-mono">
																{after}
															</AddressLink>
														</CopyToClipboardElement>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						);
					}
				)}
			</div>
		);
	} else {
		return (
			<Alert className="m-4 w-fit">
				<ExclamationTriangleIcon className="h-5 w-5" />
				<AlertTitle>No storage changes.</AlertTitle>
				<AlertDescription>No contract storage changes in this transaction.</AlertDescription>
			</Alert>
		);
	}
};

export default StorageChanges;
