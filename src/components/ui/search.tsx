'use client';

import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Input } from './input';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './button';

function getChainIdFromPathname(pathname: string) {
	const chainId = pathname.split('/')[2];
	return chainId ?? 'SN_MAIN';
}

export function Search({
	className,
	placeholder,
	isTxSearch,
	isSearchButton,
	...props
}: React.ComponentPropsWithoutRef<'div'> & {
	isTxSearch?: boolean;
	onSearch?: (value: string) => void;
	isSearchButton?: boolean;
}) {
	const router = useRouter();
	const pathname = usePathname();

	const [searchValue, setSearchValue] = useState('');

	function onSearch() {
		if (props.onSearch) props.onSearch(searchValue);
		else if (searchValue && searchValue.trim().length > 0)
			router.push(`/transactions/${getChainIdFromPathname(pathname)}/${searchValue}`);
	}

	return (
		<div className={className} {...props}>
			<label htmlFor="search" className="sr-only">
				Search by tx hash
			</label>
			<div className="relative">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
				</div>
				<Input
					className="pl-10"
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
		</div>
	);
}
