import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import { useContext, useState, useEffect, useCallback } from 'react';
import { CodeViewer } from '../code-viewer/code-viewer';
import {
	CallDebuggerData,
	ClassDebuggerData,
	CodeLocation,
	DebuggerExecutionTraceEntryWithContractCall,
	DebuggerExecutionTraceEntryWithLocation
} from '@/lib/simulation';
import {
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CallTrace } from '@/lib/simulation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { FilesExplorer } from '../code-viewer/file-explorer';

export function Debugger({ calls }: { calls: CallTrace[] }) {
	const { debuggerInfo, contractAddress, debugCall } = useContext(DebuggerContext);

	const hasCall = calls.length > 0;

	const handleNestedDebugCalls = useCallback(
		(call: CallTrace, initialStepIndex: number) => {
			if (call.nestedCalls.length > 0) {
				debugCall(call.nestedCalls[0], initialStepIndex);
			}
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
		} else {
			return (
				<Alert className="m-4 w-fit">
					<ExclamationTriangleIcon className="h-5 w-5" />
					<AlertTitle>No execution trace found.</AlertTitle>
					<AlertDescription>
						<p className="mt-2 mb-1">
							Contract Address: <span className="font-mono">{contractAddress}</span>
						</p>
					</AlertDescription>
				</Alert>
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
						href={'https://foundry-rs.github.io/starknet-foundry/starknet/verify.html'}
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
	// const firstStepInfo = getStep(initialStepIndex, callDebuggerData, classDebuggerData);
	// const [codeValue, setCodeValue] = useState<string>(firstStepInfo!.codeValue);
	// const [codeLocation, setCodeLocation] = useState<CodeLocation>(firstStepInfo!.codeLocation);
	const [stepInfo, setStepInfo] = useState<Step>(
		getStep(initialStepIndex, callDebuggerData, classDebuggerData)!
	);

	const [activeFile, setActiveFile] = useState(stepInfo.withLocation?.codeLocation.filePath);
	const [activeCodeLocation, setActiveCodeLocation] = useState(stepInfo.withLocation?.codeLocation);
	const [debugFile, setDebugFile] = useState(stepInfo.withLocation?.codeLocation.filePath);
	const [debugPosition, setDebugPosition] = useState(stepInfo.withLocation?.codeLocation);
	const [showArgsAndResults, setShowArgsAndResults] = useState(true);

	const totalSteps = callDebuggerData.executionTrace.length;

	const updateCodeLocationForStep = (step: Step) => {
		if (step?.withLocation) {
			const codeLocation = step.withLocation.codeLocation;
			setDebugFile(codeLocation.filePath);
			setDebugPosition(codeLocation);
			setActiveFile(codeLocation.filePath);
			setActiveCodeLocation(codeLocation);
		}
	};

	const handleFileClick = (file: string) => {
		if (file === debugFile) {
			// Restore the last debug position if switching back to the debug file
			setActiveCodeLocation(debugPosition);
			setShowArgsAndResults(true);
		} else {
			// Show the new file from the start
			const initialLocation = {
				start: { line: 0, col: 0 },
				end: { line: 0, col: 0 },
				filePath: file
			};
			setActiveCodeLocation(initialLocation);
			setShowArgsAndResults(false);
		}
		setActiveFile(file);
	};

	function nextStep() {
		if (stepIndex >= totalSteps - 1) return;
		const nextStepInfo = getStep(stepIndex + 1, callDebuggerData, classDebuggerData);
		if (nextStepInfo) {
			const newIndex = stepIndex + 1;
			setStepIndex(newIndex);
			setStepInfo(nextStepInfo);
			updateCodeLocationForStep(nextStepInfo);
			// setCodeValue(nextStepInfo.codeValue);
			// setCodeLocation(nextStepInfo.codeLocation);
		} else {
			setStepIndex(totalSteps - 1);
		}
	}

	function previousStep() {
		if (stepIndex <= 0) return;
		const previousStepInfo = getStep(stepIndex - 1, callDebuggerData, classDebuggerData);
		if (previousStepInfo) {
			const newIndex = stepIndex - 1;
			setStepIndex(newIndex);
			setStepInfo(previousStepInfo);
			updateCodeLocationForStep(previousStepInfo);
			// setCodeValue(previousStepInfo.codeValue);
			// setCodeLocation(previousStepInfo.codeLocation);
		} else {
			setStepIndex(0);
		}
	}
	return (
		<div className="w-full h-[500px] flex flex-row">
			<FilesExplorer
				classSourceCode={classDebuggerData.sourceCode}
				activeFile={activeFile}
				handleFileClick={handleFileClick}
			/>
			<div className="flex flex-col flex-grow">
				<Controls
					nextStep={nextStep}
					previousStep={previousStep}
					stepIndex={stepIndex}
					totalSteps={totalSteps}
				/>
				<div className="flex-grow">
					{stepInfo.withLocation && activeCodeLocation && activeFile ? (
						<CodeViewer
							code={classDebuggerData.sourceCode[activeFile]}
							codeLocation={activeCodeLocation}
							highlightClass="bg-yellow-300 bg-opacity-40"
							args={showArgsAndResults ? stepInfo.withLocation.arguments : undefined}
							results={showArgsAndResults ? stepInfo.withLocation.results : undefined}
						/>
					) : (
						<div className="p-6 font-mono">
							Contract call <br />
							<br />
							<div className="flex flex-row">
								<div className="w-36">Contract address:</div>{' '}
								<div>{stepInfo.withContractCall?.contractCall.contractAddress}</div>
							</div>
							<div className="flex flex-row">
								<div className="w-36">Entry point:</div>{' '}
								<div>{stepInfo.withContractCall?.contractCall.functionSelector}</div>
							</div>
						</div>
					)}
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

interface StepWithLocation extends DebuggerExecutionTraceEntryWithLocation {
	codeValue: string;
	codeLocation: CodeLocation;
}

type Step =
	| { withLocation: StepWithLocation; withContractCall?: undefined }
	| { withLocation?: undefined; withContractCall: DebuggerExecutionTraceEntryWithContractCall };

function getStep(
	stepIndex: number,
	callDebuggerData: CallDebuggerData,
	classDebuggerData: ClassDebuggerData
): Step | null {
	console.log('getStep', stepIndex, callDebuggerData, classDebuggerData);
	const step = callDebuggerData.executionTrace[stepIndex];
	if (step.withContractCall) {
		return step;
	} else if (step.withLocation) {
		const locations =
			classDebuggerData.sierraStatementsToCairoInfo[step.withLocation.sierraIndex]?.cairoLocations;
		const location = locations?.[0];
		const codeValue = location ? classDebuggerData.sourceCode[location.filePath] : undefined;
		if (!codeValue || !location) return null;
		return { withLocation: { codeValue, codeLocation: location, ...step.withLocation } };
	} else {
		// unreachable
		return null;
	}
}
