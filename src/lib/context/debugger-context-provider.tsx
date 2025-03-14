import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import {
	ClassDebuggerData,
	CodeLocation,
	ContractCall,
	DebuggerExecutionTraceEntry,
	SimulationDebuggerData
} from '@/lib/simulation';
import { CallTraceContext } from './call-trace-context-provider';

interface DebuggerContextProps {
	classesDebuggerData: {
		[key: string]: ClassDebuggerData;
	};
	currentStep?: DebuggerExecutionTraceEntry;
	totalSteps: number;
	currentStepIndex: number;
	activeFile: string | undefined;
	contractCall?: ContractCall;
	codeLocation?: CodeLocation;
	sourceCode: {
		[key: string]: string;
	};
	availableBreakpoints: { [key: string]: { [key: string]: number[] } };
	debugFunctionCall: (functionCallId: number) => void;
	debugContractCall: (contractCallId: number) => void;
	nextStep: () => void;
	prevStep: () => void;
	stepOver: () => void;
	runToBreakpoint: () => void;
	setActiveFile: (filePath: string) => void;
	isFunctionCallDebuggable: (functionCallId: number) => boolean;
	isContractCallDebuggable: (contractCallId: number) => boolean;
	fileBreakpoints: { [key: string]: { [key: string]: number[] } };
	toggleBreakpoint: (lineNumber: number, activeFile: string, classHash: string) => void;
}

export const DebuggerContext = createContext<DebuggerContextProps>({
	classesDebuggerData: {},
	currentStep: undefined,
	totalSteps: 0,
	currentStepIndex: 0,
	activeFile: undefined,
	sourceCode: {},
	contractCall: undefined,
	codeLocation: undefined,
	availableBreakpoints: {},
	debugFunctionCall: () => undefined,
	debugContractCall: () => undefined,
	nextStep: () => undefined,
	prevStep: () => undefined,
	stepOver: () => undefined,
	runToBreakpoint: () => undefined,
	setActiveFile: () => undefined,
	isFunctionCallDebuggable: () => false,
	isContractCallDebuggable: () => false,
	fileBreakpoints: {},
	toggleBreakpoint: () => undefined
});

export const DebuggerContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { contractCallsMap, functionCallsMap, simulationResult, simulationDebuggerData } =
		useContext(CallTraceContext);

	const availableBreakpoints = useMemo(() => {
		const breakpoints: { [key: string]: { [key: string]: number[] } } = {};

		for (const classHash in simulationDebuggerData.classesDebuggerData) {
			breakpoints[classHash] = {};
			if (simulationDebuggerData.classesDebuggerData[classHash]) {
				for (const sierraIndex in simulationDebuggerData.classesDebuggerData[classHash]
					.sierraStatementsToCairoInfo) {
					const info =
						simulationDebuggerData.classesDebuggerData[classHash].sierraStatementsToCairoInfo[
							sierraIndex
						];
					for (const cairoLocation of info.cairoLocations) {
						if (!breakpoints[classHash][cairoLocation.filePath]) {
							breakpoints[classHash][cairoLocation.filePath] = [];
						}
						const start = cairoLocation.start.line;
						const end = cairoLocation.end.line;
						for (let i = start; i <= end; i++) {
							if (!breakpoints[classHash][cairoLocation.filePath].includes(i)) {
								breakpoints[classHash][cairoLocation.filePath].push(i);
							}
						}
					}
				}
			}
		}

		return breakpoints;
	}, [simulationDebuggerData]);

	const [currentStepIndex, _setCurrentStepIndex] = useState(
		simulationDebuggerData.debuggerTrace.length > 0
			? findInitialIndex(simulationDebuggerData.debuggerTrace)
			: 0
	);
	const [currentStep, _setCurrentStep] = useState(
		simulationDebuggerData.debuggerTrace.length > 0
			? simulationDebuggerData.debuggerTrace[currentStepIndex]
			: undefined
	);

	const initialDebuggerData =
		currentStep &&
		getDebuggerDataForStep(contractCallsMap, simulationResult.simulationDebuggerData, currentStep);

	const [activeFile, setActiveFile] = useState<string | undefined>(
		initialDebuggerData && initialDebuggerData.activeFile
	);
	const [fileBreakpoints, setFileBreakpoints] = useState<{
		[key: string]: { [key: string]: number[] };
	}>({});

	const toggleBreakpoint = (lineNumber: number, activeFile: string, classHash: string) => {
		setFileBreakpoints((prev) => {
			const newFileBreakpoints = JSON.parse(JSON.stringify(prev));

			if (!newFileBreakpoints[classHash]) {
				newFileBreakpoints[classHash] = {};
			}

			if (!newFileBreakpoints[classHash][activeFile]) {
				newFileBreakpoints[classHash][activeFile] = [];
			}

			const breakpointIndex = newFileBreakpoints[classHash][activeFile].indexOf(lineNumber);

			if (breakpointIndex !== -1) {
				newFileBreakpoints[classHash][activeFile] = newFileBreakpoints[classHash][
					activeFile
				].filter((bp: number) => bp !== lineNumber);
			} else {
				newFileBreakpoints[classHash][activeFile] = [
					...newFileBreakpoints[classHash][activeFile],
					lineNumber
				];
			}
			if (newFileBreakpoints[classHash][activeFile].length === 0) {
				delete newFileBreakpoints[classHash][activeFile];

				if (Object.keys(newFileBreakpoints[classHash]).length === 0) {
					delete newFileBreakpoints[classHash];
				}
			}

			return newFileBreakpoints;
		});
	};
	const [contractCall, setContractCall] = useState<ContractCall | undefined>(
		initialDebuggerData && initialDebuggerData.contractCall
	);
	const [codeLocation, setCodeLocation] = useState<CodeLocation | undefined>(
		initialDebuggerData && initialDebuggerData.codeLocation
	);
	const [sourceCode, setSourceCode] = useState<{ [key: string]: string }>(
		initialDebuggerData?.classSourceCode || {} // Default to an empty object if classSourceCode is not available
	);

	function setCurrentStepIndex(index: number) {
		_setCurrentStepIndex(index);
		const newStep = simulationDebuggerData.debuggerTrace[index];
		_setCurrentStep(newStep);

		const { contractCall, classSourceCode, activeFile, codeLocation, functionCallId } =
			getDebuggerDataForStep(contractCallsMap, simulationResult.simulationDebuggerData, newStep);

		setContractCall(contractCall);
		setSourceCode(classSourceCode);
		setActiveFile(activeFile);
		setCodeLocation(codeLocation);
	}

	const debugFunctionCall = (functionCallId: number) => {
		const functionCall = functionCallsMap[functionCallId];
		if (functionCall && functionCall.debuggerTraceStepIndex) {
			setCurrentStepIndex(functionCall.debuggerTraceStepIndex);
		}
	};

	const debugContractCall = (contractCallId: number) => {
		const contractCall = contractCallsMap[contractCallId];
		if (
			contractCall &&
			contractCall.debuggerTraceStepIndex !== null &&
			contractCall.debuggerTraceStepIndex !== undefined
		) {
			setCurrentStepIndex(contractCall.debuggerTraceStepIndex);
		}
	};

	const runToBreakpoint = () => {
		for (let i = currentStepIndex + 1; i < simulationDebuggerData.debuggerTrace.length; i++) {
			if (simulationDebuggerData.debuggerTrace[i].withLocation) {
				const step = simulationDebuggerData.debuggerTrace[i].withLocation!;
				const contractCall = contractCallsMap[step.contractCallId];
				const classHash = contractCall.classHash;
				const classDebuggerData =
					simulationResult.simulationDebuggerData.classesDebuggerData[classHash];
				const info = classDebuggerData.sierraStatementsToCairoInfo[step.sierraIndex];
				const location = info.cairoLocations[step.locationIndex];
				const linesRange = Array.from(
					{ length: location.end.line - location.start.line + 1 },
					(_, k) => k + location.start.line
				);
				if (
					fileBreakpoints[classHash] &&
					fileBreakpoints[classHash][location.filePath] &&
					fileBreakpoints[classHash][location.filePath].some((line) => linesRange.includes(line))
				) {
					setCurrentStepIndex(i);
					return;
				}
			}
		}
		setCurrentStepIndex(simulationDebuggerData.debuggerTrace.length - 1);
	};

	const nextStep = () => {
		if (currentStepIndex < simulationDebuggerData.debuggerTrace.length - 1) {
			setCurrentStepIndex(currentStepIndex + 1);
		}
	};

	const prevStep = () => {
		if (currentStepIndex > 0) {
			setCurrentStepIndex(currentStepIndex - 1);
		}
	};

	// Step over to the next function call with the same or lower fp register value
	const stepOver = () => {
		if (currentStepIndex < simulationDebuggerData.debuggerTrace.length - 1) {
			const currentStep = simulationDebuggerData.debuggerTrace[currentStepIndex];
			let nextStepIndex = currentStepIndex + 1;
			if (currentStep.withLocation && currentStep.withLocation.fp) {
				while (nextStepIndex + 1 < simulationDebuggerData.debuggerTrace.length) {
					const nextStepWithCodeLocation =
						simulationDebuggerData.debuggerTrace[nextStepIndex].withLocation;
					if (nextStepWithCodeLocation) {
						if (nextStepWithCodeLocation.fp <= currentStep.withLocation.fp) {
							break;
						}
					}
					nextStepIndex++;
				}
			}
			setCurrentStepIndex(nextStepIndex);
		}
	};

	const isContractCallDebuggable = (contractCallId: number): boolean => {
		const contractCall = contractCallsMap[contractCallId];
		if (
			contractCall &&
			contractCall.debuggerTraceStepIndex !== null &&
			contractCall.debuggerTraceStepIndex !== undefined
		) {
			return true;
		}
		return false;
	};

	const isFunctionCallDebuggable = (functionCallId: number): boolean => {
		const functionCall = functionCallsMap[functionCallId];
		if (
			functionCall &&
			functionCall.debuggerTraceStepIndex !== null &&
			functionCall.debuggerTraceStepIndex !== undefined
		) {
			return true;
		}
		return false;
	};

	return (
		<DebuggerContext.Provider
			value={{
				classesDebuggerData: simulationResult.simulationDebuggerData.classesDebuggerData,
				currentStep,
				totalSteps: simulationDebuggerData.debuggerTrace.length,
				currentStepIndex,
				debugFunctionCall,
				debugContractCall,
				nextStep,
				prevStep,
				stepOver,
				setActiveFile,
				availableBreakpoints,
				activeFile,
				contractCall,
				codeLocation,
				sourceCode,
				isContractCallDebuggable,
				isFunctionCallDebuggable,
				runToBreakpoint,
				fileBreakpoints,
				toggleBreakpoint
			}}
		>
			{children}
		</DebuggerContext.Provider>
	);
};

export const useDebugger = () => {
	const context = useContext(DebuggerContext);
	if (!context) {
		throw new Error('useDebugger must be used within a DebuggerContextProvider');
	}
	return context;
};

function findInitialIndex(executionTrace: DebuggerExecutionTraceEntry[]) {
	for (let i = 0; i < executionTrace.length; i++) {
		const step = executionTrace[i];
		if (step.withLocation) {
			return i;
		}
	}

	return 0;
}

function getDebuggerDataForStep(
	contractCallsMap: { [key: string]: ContractCall },
	simulationDebuggerData: SimulationDebuggerData,
	step: DebuggerExecutionTraceEntry
) {
	const contractCallId = step.withLocation
		? step.withLocation.contractCallId
		: step.withContractCall?.contractCallId;
	const contractCall = contractCallsMap[contractCallId];

	const classDebuggerData = contractCall
		? simulationDebuggerData.classesDebuggerData[contractCall.classHash]
		: undefined;
	const classSourceCode = classDebuggerData?.sourceCode ?? {};

	let activeFile: string | undefined;
	let codeLocation: CodeLocation | undefined;
	let functionCallId: number | undefined;

	if (step.withLocation) {
		const classDebuggerData = simulationDebuggerData.classesDebuggerData[contractCall.classHash];
		const locations =
			classDebuggerData.sierraStatementsToCairoInfo[step.withLocation.sierraIndex]?.cairoLocations;
		codeLocation = locations?.[step.withLocation.locationIndex]!; // TODO
		activeFile = codeLocation.filePath;
		functionCallId = step.withLocation.functionCallId;
	} else {
		if (classDebuggerData) {
			const someFile = Object.keys(classDebuggerData.sourceCode)[0];
			if (someFile) activeFile = someFile;
		}
	}

	return { contractCall, classSourceCode, activeFile, codeLocation, functionCallId };
}
