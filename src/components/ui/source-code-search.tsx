import React, { useState, useEffect, useRef, memo, useCallback } from 'react';

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from './command';
import { File } from 'lucide-react';
import { ScrollArea, ScrollBar } from './scroll-area';

const SourceCodeSearch = memo(function SourceCodeSearch({
	sourceCode,
	handleFileClick
}: {
	sourceCode: { [key: string]: string } | undefined;
	handleFileClick: (filePath: string) => void;
}) {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [searchResults, setSearchResults] = useState<string[]>([]);

	const componentRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const results = searchFiles(searchTerm);
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

	const searchFiles = useCallback(
		(term: string): string[] => {
			if (!term || !sourceCode) return [];

			const filesResults = Object.keys(sourceCode).filter((fileName) => {
				const lowercaseTerm = term.toLowerCase().trim();
				return fileName.toLowerCase().includes(lowercaseTerm);
			});

			return [...filesResults];
		},
		[sourceCode]
	);

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
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
						<CommandGroup className="absolute shadow-md p-0 bg-white dark:bg-background border  flex flex-col md:block rounded-b-lg w-full md:w-2/5 items-start z-20">
							{searchResults.length > 0 ? (
								<ScrollArea className="h-96 w-full">
									<div className="flex flex-col pb-4">
										{searchResults?.map((value) => (
											<CommandItem
												className="cursor-pointer pr-2 !w-full first:rounded-t-none"
												onSelect={() => {
													handleFileClick(value);
													setSearchTerm('');
												}}
												key={value}
											>
												<div className="pr-2">
													<div className="pr-2 !text-xs">
														<div className="flex items-center gap-1">
															<File size={16} />
															<div className="">{value}</div>
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

export default SourceCodeSearch;
