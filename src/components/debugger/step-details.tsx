import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { cn } from '@/lib/utils';
import { DecodedItem, DebuggerExecutionTraceEntry, FunctionCall, InternalFnCallIO } from '@/lib/simulation';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import FunctionCallViewer from '../ui/function-call-viewer';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';

interface StepDetailsProps {
	step: DebuggerExecutionTraceEntry | undefined;
	functionCallsMap: { [key: number]: FunctionCall };
	className?: string;
	toggleExpand: () => void;
	loading?: boolean;
}

export function StepDetails({
	step,
	functionCallsMap,
	className,
	toggleExpand,
	loading = false
}: StepDetailsProps) {
	const [isCallTraceExpanded, setIsCallTraceExpanded] = useState(true);

	const { contractCallsMap } = useCallTrace();

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
					className="w-full px-2 py-1 flex items-center justify-between hover:bg-accent h-full"
				>
					<span className="font-medium uppercase whitespace-nowrap">Function Call Details</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		);
	}

	const stepWithLocation = step?.withLocation || undefined;

	let functionName: string | undefined = undefined;
	let args: InternalFnCallIO[] | DecodedItem[] = [];
	let result: InternalFnCallIO[] | DecodedItem[] = [];

	const contractCallDetails = stepWithLocation?.contractCallId
		? contractCallsMap[stepWithLocation?.contractCallId]
		: undefined;

	const functionCallDetails = stepWithLocation?.functionCallId
		? functionCallsMap?.[stepWithLocation.functionCallId]
		: undefined;
	if (functionCallDetails) {
		const fullFnName = functionCallDetails?.fnName;
		functionName =
			fullFnName && fullFnName.includes('::')
				? fullFnName
						.replace(/::[^:]*<.*>/, '')
						.trim()
						.split('::')
						.pop()
				: fullFnName || '';
		args = functionCallDetails?.argumentsDecoded || [];
		result = functionCallDetails?.resultsDecoded || [];
	}

	const filteredStepInfo = {
		contractCallDetails,
		function: functionName,
		args,
		result
	};

	return (
		<div className={cn('w-full h-full flex flex-col', className)}>
			<button
				onClick={() => {
					toggleCallTrace();
					toggleExpand();
				}}
				className="w-full px-2 py-1 flex items-center justify-between hover:bg-accent h-[32px]"
			>
				<span className="font-medium uppercase whitespace-nowrap">Function Call Details</span>
				<ChevronDown className="w-4 h-4" />
			</button>
			<ScrollArea className="flex-1 bg-background">
				<div className="">
					{loading ? (
						<StepDetailsSkeleton />
					) : step && stepWithLocation ? (
						<div className="px-2 py-1">
							<FunctionCallViewer data={filteredStepInfo} />
						</div>
					) : (
						<div className="flex flex-col items-center justify-center h-40 text-muted-foreground m-2">
							<svg
								className="w-12 h-12 mb-2 opacity-20"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<p className="text-sm">No call details available</p>
						</div>
					)}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}

const StepDetailsSkeleton = () => {
	return (
		<div className="space-y-1.5 px-2">
			<div className="flex gap-1.5"></div>

			<div className="bg-card/50 backdrop-blur-sm rounded-md border border-border/50 p-2">
				<div className="flex items-center gap-1.5 mb-1">
					<div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
					<Skeleton className="h-2.5 w-16" />
				</div>
				<div className="ml-4 space-y-1">
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-4/5 ml-2" />
					<Skeleton className="h-3 w-3/4 ml-2" />
				</div>
			</div>
		</div>
	);
};
