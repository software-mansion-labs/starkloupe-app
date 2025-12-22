import React, { memo, useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { NoCodeLocationMessage, NoCodeMessage } from '@/components/call-trace/debugger-message';

export const DebugButton = memo(function DebugButton({
	onDebugClick,
	noCodeLocationAvaliable,
	isDebuggable
}: {
	onDebugClick: React.MouseEventHandler<HTMLDivElement>;
	noCodeLocationAvaliable?: boolean;
	isDebuggable?: boolean;
}) {
	const [tooltipOpen, setPopoverOpen] = useState(false);

	const bugIconClassName = 'w-h h-4';

	const handleDebugClick = useCallback(
		(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
			event.stopPropagation();
			if (isDebuggable) {
				onDebugClick(event);
			}
		},
		[isDebuggable, onDebugClick]
	);

	return (
		<div
			onClick={handleDebugClick}
			className="w-5 h-5 p-0.5 rounded-sm cursor-pointer hover:bg-accent_2"
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
							<BugAntIcon className={`${bugIconClassName} text-gray-700 dark:text-gray-400`} />
						</div>
					</PopoverTrigger>
					<PopoverContent className="text-sm text-muted-foreground">
						{noCodeLocationAvaliable ? <NoCodeLocationMessage /> : <NoCodeMessage />}
					</PopoverContent>
				</Popover>
			)}
		</div>
	);
});
