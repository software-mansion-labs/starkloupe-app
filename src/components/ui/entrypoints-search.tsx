import React, { useState, useEffect, useRef, useContext, memo, useCallback } from 'react';

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from './command';
import { ContractFunctions, FunctionData } from '@/lib/contracts';
import { useSettings } from '@/lib/context/settings-context-provider';
import { ScrollArea, ScrollBar } from './scroll-area';
import { shortenHash } from '@/lib/utils';

const EntryPointsSearch = memo(function EntryPointsSearch({
	entryPoints
}: {
	entryPoints: ContractFunctions | undefined;
}) {
	const { scrollToEntrypointElement } = useSettings();

	const [searchTerm, setSearchTerm] = useState<string>('');
	const [searchResults, setSearchResults] = useState<[string, FunctionData][]>([]);

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
		(term: string): [string, FunctionData][] => {
			if (!term || !entryPoints) return [];

			const entrypointsResults: [string, FunctionData][] = entryPoints.entry_point_datas
				.filter(([address, functionData]) => {
					let entryPointName: string = functionData.name;

					const lowercaseTerm = term.toLowerCase();
					return (
						address?.includes(lowercaseTerm) || entryPointName.toLowerCase().includes(lowercaseTerm)
					);
				})
				.map(([address, functionData]) => [address, functionData]);

			return [...entrypointsResults];
		},
		[entryPoints]
	);

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleResultClick = (result: FunctionData) => {
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
						<CommandGroup className="absolute shadow-md p-0 bg-white dark:bg-background border flex flex-col md:block rounded-b-lg w-full md:w-2/5 items-start z-20">
							{searchResults.length > 0 ? (
								<ScrollArea className="h-96 w-full">
									<div className="flex flex-col pb-4">
										{searchResults?.map(([key, value]) => (
											<CommandItem
												className="cursor-pointer !w-full first:rounded-t-none"
												onSelect={() => {
													handleResultClick(value);
													scrollToEntrypointElement(key);
												}}
												key={key}
											>
												<div className="pr-2">
													<div className="pr-2">
														<div className="flex gap-2 items-center">
															<div
																className={`w-14 border text-center text-xs px-1.5 py-0.5 rounded font-medium ${
																	value.state_mutability === 'view'
																		? 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200'
																		: 'bg-gray-800 border-gray-900 text-white dark:bg-gray-300 dark:border-gray-400 dark:text-gray-900'
																}`}
															>
																{value.state_mutability === 'view' ? 'Read' : 'Write'}
															</div>

															<div className=" ">{value.name}</div>
															<div className="!text-xs text-muted-foreground">
																{shortenHash(key, 13)}
															</div>
															<div className="flex items-center gap-1 !text-xs"></div>
														</div>
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

export default EntryPointsSearch;
