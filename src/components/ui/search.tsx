'use client';

import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Input } from './input';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger
} from './dropdown-menu';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { cn, useChain } from '@/lib/utils';

function getChainIdFromPathname(pathname: string) {
	const chainId = pathname.split('/')[2];
	return chainId ?? 'SN_MAIN';
}

export function Search({
	className,
	placeholder,
	isTxSearch,
	isSearchButton,
	isChainSelector,
	...props
}: React.ComponentPropsWithoutRef<'div'> & {
	isTxSearch?: boolean;
	onSearch?: (value: string) => void;
	isSearchButton?: boolean;
	isChainSelector?: boolean;
}) {
	const router = useRouter();
	const pathname = usePathname();

	const [searchValue, setSearchValue] = useState('');

	const { chainId, chainName } = useChain();

	function changeChainId(id: string) {
		if (id === chainId) return;
		router.push(`/transactions/${id}`);
	}

	function onSearch() {
		if (props.onSearch) props.onSearch(searchValue);
		else if (searchValue && searchValue.trim().length > 0)
			router.push(`/transactions/${getChainIdFromPathname(pathname)}/${searchValue}`);
	}

	return (
		<div className={cn('flex flex-row', className)} {...props}>
			<label htmlFor="search" className="sr-only">
				Search by tx hash
			</label>
			<div className="relative flex-1">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
				</div>
				<Input
					className={`pl-10 ${isChainSelector ? 'rounded-r-none' : ''}`}
					placeholder={placeholder}
					type="search"
					name="search"
					value={searchValue}
					onInput={(e) => setSearchValue(e.currentTarget.value)}
					onKeyDown={(e) => e.key === 'Enter' && onSearch()}
				/>
				{isSearchButton && searchValue.trim().length > 0 && (
					<Button size="sm" className="absolute inset-y-1 right-1 h-auto" onClick={onSearch}>
						Search
					</Button>
				)}
			</div>
			{isChainSelector && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="relative pr-10 min-w-[7rem] rounded-l-none border-l-0"
						>
							{chainName} <ChevronUpDownIcon className="w-5 h-5 absolute right-2" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56">
						<DropdownMenuRadioGroup value={chainId} onValueChange={changeChainId}>
							<DropdownMenuRadioItem value="SN_MAIN">Mainnet</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="SN_SEPOLIA">Testnet</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
