import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import { useContext, useState } from 'react';
import { CodeViewer } from '../code-viewer/code-viewer';
import { CallDebuggerData, ClassDebuggerData, CodeLocation } from '@/lib/simulation';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';

interface StepInfo {
	codeValue: string;
	codeLocation: CodeLocation;
	nextStepNumber: number;
}

export function Debugger() {
	const { debuggerInfo, debugCall } = useContext(DebuggerContext);

	if (debuggerInfo) {
		const { callDebuggerData, classDebuggerData } = debuggerInfo;
		if (callDebuggerData.sierraExecutionTrace.length > 0) {
			return (
				<DebuggerNotEmpty
					callDebuggerData={callDebuggerData}
					classDebuggerData={classDebuggerData}
				/>
			);
		} else {
			return <>No data</>;
		}
	}

	return <>No data</>;
}

function DebuggerNotEmpty({
	callDebuggerData,
	classDebuggerData
}: {
	callDebuggerData: CallDebuggerData;
	classDebuggerData: ClassDebuggerData;
}) {
	const [stepIndex, setStepIndex] = useState<number>(0);
	const firstStepInfo = findStep({
		stepIndex: 0,
		callDebuggerData,
		classDebuggerData,
		direction: 'next'
	});
	const [codeValue, setCodeValue] = useState<string>(firstStepInfo!.codeValue);
	const [codeLocation, setCodeLocation] = useState<CodeLocation>(firstStepInfo!.codeLocation);

	const totalSteps = callDebuggerData.sierraExecutionTrace.length;

	function nextStep() {
		if (stepIndex >= totalSteps - 1) return;
		const nextStepInfo = findStep({
			stepIndex: stepIndex + 1,
			currentLocation: codeLocation,
			callDebuggerData,
			classDebuggerData,
			direction: 'next'
		});
		if (nextStepInfo) {
			setStepIndex(nextStepInfo.stepIndex);
			setCodeValue(nextStepInfo.codeValue);
			setCodeLocation(nextStepInfo.codeLocation);
		} else {
			setStepIndex(totalSteps - 1);
		}
	}

	function previousStep() {
		if (stepIndex <= 0) return;
		const previousStepInfo = findStep({
			stepIndex: stepIndex - 1,
			currentLocation: codeLocation,
			callDebuggerData,
			classDebuggerData,
			direction: 'previous'
		});
		if (previousStepInfo) {
			setStepIndex(previousStepInfo.stepIndex);
			setCodeValue(previousStepInfo.codeValue);
			setCodeLocation(previousStepInfo.codeLocation);
		} else {
			setStepIndex(0);
		}
	}

	return (
		<div className="w-full h-[500px] flex flex-row border-t border-neutral-200">
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

function findStep({
	stepIndex,
	currentLocation,
	callDebuggerData,
	classDebuggerData,
	direction
}: {
	stepIndex: number;
	callDebuggerData: CallDebuggerData;
	classDebuggerData: ClassDebuggerData;
	currentLocation?: CodeLocation;
	direction: 'next' | 'previous';
}): { codeValue: string; codeLocation: CodeLocation; stepIndex: number } | null {
	if (stepIndex >= callDebuggerData.sierraExecutionTrace.length || stepIndex < 0) return null;
	const sierraIndexes = callDebuggerData.sierraExecutionTrace[stepIndex];
	const firstIndex = sierraIndexes[0];
	if (firstIndex) {
		const locations = classDebuggerData.sierraStatementsToCairoInfo[firstIndex]?.cairoLocations;
		const location = locations?.[0];
		if (location) {
			if (currentLocation && areEnqualLocations(location, currentLocation)) {
				return findStep({
					stepIndex: direction === 'next' ? stepIndex + 1 : stepIndex - 1,
					callDebuggerData,
					classDebuggerData,
					currentLocation,
					direction
				});
			}
			const codeValue = classDebuggerData.sourceCode[location.filePath];
			return { codeLocation: location, codeValue, stepIndex };
		}
	}
	return findStep({
		stepIndex: direction === 'next' ? stepIndex + 1 : stepIndex - 1,
		currentLocation,
		callDebuggerData,
		classDebuggerData,
		direction
	});
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
