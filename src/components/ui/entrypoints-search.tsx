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
				.map(([address, entryPointName]) => [address, entryPointName]);

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
						<CommandGroup className="absolute shadow-md bg-white dark:bg-background border pr-2 flex flex-col md:block rounded-b-lg max-h-96 max-w-full w-full md:w-2/5 items-start overflow-auto z-20 ">
							{searchResults.length > 0 ? (
								<div className="flex flex-col">
									{' '}
									{searchResults?.map(([key, value]) => (
										<CommandItem
											className="cursor-pointer pr-2 w-full"
											onSelect={() => {
												handleResultClick(value);
												console.log('key', key);
												scrollToEntrypointElement(key);
											}}
											key={key}
										>
											<div className="pr-2">
												<div className="pr-2">
													<>
														<div className="">{key}</div>
														<div className="!text-xs ">{value.name}</div>
														<div className="flex items-center gap-1 !text-xs"></div>
													</>
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
});

export default EntryPointsSearch;
