'use client';

import { cn } from '@/lib/utils';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Input } from './input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Search({
	className,
	placeholder,
	isTxSearch,
	...props
}: React.ComponentPropsWithoutRef<'div'> & {
	isTxSearch?: boolean;
	onEnter?: (value: string) => void;
}) {
	const router = useRouter();

	const [searchValue, setSearchValue] = useState('');

	function onEnter() {
		if (props.onEnter) props.onEnter(searchValue);
		if (searchValue && searchValue.trim().length > 0) router.push(`/tx/1/${searchValue}`);
	}

	return (
		<div className={cn('mx-auto max-w-7xl', className)} {...props}>
			<label htmlFor="search" className="sr-only">
				Search
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
					onKeyDown={(e) => e.key === 'Enter' && onEnter()}
				/>
			</div>
		</div>
	);
}
