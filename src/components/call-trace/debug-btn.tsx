import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BugAntIcon } from '@heroicons/react/24/outline';

export function DebugButton({
	onDebugClick,
	isDebuggable
}: {
	onDebugClick: React.MouseEventHandler<HTMLDivElement>;
	isDebuggable?: boolean;
}) {
	const [tooltipOpen, setPopoverOpen] = useState(false);

	const bugIconClassName = 'w-h h-4';

	return (
		<div
			onClick={(event) => {
				event.stopPropagation();
				if (isDebuggable) {
					onDebugClick(event);
				}
			}}
			className="w-5 h-5 p-0.5 rounded-sm cursor-pointer hover:bg-neutral-200"
		>
			{isDebuggable ? (
				<BugAntIcon className={`${bugIconClassName} text-green-700`} />
			) : (
				<Popover open={tooltipOpen} onOpenChange={setPopoverOpen}>
					<PopoverTrigger asChild>
						<div
							onClick={(event) => {
								event.stopPropagation();
								setPopoverOpen(true);
							}}
						>
							<BugAntIcon className={`${bugIconClassName} text-gray-700`} />
						</div>
					</PopoverTrigger>
					<PopoverContent className="text-sm text-muted-foreground">
						This contract source code is not verified. To run the debugger, first verify the source
						code by following{' '}
						<a
							href={
								'https://github.com/foundry-rs/starknet-foundry/blob/master/docs/src/starknet/verify.md'
							}
							target="_blank"
							className="text-blue-500 cursor-pointer"
						>
							this guide
						</a>
						.
					</PopoverContent>
				</Popover>
			)}
		</div>
	);
}
