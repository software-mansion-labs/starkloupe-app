import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import Link from 'next/link';
import { WALNUT_VERIFY_DOCS_URL } from '@/lib/config';

export function NonVerifiedBadge() {
	return (
		<TooltipProvider>
			<Tooltip delayDuration={100}>
				<TooltipTrigger asChild>
					<Link href={WALNUT_VERIFY_DOCS_URL} target="_blank">
						<Badge className="px-2 py-1 text-xs border rounded-full w-fit flex items-center gap-1 bg-red-100 border-red-400 text-red-900 dark:bg-opacity-40 dark:bg-red-500 dark:text-white cursor-pointer hover:bg-red-100">
							<ShieldExclamationIcon className="h-4 w-4" />
							Not Verified on Starkloupe
						</Badge>
					</Link>
				</TooltipTrigger>
				<TooltipContent className="bg-background border-border text-black dark:text-white border">
					Click to see how to verify Starknet contracts on Starkloupe
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
