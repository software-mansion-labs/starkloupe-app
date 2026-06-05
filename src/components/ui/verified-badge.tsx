import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const badgeClass =
	'px-2 py-1 text-xs border rounded-full w-fit flex items-center bg-green-100 border-green-400 text-green-900 dark:bg-opacity-40 dark:bg-green-500 dark:text-white';

function capitalize(source: string) {
	return source.charAt(0).toUpperCase() + source.slice(1);
}

export function VerifiedBadge({ sources }: { sources?: string[] }) {
	const [isOpen, setIsOpen] = useState(false);
	const contentRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!isOpen) return;

		const closeIfOutside = (e: Event) => {
			const target = e.target as Node | null;
			if (contentRef.current && target && contentRef.current.contains(target)) return;
			setIsOpen(false);
		};

		const opts: AddEventListenerOptions = { passive: true, capture: true };

		document.addEventListener('scroll', closeIfOutside, opts);
		document.addEventListener('touchmove', closeIfOutside, opts);
		document.addEventListener('wheel', closeIfOutside, opts);
		window.addEventListener('resize', closeIfOutside);

		return () => {
			document.removeEventListener('scroll', closeIfOutside, opts);
			document.removeEventListener('touchmove', closeIfOutside, opts);
			document.removeEventListener('wheel', closeIfOutside, opts);
			window.removeEventListener('resize', closeIfOutside);
		};
	}, [isOpen]);

	const sourcesToRender = sources ?? [];

	if (sourcesToRender.length === 0) return null;

	if (sourcesToRender.length === 1) {
		return (
			<Badge className={`${badgeClass} pointer-events-none`}>
				<div className="h-4"></div>
				<div className="flex gap-1 items-center">
					<ShieldCheckIcon className="h-4 w-4" />
					Verified on {capitalize(sourcesToRender[0])}
				</div>
			</Badge>
		);
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<button className="focus:outline-none">
					<Badge
						className={`${badgeClass} cursor-pointer hover:!bg-green-200 dark:hover:!bg-green-600 transition-colors`}
					>
						<div className="h-4"></div>
						<div className="flex gap-1 items-center">
							<ShieldCheckIcon className="h-4 w-4" />
							Verified on {sourcesToRender.length} sources
						</div>
					</Badge>
				</button>
			</PopoverTrigger>
			<PopoverContent ref={contentRef} className="w-auto max-w-xs p-3" side="bottom" sideOffset={5}>
				<div className="space-y-2">
					{sourcesToRender.map((source, index) => (
						<div
							key={index}
							className="flex gap-1 items-center text-xs text-green-900 dark:text-green-400"
						>
							<ShieldCheckIcon className="h-4 w-4" />
							{capitalize(source)}
						</div>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
