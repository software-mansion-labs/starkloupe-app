import { memo, useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CommonCallTrace } from '../call-trace/common-call-trace';
import { ChevronRight, ChevronDown } from 'lucide-react';

export const CallTracePreview = memo(function FilesExplorer({
	className,
	toggleExpand
}: {
	className?: string;
	toggleExpand: () => void;
}) {
	const [isCallTraceExpanded, setIsCallTraceExpanded] = useState(true);

	const toggleCallTrace = useCallback(() => {
		setIsCallTraceExpanded((prev) => !prev);
	}, []);

	if (!isCallTraceExpanded) {
		return (
			<div className={cn('w-full h-full flex flex-col', className)}>
				<button
					onClick={() => {
						toggleCallTrace();
						toggleExpand();
					}}
					className="w-full px-2 py-1 flex items-center justify-between hover:bg-neutral-50  h-full "
				>
					<span className="font-medium uppercase">Call Trace Preview</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		);
	}

	return (
		<div className={cn('w-full h-full', className)}>
			<div className="h-full flex flex-col">
				<button
					onClick={() => {
						toggleCallTrace();
						toggleExpand();
					}}
					className="w-full px-2 py-1 flex items-center justify-between hover:bg-neutral-50  h-[32px]"
				>
					<span className="font-medium uppercase">Call trace preview</span>
					<ChevronDown className="w-4 h-4" />
				</button>

				<ScrollArea className="flex-1">
					<div className="min-w-full pb-2">
						<CommonCallTrace previewMode callId={1} nestingLevel={0} callType="contract" />
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
		</div>
	);
});

export default CallTracePreview;
