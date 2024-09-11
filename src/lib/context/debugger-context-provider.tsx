import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import {
	CallsMap,
	CallTrace,
	ClassDebuggerData,
	CodeLocation,
	InternalFnCallIO,
	InternalFnCallTrace,
	SimulationDebuggerData
} from '@/lib/simulation';
import { CallTraceContext } from './call-trace-context-provider';

export interface DebuggerExecutionTraceEntry {
	withCodeLocation?: {
		codeLocation: CodeLocation;
		arguments: InternalFnCallIO[];
		results: InternalFnCallIO[];
	};
	withContractCall?: {
		message: string; // Reason for the missing code location
	};
	contractCallId: string;
}

interface DebuggerContextProps {
	classesDebuggerData: {
		[key: string]: ClassDebuggerData;
	};
	currentStep?: DebuggerExecutionTraceEntry;
	totalSteps: number;
	currentStepIndex: number;
	activeFile: string | undefined;
	contractCall?: CallTrace;
	codeLocation?: CodeLocation;
	sourceCode: {
		[key: string]: string;
	};
	debugCall: (callId: string) => void;
	nextStep: () => void;
	prevStep: () => void;
	setActiveFile: (filePath: string) => void;
	checkIfDebuggable: (callId: string) => boolean;
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
	debugCall: () => undefined,
	nextStep: () => undefined,
	prevStep: () => undefined,
	setActiveFile: () => undefined,
	checkIfDebuggable: () => false
});

export const DebuggerContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { callsMap, simulationResult } = useContext(CallTraceContext);

	const { executionTrace, callIdToStepIndexMap } = useMemo(() => {
		return computeDebuggerExecutionTrace(
			callsMap,
			simulationResult.simulationDebuggerData,
			simulationResult.callTrace
		);
	}, [callsMap, simulationResult.simulationDebuggerData, simulationResult.callTrace]);

	const [currentStepIndex, _setCurrentStepIndex] = useState(findInitialIndex(executionTrace));
	const [currentStep, _setCurrentStep] = useState(executionTrace[currentStepIndex]);

	const initialDebuggerData = getDebuggerDataForStep(
		callsMap,
		simulationResult.simulationDebuggerData,
		currentStep
	);

	const [activeFile, setActiveFile] = useState<string | undefined>(initialDebuggerData.activeFile);
	const [contractCall, setContractCall] = useState<CallTrace | undefined>(
		initialDebuggerData.contractCall
	);
	const [codeLocation, setCodeLocation] = useState<CodeLocation | undefined>(
		initialDebuggerData.codeLocation
	);
	const [sourceCode, setSourceCode] = useState<{
		[key: string]: string;
	}>(initialDebuggerData.classSourceCode);

	function setCurrentStepIndex(index: number) {
		_setCurrentStepIndex(index);
		const newStep = executionTrace[index];
		_setCurrentStep(newStep);

		const { contractCall, classSourceCode, activeFile, codeLocation } = getDebuggerDataForStep(
			callsMap,
			simulationResult.simulationDebuggerData,
			newStep
		);

		setContractCall(contractCall);
		setSourceCode(classSourceCode);
		setActiveFile(activeFile);
		setCodeLocation(codeLocation);
	}

	const debugCall = (callId: string) => {
		const index = callIdToStepIndexMap.get(callId);
		if (index !== undefined) {
			setCurrentStepIndex(index);
		}
	};

	const nextStep = () => {
		if (currentStepIndex < executionTrace.length - 1) {
			setCurrentStepIndex(currentStepIndex + 1);
		}
	};

	const prevStep = () => {
		if (currentStepIndex > 0) {
			setCurrentStepIndex(currentStepIndex - 1);
		}
	};

	const checkIfDebuggable = (callId: string): boolean => {
		const stepIndex = callIdToStepIndexMap.get(callId);
		if (stepIndex === undefined) return false;
		const step = executionTrace[stepIndex];
		if (step.withCodeLocation) return true;
		return false;
	};

	return (
		<DebuggerContext.Provider
			value={{
				classesDebuggerData: simulationResult.simulationDebuggerData.classesDebuggerData,
				currentStep,
				totalSteps: executionTrace.length,
				currentStepIndex,
				debugCall,
				nextStep,
				prevStep,
				setActiveFile,
				activeFile,
				contractCall,
				codeLocation,
				sourceCode,
				checkIfDebuggable
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

function computeDebuggerExecutionTrace(
	callsMap: CallsMap,
	simulationDebuggerData: SimulationDebuggerData,
	rootContractCall: CallTrace
) {
	const executionTrace: DebuggerExecutionTraceEntry[] = [];
	const callIdToStepIndexMap = new Map<string, number>();
	computeDebuggerExecutionTraceEnterContractCall(
		callsMap,
		simulationDebuggerData,
		executionTrace,
		rootContractCall,
		callIdToStepIndexMap
	);
	return { executionTrace, callIdToStepIndexMap };
}

function collectStepIndexToFnCallIdsMap(
	fnCalls: InternalFnCallTrace[],
	stepIndexToFnCallIdsMap: { [key: number]: string[] }
) {
	for (const fnCall of fnCalls) {
		if (Array.isArray(stepIndexToFnCallIdsMap[fnCall.data.debuggerExecutionTraceStepIndex])) {
			stepIndexToFnCallIdsMap[fnCall.data.debuggerExecutionTraceStepIndex].push(fnCall.data.id);
		} else {
			stepIndexToFnCallIdsMap[fnCall.data.debuggerExecutionTraceStepIndex] = [fnCall.data.id];
		}
		collectStepIndexToFnCallIdsMap(fnCall.nestedCalls, stepIndexToFnCallIdsMap);
	}
}

function computeDebuggerExecutionTraceEnterContractCall(
	callsMap: CallsMap,
	simulationDebuggerData: SimulationDebuggerData,
	executionTrace: DebuggerExecutionTraceEntry[],
	contractCall: CallTrace,
	callIdToStepIndexMap: Map<string, number>
) {
	callIdToStepIndexMap.set(contractCall.contractCallId, executionTrace.length);
	if (contractCall.additionalInfo.callDebuggerData) {
		if (contractCall.additionalInfo.callDebuggerData.executionTrace.length > 0) {
			const stepIndexToFnCallIdsMap: { [key: number]: string[] } = {};
			collectStepIndexToFnCallIdsMap(contractCall.fnCalls, stepIndexToFnCallIdsMap);
			for (let i = 0; i < contractCall.additionalInfo.callDebuggerData.executionTrace.length; i++) {
				const fnCallsAtThisStep = stepIndexToFnCallIdsMap[i];
				if (fnCallsAtThisStep) {
					for (const fnCallId of fnCallsAtThisStep) {
						callIdToStepIndexMap.set(fnCallId, executionTrace.length);
					}
				}
				const step = contractCall.additionalInfo.callDebuggerData.executionTrace[i];
				if (step.withLocation) {
					const classDebuggerData =
						simulationDebuggerData.classesDebuggerData[contractCall.additionalInfo.classHash];
					const locations =
						classDebuggerData.sierraStatementsToCairoInfo[step.withLocation.sierraIndex]
							?.cairoLocations;
					const location = locations?.[step.withLocation.locationIndex];
					if (location) {
						executionTrace.push({
							withCodeLocation: {
								codeLocation: location,
								arguments: step.withLocation.arguments,
								results: step.withLocation.results
							},
							contractCallId: contractCall.contractCallId
						});
					}
				} else if (step.withContractCall) {
					const contractCall = callsMap.get(step.withContractCall.contractCallId)?.contractCall!;
					computeDebuggerExecutionTraceEnterContractCall(
						callsMap,
						simulationDebuggerData,
						executionTrace,
						contractCall,
						callIdToStepIndexMap
					);
				}
			}
		} else {
			executionTrace.push({
				withContractCall: {
					message: 'No execution trace found.'
				},
				contractCallId: contractCall.contractCallId
			});
			for (const nestedContractCall of contractCall.nestedCalls) {
				computeDebuggerExecutionTraceEnterContractCall(
					callsMap,
					simulationDebuggerData,
					executionTrace,
					nestedContractCall,
					callIdToStepIndexMap
				);
			}
		}
	} else {
		executionTrace.push({
			withContractCall: {
				message: 'No source code for this contract.'
			},
			contractCallId: contractCall.contractCallId
		});
		for (const nestedContractCall of contractCall.nestedCalls) {
			computeDebuggerExecutionTraceEnterContractCall(
				callsMap,
				simulationDebuggerData,
				executionTrace,
				nestedContractCall,
				callIdToStepIndexMap
			);
		}
	}
}

function findInitialIndex(executionTrace: DebuggerExecutionTraceEntry[]) {
	for (let i = 0; i < executionTrace.length; i++) {
		const step = executionTrace[i];
		if (step.withCodeLocation) {
			return i;
		}
	}
	return 0;
}

function getDebuggerDataForStep(
	callsMap: CallsMap,
	simulationDebuggerData: SimulationDebuggerData,
	step: DebuggerExecutionTraceEntry
) {
	const contractCall = callsMap.get(step.contractCallId)?.contractCall;

	const classDebuggerData = contractCall
		? simulationDebuggerData.classesDebuggerData[contractCall.additionalInfo.classHash]
		: undefined;
	const classSourceCode = classDebuggerData?.sourceCode ?? {};

	let activeFile: string | undefined;
	let codeLocation: CodeLocation | undefined;

	if (step.withCodeLocation) {
		activeFile = step.withCodeLocation.codeLocation.filePath;
		codeLocation = step.withCodeLocation.codeLocation;
	} else {
		if (classDebuggerData) {
			const someFile = Object.keys(classDebuggerData.sourceCode)[0];
			if (someFile) activeFile = someFile;
		}
	}

	return { contractCall, classSourceCode, activeFile, codeLocation };
}
