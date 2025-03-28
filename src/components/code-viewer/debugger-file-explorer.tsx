import React, { memo, useCallback, useEffect, useState } from 'react';
import { cn, getContractName } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ClassDebuggerData } from '@/lib/simulation/types';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useDebugger } from '@/lib/context/debugger-context-provider';

export const DebuggerFilesExplorer = memo(function FilesExplorer({
	showTitle = true,
	classesDebuggerData,
	classSourceCode,
	activeFile,
	handleFileClick,
	className,
	toggleExpand,
	currentStepIndex
}: {
	showTitle?: boolean;
	classSourceCode: {
		[key: string]: string;
	};
	classesDebuggerData: {
		[key: string]: ClassDebuggerData;
	};
	activeFile?: string;
	handleFileClick: (filePath: string) => void;
	className?: string;
	toggleExpand?: () => void;
	currentStepIndex: number;
}) {
	const [isCallTraceExpanded, setIsCallTraceExpanded] = useState(false);
	const { contractCallsMap } = useCallTrace();
	const { contractCall, setCurrentContractCall } = useDebugger();
	const contractHashFiles = Object.keys(classesDebuggerData);

	const contracts = contractHashFiles.map((hash) =>
		Object.values(contractCallsMap).find((call) => call.classHash === hash)
	);

	const [openContracts, setOpenContracts] = useState<Record<string, boolean>>(
		contracts.reduce<Record<string, boolean>>((acc, contract) => {
			if (
				contract?.classHash &&
				classesDebuggerData[contract?.classHash].sourceCode === classSourceCode
			) {
				acc[contract?.classHash] = true;
			} else if (contract?.classHash) {
				acc[contract?.classHash] = false;
			}
			return acc;
		}, {})
	);

	const toggleCallTrace = useCallback(() => {
		setIsCallTraceExpanded((prev) => !prev);
	}, []);

	useEffect(() => {
		const newContractName = Object.keys(classesDebuggerData).find(
			(item) => classesDebuggerData[item].sourceCode === classSourceCode
		);
		if (newContractName) {
			openOneContract(newContractName);
		}
	}, [currentStepIndex]);

	const toggleContract = (contract: string) => {
		setOpenContracts((prev) => ({
			...prev,
			[contract]: !prev[contract]
		}));
	};

	const openOneContract = (contract: string) => {
		setOpenContracts(() => ({
			[contract]: true
		}));
	};

	if (!isCallTraceExpanded) {
		return (
			<div className={cn('w-full h-full flex flex-col', className)}>
				<button
					onClick={() => {
						toggleCallTrace();
						if (toggleExpand) {
							toggleExpand();
						}
					}}
					className="w-full px-2 py-1 flex items-center justify-between h-[32px]  hover:bg-neutral-50"
				>
					<span className="font-medium uppercase whitespace-nowrap">File explorer</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		);
	}

	return (
		<div className={cn('w-full h-full', className)}>
			<div className="h-full w-full flex flex-col">
				<button
					onClick={() => {
						toggleCallTrace();
						if (toggleExpand) {
							toggleExpand();
						}
					}}
					className="w-full px-2 py-1 flex items-center justify-between h-[32px] hover:bg-neutral-50"
				>
					<span className="font-medium uppercase whitespace-nowrap">File Explorer</span>
					<ChevronDown className="w-4 h-4" />
				</button>

				<ScrollArea className="flex-1">
					<div className="min-w-full">
						<div className="flex flex-col pb-2">
							{contracts.length > 0 ? (
								contracts.map((contract) => {
									let currentContractCall = Object.values(contractCallsMap).find(
										(item) => item.classHash === contract?.classHash
									);
									let contractName = currentContractCall
										? getContractName({ contractCall: currentContractCall })
										: '';
									return (
										<React.Fragment key={contract?.classHash}>
											<TooltipProvider>
												<Tooltip delayDuration={100}>
													<TooltipTrigger>
														<div
															className={`py-1 px-4 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2  ${
																contract?.classHash && openContracts[contract?.classHash]
																	? 'bg-neutral-100'
																	: 'hover:bg-neutral-50'
															}`}
															onClick={() =>
																contract?.classHash && toggleContract(contract?.classHash)
															}
														>
															{contract?.classHash && openContracts[contract?.classHash] ? (
																<ChevronDown className="w-4 h-4" />
															) : (
																<ChevronRight className="w-4 h-4" />
															)}
															<span className="uppercase">
																Contract: {contractName} (
																{`${contract?.entryPoint.storageAddress.slice(
																	0,
																	4
																)}...${contract?.entryPoint.storageAddress.slice(-4)}`}
																)
															</span>
														</div>
													</TooltipTrigger>
													<TooltipContent>
														<p>{contract?.entryPoint.storageAddress}</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											{contract?.classHash &&
												openContracts[contract?.classHash] &&
												Object.keys(classesDebuggerData[contract?.classHash].sourceCode).map(
													(file) => (
														<div
															key={file}
															className={cn(
																'py-1 pr-4 pl-8 transition-colors',
																activeFile === file && contract.callId === contractCall?.callId
																	? 'bg-neutral-100'
																	: 'cursor-pointer hover:bg-neutral-50'
															)}
															onClick={() => {
																setCurrentContractCall(contract);
																handleFileClick(file);
															}}
														>
															{file}
														</div>
													)
												)}
										</React.Fragment>
									);
								})
							) : (
								<div className="flex px-2 py-1">No available files</div>
							)}
						</div>
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
		</div>
	);
});
