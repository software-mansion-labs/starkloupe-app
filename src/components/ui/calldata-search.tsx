import React, { useState, useEffect, useRef, useContext } from 'react';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { CallTrace, InternalFnCallTrace } from '@/lib/simulation';
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
import { getContractName, getRawFunctionName } from '@/lib/utils';

const CalldataSearch = () => {
	const { callsMap, toggleCallExpand, scrollToTraceLineElement } = useCallTrace();

	const [searchTerm, setSearchTerm] = useState<string>('');
	const [searchResults, setSearchResults] = useState<
		[string, { contractCall?: CallTrace; fnCall?: InternalFnCallTrace }][]
	>([]);

	const inputRef = useRef<HTMLInputElement | null>(null);
	const resultsRef = useRef<HTMLDivElement | null>(null);
	const componentRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const results = searchCallsMap(searchTerm);
		setSearchResults(results);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm, callsMap]);

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

	const searchCallsMap = (
		term: string
	): [string, { contractCall?: CallTrace; fnCall?: InternalFnCallTrace }][] => {
		if (!term) return [];

		return Array.from(callsMap.entries()).filter(([key, value]) => {
			let contractName: string | undefined = undefined;
			let contractAddress: string | undefined = undefined;
			let splittedFnName: string[] | undefined = undefined;
			let entryPointFunctionName: string | undefined = undefined;

			if (value?.contractCall) {
				contractName = getContractName({ contractCall: value?.contractCall }).toLowerCase();
				entryPointFunctionName =
					value.contractCall?.additionalInfo?.entryPointFunctionName?.toLowerCase() || '';
				contractAddress = value.contractCall.entryPoint.storageAddress.toLowerCase();
			} else if (value?.fnCall?.data?.fnName && !value.fnCall.isHidden) {
				contractName = getRawFunctionName(value?.fnCall?.data?.fnName);
				splittedFnName = getRawFunctionName(value?.fnCall?.data?.fnName).split('::');

				if (splittedFnName.length >= 2) {
					contractName = splittedFnName[splittedFnName.length - 2].toLowerCase();
					entryPointFunctionName = splittedFnName[splittedFnName.length - 1].toLowerCase();
				}
			}
			const lowercaseTerm = term.toLowerCase();
			return (
				contractName?.includes(lowercaseTerm) ||
				contractAddress?.includes(lowercaseTerm) ||
				entryPointFunctionName?.includes(lowercaseTerm)
			);
		});
	};

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleResultClick = (result: {
		contractCall?: CallTrace;
		fnCall?: InternalFnCallTrace;
	}) => {
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

				<CommandList className="pr-2">
					{searchTerm && (
						<CommandGroup className="absolute shadow-md bg-white border pr-2 flex flex-col md:block rounded-b-lg max-h-96 max-w-full w-full md:w-2/5 items-start overflow-auto z-20 ">
							{searchResults.length > 0 ? (
								<div className="flex flex-col">
									{' '}
									{searchResults?.map(([key, value]) => (
										<CommandItem
											className="cursor-pointer pr-2 w-full"
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
														<>
															<div className="hidden">{key}</div>
															<div className="!text-xs ">
																<ContractCallSignature
																	displayFunctionName={false}
																	variant="search-result"
																	contractCall={value?.contractCall}
																/>
															</div>
															<div className="flex items-center gap-1 !text-xs">
																<div className="">
																	<ContractCallSignature
																		displayContractName={false}
																		variant="search-result"
																		contractCall={value?.contractCall}
																	/>
																</div>
																{value?.contractCall.additionalInfo.cairoLocation && (
																	<div className="underline">
																		in {value?.contractCall.additionalInfo.cairoLocation?.filePath},
																		line{' '}
																		{value?.contractCall.additionalInfo.cairoLocation?.start.line +
																			1}
																	</div>
																)}
															</div>
														</>
													) : value?.fnCall?.data.fnName ? (
														<>
															<div className="hidden">{key}</div>
															<div className="!text-xs ">
																<ContractCallSignature
																	displayFunctionName={false}
																	variant="search-result"
																	contractCall={
																		callsMap.get(
																			value.fnCall.data.id.match(/^\d+(-\d+)*(?=-fp)/)?.[0] ?? ''
																		)?.contractCall || undefined
																	}
																/>
															</div>
															<div className="flex items-center gap-1 !text-xs">
																<div>
																	<FnName
																		variant="search-result"
																		fnName={value.fnCall?.data.fnName}
																	/>
																</div>
																{value?.fnCall?.data.cairoLocation && (
																	<div className="underline">
																		in {value?.fnCall?.data.cairoLocation.filePath}, line{' '}
																		{value?.fnCall?.data.cairoLocation?.start.line + 1}
																	</div>
																)}
															</div>
														</>
													) : (
														<>Unkown contract</>
													)}
												</div>
											</div>
										</CommandItem>
									))}
								</div>
							) : (
								<CommandEmpty>No results found.</CommandEmpty>
							)}
						</CommandGroup>
					)}
				</CommandList>
			</Command>
		</div>
	);
};

export default CalldataSearch;
