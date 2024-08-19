'use client';

import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Input } from './input';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from './command';
import { cn } from '@/lib/utils';
import { fetchSearchData } from '@/lib/api';
import { SearchDataResponse, SearchData } from '@/lib/types';
import { Badge } from './badge';

export function Search({
	className,
	placeholder,
	...props
}: React.ComponentPropsWithoutRef<'div'> & {
	placeholder: string;
}) {
	const [searchValue, setSearchValue] = useState('');
	const [searchDataResponse, setSearchDataResponse] = useState<SearchDataResponse | undefined>();
	const [error, setError] = useState<string | undefined>();
	const [open, setOpen] = useState(false);

	const fetchSearchDataResponse = async (value: string) => {
		try {
			setSearchDataResponse(await fetchSearchData({ hash: value }));
		} catch (error: any) {
			setError(error.toString());
		}
	};

	useEffect(() => {
		setSearchDataResponse(undefined);
		setError(undefined);

		if (open && searchValue.trim().length > 3) {
			fetchSearchDataResponse(searchValue);
		} else {
			setSearchValue('');
		}
	}, [searchValue, open]);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
	}, []);

	const isMac =
		typeof window !== 'undefined' && window.navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;

	return (
		<div className={cn('flex flex-row', className)} {...props}>
			<label htmlFor="search" className="sr-only">
				Search
			</label>
			<div className="relative flex-1">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
				</div>
				<Input
					className="pl-10"
					placeholder={placeholder}
					type="search"
					name="search"
					onFocus={() => setOpen(true)}
				/>
				<div className="pointer-events-none border border-neutral-200 text-neutral-600 rounded-sm text-sm absolute right-0 inset-y-1.5 mr-1.5 p-1 flex items-center">
					{isMac ? '⌘K' : 'Ctrl+K'}
				</div>
			</div>
			<CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
				<CommandInput
					placeholder="Search for transaction or contract"
					onValueChange={(value) => setSearchValue(value)}
				/>
				<CommandList>
					{searchDataResponse ? (
						<>
							{searchDataResponse.transactions?.length > 0 && (
								<CommandGroup heading="Transactions">
									{searchDataResponse.transactions.map((tx, index) => (
										<SearchItem key={`${tx.hash}-${index}`} data={tx} type="transactions" />
									))}
								</CommandGroup>
							)}
							{/*
							{searchDataResponse.classes?.length > 0 && (
								<CommandGroup heading="Classes">
									{searchDataResponse.classes.map((cls, index) => (
										<SearchItem key={`${cls.hash}-${index}`} data={cls} type="classes" />
									))}
								</CommandGroup>
							)}
							*/}
							{searchDataResponse.contracts?.length > 0 && (
								<CommandGroup heading="Contracts">
									{searchDataResponse.contracts.map((contract, index) => (
										<SearchItem
											key={`${contract.hash}-${index}`}
											data={contract}
											type="contracts"
										/>
									))}
								</CommandGroup>
							)}
						</>
					) : error ? (
						<CommandEmpty>No data found</CommandEmpty>
					) : (
						searchValue.length > 3 && <CommandEmpty>Loading...</CommandEmpty>
					)}
				</CommandList>
			</CommandDialog>
		</div>
	);
}

const SearchItem = ({ data, type }: { data: SearchData; type: string }) => {
	const router = useRouter();

	const handleSearchItem = useCallback(() => {
		router.push(`/${type}/${data.chainId.toUpperCase()}/${data.hash}`);
	}, [router, data, type]);

	return (
		<CommandItem onSelect={handleSearchItem}>
			<Badge>{data.chainId}</Badge>
			<p className="ml-2 text-[x-small]">{data.hash}</p>
		</CommandItem>
	);
};
