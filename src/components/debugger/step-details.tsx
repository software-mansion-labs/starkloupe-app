import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { cn } from '@/lib/utils';
import { DebuggerExecutionTraceEntry, InternalFnCallIO } from '@/lib/simulation';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import FunctionCallViewer from '../ui/function-call-viewer';

interface StepDetailsProps {
	step: DebuggerExecutionTraceEntry;
	className?: string;
}

export function StepDetails({ step, className }: StepDetailsProps) {
	const { simulationResult } = useCallTrace();

	const stepWithLocation = step.withLocation;
	if (!stepWithLocation) return;
	let functionName: string | undefined = undefined;
	let args: InternalFnCallIO[] = [];
	let result: InternalFnCallIO[] = [];

	const functionCallDetails = simulationResult.functionCallsMap[stepWithLocation.functionCallId];
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
		function: functionName,
		args,
		result
	};

	return (
		<div className={cn('w-full flex flex-col', className)}>
			<div className="uppercase px-2 my-2 font-medium">Function Call Details</div>
			<ScrollArea className="flex-1">
				<FunctionCallViewer data={filteredStepInfo} />
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}
