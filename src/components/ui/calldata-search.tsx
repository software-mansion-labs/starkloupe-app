import React, { useState, useEffect, useRef, useContext, memo, useCallback } from 'react';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { ContractCall, EventCall, FunctionCall } from '@/lib/simulation';
import { ContractCallSignature } from './signature';

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from './command';
import { FnName } from './function-name';
import { getContractName } from '@/lib/utils';
import { useSettings } from '@/lib/context/settings-context-provider';
import { ScrollArea, ScrollBar } from './scroll-area';

const CalldataSearch = memo(function CalldataSearch() {
	const {
		contractCallsMap,
		functionCallsMap,
		toggleCallExpand,
		scrollToTraceLineElement,
		eventCallsMap
	} = useCallTrace();

	const { customSettings, updateContractName } = useSettings();
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [searchResults, setSearchResults] = useState<
		[number, { contractCall?: ContractCall; fnCall?: FunctionCall; evCall?: EventCall }][]
	>([]);

	const inputRef = useRef<HTMLInputElement | null>(null);
	const componentRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const results = searchCalls(searchTerm);
		setSearchResults(results);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
				setSearchTerm('');
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);
	const searchCalls = useCallback(
		(
			term: string
		): [number, { contractCall?: ContractCall; fnCall?: FunctionCall; evCall?: EventCall }][] => {
			if (!term) return [];

			const contractCalls: [number, { contractCall?: ContractCall }][] = Array.from(
				Object.entries(contractCallsMap)
			)
				.filter(([key, contractCall]) => {
					let contractName: string = getContractName({ contractCall }).toLowerCase();
					let customName: string | undefined =
						customSettings[contractCall.entryPoint.storageAddress]?.name?.toLowerCase();
					let contractAddress: string = contractCall.entryPoint.storageAddress.toLowerCase();
					let entryPointName: string = contractCall.entryPointName?.toLowerCase() || '';

					const lowercaseTerm = term.toLowerCase().trim();
					return (
						!contractCall.isHidden &&
						(contractName?.includes(lowercaseTerm) ||
							contractAddress?.includes(lowercaseTerm) ||
							entryPointName?.includes(lowercaseTerm) ||
							(customName && customName?.includes(lowercaseTerm)) ||
							`${contractName}.${entryPointName}`.includes(lowercaseTerm) ||
							(customName && `${customName}.${entryPointName}`.includes(lowercaseTerm)))
					);
				})
				.map(([key, contractCall]) => [parseInt(key), { contractCall }]);

			const eventCalls: [number, { evCall?: EventCall }][] = Array.from(
				Object.entries(eventCallsMap)
			)
				.filter(([key, eventCall]) => {
					let eventName: string = eventCall.name.toLowerCase();

					let eventSelector: string | undefined = eventCall.selector;
					const lowercaseTerm = term.toLowerCase().trim();
					return (
						(!eventCall.isHidden && eventName?.includes(lowercaseTerm)) ||
						eventSelector?.includes(lowercaseTerm)
					);
				})
				.map(([key, eventCall]) => [parseInt(key), { evCall: eventCall }]);

			const functionCalls: [number, { fnCall?: FunctionCall }][] = Array.from(
				Object.entries(functionCallsMap)
			)
				.filter(([key, functionCall]) => {
					let contractName: string = functionCall.fnName;
					let splittedFnName: string[] = functionCall.fnName.split('::');
					let entryPointFunctionName: string | undefined = undefined;

					if (splittedFnName.length >= 2) {
						contractName = splittedFnName[splittedFnName.length - 2].toLowerCase();
						entryPointFunctionName = splittedFnName[splittedFnName.length - 1].toLowerCase();
					}

					const lowercaseTerm = term.toLowerCase().trim();
					return (
						!functionCall.isHidden &&
						(contractName?.includes(lowercaseTerm) ||
							entryPointFunctionName?.includes(lowercaseTerm))
					);
				})
				.map(([key, functionCall]) => [parseInt(key), { fnCall: functionCall }]);

			return [...contractCalls, ...functionCalls, ...eventCalls];
		},
		[contractCallsMap, functionCallsMap, customSettings, eventCallsMap]
	);

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleResultClick = (result: { contractCall?: ContractCall; fnCall?: FunctionCall }) => {
		setSearchTerm('');
		inputRef.current?.focus();
	};

	return (
		<div className="h-full w-full relative" ref={componentRef}>
			<label htmlFor="search" className="sr-only ">
				Search
			</label>
			<Command className="bg-transparent ">
				<div>
					<CommandInput
						placeholder="Search"
						value={searchTerm}
						name="Search"
						onValueChange={(value) => handleSearchChange(value)}
						displayBorder={false}
						parentClassName="px-0"
					/>
				</div>

				<CommandList className="">
					{searchTerm && (
						<CommandGroup className="absolute shadow-md bg-white dark:bg-background border p-0 flex flex-col md:block rounded-b-lg w-full lg:w-2/5 items-start z-20">
							{searchResults.length > 0 ? (
								<ScrollArea className="h-96 w-full">
									<div className="flex flex-col pb-4">
										{searchResults?.map(([key, value]) => (
											<CommandItem
												className="cursor-pointer pr-2 w-full first:rounded-t-none "
												onSelect={() => {
													handleResultClick(value);
													toggleCallExpand(key);
													scrollToTraceLineElement(key);
												}}
												key={key}
											>
												<div className="pr-2">
													<div className="pr-2">
														{value.contractCall ? (
															<div className="flex items-center gap-2 text-xs">
																<div className="hidden">{key}</div>

																<span className="bg-green-100 w-14 border-green-400 border text-center text-green-900 dark:bg-opacity-40 dark:bg-green-500 dark:text-white text-xs px-1.5 py-0.5 rounded font-medium">
																	CALL
																</span>

																<div className="flex-1 min-w-0">
																	<div className="my-1">
																		<ContractCallSignature
																			updateContractName={updateContractName}
																			variant="search-result"
																			customSettings={customSettings}
																			contractCall={value?.contractCall}
																			isActiveDropdown={false}
																		/>
																	</div>
																</div>
															</div>
														) : value?.fnCall?.fnName ? (
															<div className="flex items-center gap-2 text-xs">
																<div className="hidden">{key}</div>

																<span className="bg-purple-100 w-14 border-purple-400 text-purple-900 dark:bg-opacity-40 dark:bg-purple-500 dark:text-white border text-center text-xs px-1.5 py-0.5 rounded font-medium">
																	FN
																</span>
																<div className="flex-1 min-w-0">
																	<div className="flex items-center gap-1 !text-xs">
																		<div>
																			<FnName
																				variant="search-result"
																				fnName={value.fnCall?.fnName}
																			/>
																		</div>
																		{value?.fnCall?.codeLocation && (
																			<div className="underline ">
																				in {value?.fnCall?.codeLocation.filePath}, line{' '}
																				{value?.fnCall?.codeLocation?.start.line + 1}
																			</div>
																		)}

																		<div className="!text-xs  !text-muted-foreground">
																			<ContractCallSignature
																				displayFunctionName={false}
																				contractCall={contractCallsMap[value.fnCall.contractCallId]}
																				customSettings={customSettings}
																				updateContractName={updateContractName}
																				isActiveDropdown={false}
																			/>
																		</div>
																	</div>
																</div>
															</div>
														) : value.evCall?.name ? (
															<div className="flex items-center gap-2 text-xs">
																<div className="hidden">{key}</div>

																<span className="bg-yellow-100 w-14 border-yellow-400 text-yellow-900 dark:bg-opacity-40 dark:bg-yellow-500 text-center dark:text-white border text-xs px-1.5 py-0.5 rounded font-medium">
																	EVENT
																</span>
																<div className="flex-1 min-w-0">
																	<div className="!text-xs ">
																		<div>{value.evCall.name}</div>
																	</div>
																</div>
															</div>
														) : (
															<>Unknown contract</>
														)}
													</div>
												</div>
											</CommandItem>
										))}
									</div>
									<ScrollBar orientation="horizontal" />
								</ScrollArea>
							) : (
								<div className="p-4">
									<CommandEmpty>No results found.</CommandEmpty>
								</div>
							)}
						</CommandGroup>
					)}
				</CommandList>
			</Command>
		</div>
	);
});

export default CalldataSearch;
