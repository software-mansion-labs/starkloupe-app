'use client';

import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Input } from './input';
import { useEffect, useState, useCallback } from 'react';
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
import { Network, useSettings } from '@/lib/context/settings-context';

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
	const [isMac, setIsMac] = useState(true);
	const { networks } = useSettings();

	const fetchSearchDataResponse = async (value: string) => {
		try {
			setSearchDataResponse(
				await fetchSearchData({ hash: value, rpcUrls: networks.map((n) => n.rpcUrl) })
			);
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

	useEffect(() => {
		// Set isMac state on client side
		setIsMac(
			typeof window !== 'undefined' && window.navigator.userAgent.toUpperCase().indexOf('MAC') >= 0
		);
	}, []); // Run only once after the component mounts

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
					displayBorder={!!searchDataResponse || !!error || searchValue.length > 3}
				/>
				<CommandList>
					{searchDataResponse ? (
						<>
							{searchDataResponse.transactions?.length > 0 && (
								<CommandGroup heading="Transactions">
									{searchDataResponse.transactions.map((tx, index) => (
										<SearchItem
											key={`${tx.hash}-${index}`}
											data={tx}
											type="transactions"
											networks={networks}
										/>
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
							{/* This is hot fix till we don't develop classes page*/}
							{searchDataResponse.classes?.length > 0 && <CommandEmpty>Nothing found</CommandEmpty>}
							{searchDataResponse.contracts?.length > 0 && (
								<CommandGroup heading="Contracts">
									{searchDataResponse.contracts.map((contract, index) => (
										<SearchItem
											key={`${contract.hash}-${index}`}
											data={contract}
											type="contracts"
											networks={networks}
										/>
									))}
								</CommandGroup>
							)}
						</>
					) : error ? (
						<CommandEmpty>Nothing found</CommandEmpty>
					) : (
						searchValue.length > 3 && <CommandEmpty>Loading...</CommandEmpty>
					)}
				</CommandList>
			</CommandDialog>
		</div>
	);
}

const SearchItem = ({
	data,
	type,
	networks
}: {
	data: SearchData;
	type: 'transactions' | 'contracts';
	networks: Network[];
}) => {
	const handleSearchItem = useCallback(() => {
		if (type === 'transactions') {
			if (data.source.rpcUrl) {
				window.location.href = `/transactions?rpcUrl=${encodeURIComponent(
					data.source.rpcUrl
				)}&txHash=${data.hash}`;
			} else if (data.source.chainId) {
				window.location.href = `/transactions?chainId=${data.source.chainId.toUpperCase()}&txHash=${
					data.hash
				}`;
			}
		} else if (type === 'contracts') {
			window.location.href = `/contracts/${data.hash}`;
		}
	}, [data, type]);

	const network = data.source.rpcUrl
		? networks.find((n) => n.rpcUrl === data.source.rpcUrl)
		: undefined;

	return (
		<CommandItem
			onSelect={handleSearchItem}
			className="truncate cursor-pointer !bg-transparent hover:!bg-accent"
			style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
		>
			{network ? (
				<Badge className="hover:bg-primary">{network.networkName}</Badge>
			) : data.source.chainId ? (
				<Badge className="hover:bg-primary">{data.source.chainId}</Badge>
			) : null}
			<p className="ml-2 text-[x-small] truncate">{data.hash}</p>
		</CommandItem>
	);
};
