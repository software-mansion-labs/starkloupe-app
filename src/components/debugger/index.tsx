import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import { useContext, useState, useEffect, useCallback } from 'react';
import { CodeViewer } from '../code-viewer/code-viewer';
import { CallDebuggerData, ClassDebuggerData, CodeLocation } from '@/lib/simulation';
import {
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CallTrace } from '@/lib/simulation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface StepInfo {
	codeValue: string;
	codeLocation: CodeLocation;
	nextStepNumber: number;
}

export function Debugger({ calls }: { calls: CallTrace[] }) {
	const { debuggerInfo, debugCall } = useContext(DebuggerContext);
	const [contractAddress, setContractAddress] = useState<string | undefined>();

	const hasCall = calls.length > 0;

	const handleNestedDebugCalls = useCallback(
		(call: CallTrace, initialStepIndex: number) => {
			if (call.nestedCalls.length > 0 && call.nestedCalls[0].additionalInfo.callDebuggerData) {
				debugCall(call.nestedCalls[0], initialStepIndex);
			}
			setContractAddress(call.nestedCalls[0].entryPoint.storageAddress);
		},
		[debugCall]
	);

	useEffect(() => {
		if (hasCall && debuggerInfo === undefined) {
			handleNestedDebugCalls(calls[0], 0);
		}
	}, [hasCall, calls, debuggerInfo, handleNestedDebugCalls]);

	if (debuggerInfo) {
		const { callDebuggerData, classDebuggerData, initialStepIndex } = debuggerInfo;
		if (callDebuggerData.executionTrace && callDebuggerData.executionTrace.length > 0) {
			return (
				<DebuggerNotEmpty
					callDebuggerData={callDebuggerData}
					classDebuggerData={classDebuggerData}
					initialStepIndex={initialStepIndex}
				/>
			);
		}
	}

	return (
		<Alert className="m-4 w-fit">
			<ExclamationTriangleIcon className="h-5 w-5" />
			<AlertTitle>No source code for this contract</AlertTitle>
			<AlertDescription>
				<p className="mt-2 mb-1">
					Contract Address: <span className="font-mono">{contractAddress}</span>
				</p>
				<p>
					<span>Follow </span>
					<a
						href={
							'https://github.com/foundry-rs/starknet-foundry/blob/master/docs/src/starknet/verify.md'
						}
						className="text-blue-500 cursor-pointer"
						target="_blank"
						rel="noopener noreferrer"
					>
						this guide
					</a>
					<span> to verify the source code and run the debugger.</span>
				</p>
			</AlertDescription>
		</Alert>
	);
}

function DebuggerNotEmpty({
	callDebuggerData,
	classDebuggerData,
	initialStepIndex
}: {
	callDebuggerData: CallDebuggerData;
	classDebuggerData: ClassDebuggerData;
	initialStepIndex: number;
}) {
	const [stepIndex, setStepIndex] = useState<number>(initialStepIndex);
	const firstStepInfo = getStep(initialStepIndex, callDebuggerData, classDebuggerData);
	const [codeValue, setCodeValue] = useState<string>(firstStepInfo!.codeValue);
	const [codeLocation, setCodeLocation] = useState<CodeLocation>(firstStepInfo!.codeLocation);

	const totalSteps = callDebuggerData.executionTrace.length;

	function nextStep() {
		if (stepIndex >= totalSteps - 1) return;
		const nextStepInfo = getStep(stepIndex + 1, callDebuggerData, classDebuggerData);
		if (nextStepInfo) {
			setStepIndex(stepIndex + 1);
			setCodeValue(nextStepInfo.codeValue);
			setCodeLocation(nextStepInfo.codeLocation);
		} else {
			setStepIndex(totalSteps - 1);
		}
	}

	function previousStep() {
		if (stepIndex <= 0) return;
		const previousStepInfo = getStep(stepIndex - 1, callDebuggerData, classDebuggerData);
		if (previousStepInfo) {
			setStepIndex(stepIndex - 1);
			setCodeValue(previousStepInfo.codeValue);
			setCodeLocation(previousStepInfo.codeLocation);
		} else {
			setStepIndex(0);
		}
	}

	return (
		<div className="w-full h-[500px] flex flex-row">
			<FilesExplorer
				classSourceCode={classDebuggerData.sourceCode}
				activeFile={codeLocation.filePath}
			/>
			<div className="flex flex-col flex-grow">
				<Controls
					nextStep={nextStep}
					previousStep={previousStep}
					stepIndex={stepIndex}
					totalSteps={totalSteps}
				/>
				<div className="flex-grow">
					<CodeViewer
						code={codeValue}
						codeLocation={codeLocation}
						highlightClass="bg-yellow-300 bg-opacity-40"
						args={callDebuggerData.executionTrace[stepIndex].arguments}
						results={callDebuggerData.executionTrace[stepIndex].results}
					/>
				</div>
			</div>
		</div>
	);
}

function Controls({
	nextStep,
	previousStep,
	stepIndex,
	totalSteps
}: {
	nextStep: () => void;
	previousStep: () => void;
	stepIndex: number;
	totalSteps: number;
}) {
	return (
		<div className="flex flex-row border-b border-neutral-200 py-1 px-3 justify-between items-center">
			<div>
				Step {stepIndex + 1}/{totalSteps}
			</div>
			<div className="flex flex-row gap-1">
				<div
					onClick={() => previousStep()}
					className={`w-5 h-5 p-0.5 rounded-sm select-none ${
						stepIndex <= 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-neutral-100'
					}`}
				>
					<ArrowUturnLeftIcon className="w-4 h-4" />
				</div>
				<div
					onClick={() => nextStep()}
					className={`w-5 h-5 p-0.5 rounded-sm select-none ${
						stepIndex >= totalSteps - 1
							? 'cursor-not-allowed opacity-60'
							: 'cursor-pointer hover:bg-neutral-100'
					}`}
				>
					<ArrowUturnRightIcon className="w-4 h-4" />
				</div>
			</div>
		</div>
	);
}

function areEnqualLocations(location1: CodeLocation, location2: CodeLocation) {
	return (
		location1.filePath === location2.filePath &&
		location1.start.col === location2.start.col &&
		location1.start.line === location2.start.line &&
		location1.end.col === location2.end.col &&
		location1.end.line === location2.end.line
	);
}

function getStep(
	stepIndex: number,
	callDebuggerData: CallDebuggerData,
	classDebuggerData: ClassDebuggerData
): { codeValue: string; codeLocation: CodeLocation } | null {
	const step = callDebuggerData.executionTrace[stepIndex];
	const sierraIndex = step.sierraIndex;
	const locations = classDebuggerData.sierraStatementsToCairoInfo[sierraIndex]?.cairoLocations;
	const location = locations?.[0];
	const codeValue = location ? classDebuggerData.sourceCode[location.filePath] : undefined;
	if (!codeValue || !location) return null;
	return { codeValue, codeLocation: location };
}

function FilesExplorer({
	classSourceCode,
	activeFile
}: {
	classSourceCode: {
		[key: string]: string;
	};
	activeFile: string;
}) {
	const files = Object.keys(classSourceCode);
	return (
		<div className="w-[200px] border-r border-neutral-200">
			<div className="uppercase py-2 px-4 h-7">Source files</div>
			<div className="flex flex-col mt-4">
				{files.map((file) => (
					<div
						key={file}
						className={`py-1 px-4 ${
							activeFile === file ? 'bg-neutral-200' : 'cursor-pointer hover:bg-neutral-100'
						}`}
					>
						{file}
					</div>
				))}
			</div>
		</div>
	);
}
