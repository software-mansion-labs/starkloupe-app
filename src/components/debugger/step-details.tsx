import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { cn } from '@/lib/utils';
import { DebuggerExecutionTraceEntry, FunctionCall, InternalFnCallIO } from '@/lib/simulation';
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
	let args: InternalFnCallIO[] = [];
	let result: InternalFnCallIO[] = [];

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
		//@ts-ignore
		args = functionCallDetails?.argumentsDecoded || [];
		//@ts-ignore
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
			<ScrollArea className="flex-1">
				{loading ? (
					<StepDetailsSkeleton />
				) : step && stepWithLocation ? (
					<FunctionCallViewer data={filteredStepInfo} />
				) : (
					<div className="flex px-2 py-1">No Function Call Details</div>
				)}

				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}

const StepDetailsSkeleton = () => {
	return (
		<div className="font-mono px-2 my-2">
			<div className="font-bold mb-1.5 flex items-center gap-2">
				<span>Contract:</span>
				<Skeleton className="h-4 w-24" />
			</div>
			<div className="font-bold mb-1.5 flex items-center gap-2">
				<span>Function:</span>
				<Skeleton className="h-4 w-24" />
			</div>
			<div className="mb-1.5">
				<div className="whitespace-nowrap mb-1.5">
					<div className="flex items-center gap-2 mb-2">
						<span className="font-bold">Paramenters:</span>
					</div>
					<div className="ml-2">
						<div className="flex items-center gap-2 mb-1.5">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-12" />
						</div>
						<div className="ml-4">
							<div className="flex items-center gap-2 mb-1.5">
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-4 w-20" />
							</div>
							<div className="flex items-center gap-2 mb-1.5">
								<Skeleton className="h-4 w-8" />
								<Skeleton className="h-4 w-16" />
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="mb-1.5">
				<div className="whitespace-nowrap mb-1.5">
					<div className="flex items-center gap-2 mb-2">
						<span className="font-bold">Results:</span>
					</div>
					<div className="ml-2">
						<div className="flex items-center gap-2 mb-1.5">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-20" />
						</div>
						<div className="ml-4">
							<div className="flex items-center gap-2 mb-1.5">
								<Skeleton className="h-4 w-10" />
								<Skeleton className="h-4 w-24" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
