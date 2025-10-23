import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { shortenHash } from '@/lib/utils';
import React, { useMemo, useState } from 'react';
import CopyToClipboardElement from './ui/copy-to-clipboard';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AddressLink from './address-link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSettings } from '@/lib/context/settings-context-provider';

const StorageChanges = () => {
	const { simulationResult, contractCallsMap } = useCallTrace();
	const { customSettings, updateContractName, updateContractColor, updateContractSettings } =
		useSettings();
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

	if (Object.entries(storageChanges).length === 0) {
		return (
			<Alert className="m-4 w-fit">
				<ExclamationTriangleIcon className="h-5 w-5" />
				<AlertTitle>No storage changes.</AlertTitle>
				<AlertDescription>No contract storage changes in this transaction.</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="h-full w-full">
			<div className="flex flex-col min-h-full">
				{Object.entries(storageChanges).map(
					([contractAddress, { contractName, storageChanges }], index) => {
						const isExpanded = expandedCalls[index];
						return (
							<div key={contractAddress} className="flex flex-col min-h-0 bg-card">
								<button
									onClick={() => toggleCallExpand(index)}
									className="w-full flex items-center justify-between border-b border-border p-3 gap-4 transition-colors hover:bg-muted/50"
								>
									<div className="flex flex-row items-center gap-2 text-xs font-mono">
										{contractName ? (
											<>
												<AddressLink
													customSettings={customSettings}
													updateContractName={updateContractName}
													updateContractColor={updateContractColor}
													updateContractSettings={updateContractSettings}
													address={contractAddress}
													addressClassName="px-0.5 p-1 еext-classGreen"
												>
													{contractName}
												</AddressLink>
												<span className="text-muted-foreground">·</span>
												<CopyToClipboardElement
													className="font-mono text-muted-foreground p-0 hover:bg-inherit"
													toastDescription="The address has been copied."
													value={contractAddress}
												>
													<AddressLink
														address={contractAddress}
														customSettings={customSettings}
														addressClassName="px-0.5 p-1 text-muted-foreground"
													>
														{shortenHash(contractAddress, 13)}
													</AddressLink>
												</CopyToClipboardElement>
											</>
										) : (
											<>
												<span className="text-muted-foreground">Contract:</span>
												<AddressLink
													address={contractAddress}
													addressClassName="font-mono px-0.5 p-1"
													customSettings={customSettings}
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
									<div className="flex flex-col dark:bg-background border-b py-3 px-4">
										<div className="w-full flex flex-col gap-2">
											{Object.entries(storageChanges).map(
												([storageAddress, [before, after]], idx) => (
													<div
														key={storageAddress}
														className="relative rounded-lg border border-border bg-card/50 p-3 hover:bg-card transition-colors group"
													>
														<div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
															<div className="flex items-center justify-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
																{idx + 1}
															</div>
															<div className="">
																<span className="p-1">Key: </span>
																<CopyToClipboardElement
																	className="font-mono text-xs p-0 hover:bg-inherit w-full text-left hidden md:block"
																	toastDescription="The key has been copied."
																	value={storageAddress}
																>
																	<AddressLink
																		address={storageAddress}
																		addressClassName="font-mono text-foreground/80 break-all"
																		customSettings={customSettings}
																	>
																		{storageAddress}
																	</AddressLink>
																</CopyToClipboardElement>
																<CopyToClipboardElement
																	className="font-mono text-xs p-0 hover:bg-inherit w-full text-left md:hidden"
																	toastDescription="The key has been copied."
																	value={storageAddress}
																>
																	<AddressLink
																		address={storageAddress}
																		addressClassName="font-mono text-foreground/80 break-all"
																		customSettings={customSettings}
																	>
																		{shortenHash(storageAddress, 13)}
																	</AddressLink>
																</CopyToClipboardElement>
															</div>
														</div>
														<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
															<div className="flex flex-col gap-1.5 rounded-md bg-destructive/5 border border-red-900 p-2.5">
																<div className="flex items-center gap-1.5">
																	<span className="text-xs font-semibold text-red-600">Before</span>
																</div>
																<CopyToClipboardElement
																	className="font-mono text-xs p-0 hover:bg-inherit w-fit text-left"
																	toastDescription="Previous value copied!"
																	value={before}
																>
																	<AddressLink
																		address={before}
																		addressClassName="font-mono text-foreground/70 break-all"
																		customSettings={customSettings}
																	>
																		{before}
																	</AddressLink>
																</CopyToClipboardElement>
															</div>
															<div className="flex flex-col gap-1.5 rounded-md bg-green-500/5 border border-green-500/20 p-2.5">
																<div className="flex items-center gap-1.5">
																	<span className="text-xs font-semibold text-green-500">
																		After
																	</span>
																</div>
																<CopyToClipboardElement
																	className="font-mono text-xs p-0 hover:bg-inherit w-fit text-left"
																	toastDescription="New value copied!"
																	value={after}
																>
																	<AddressLink
																		address={after}
																		addressClassName="font-mono text-foreground/70 break-all"
																		customSettings={customSettings}
																	>
																		{after}
																	</AddressLink>
																</CopyToClipboardElement>
															</div>
														</div>
													</div>
												)
											)}
										</div>
									</div>
								)}
							</div>
						);
					}
				)}
			</div>
		</div>
	);
};

export default StorageChanges;
