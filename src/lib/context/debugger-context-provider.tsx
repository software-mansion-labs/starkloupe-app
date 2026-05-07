import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	useRef,
	PropsWithChildren
} from 'react';
import {
	ClassDebuggerData,
	CodeLocation,
	ContractCall,
	DebuggerExecutionTraceEntry,
	FunctionCall,
	SimulationDebuggerData
} from '@/lib/simulation';
import { CallTraceContext } from './call-trace-context-provider';
import { debugTransactionByData, DebuggerPayload, DebuggerInfo } from '@/lib/debugger';

interface DebuggerContextProps {
	functionCallsMap: { [key: number]: FunctionCall };
	classesDebuggerData: Record<string, ClassDebuggerData>;
	currentStep?: DebuggerExecutionTraceEntry;
	totalSteps: number;
	currentStepIndex: number;
	activeFile: string | undefined;
	contractCall?: ContractCall;
	codeLocation?: CodeLocation;
	sourceCode: Record<string, string>;
	availableBreakpoints: Record<string, Record<string, number[]>>;
	debugFunctionCall: (functionCallId: number) => void;
	debugContractCall: (contractCallId: number) => void;
	nextStep: () => void;
	prevStep: () => void;
	stepOver: () => void;
	runToBreakpoint: () => void;
	resetToInitialStep: () => void;
	initialStepIndex: number;
	setActiveFile: (filePath: string) => void;
	setCurrentContractCall: (contractCall: ContractCall) => void;
	isFunctionCallDebuggable: (functionCallId: number) => boolean;
	isContractCallDebuggable: (contractCallId: number) => boolean;
	fileBreakpoints: Record<string, Record<string, number[]>>;
	toggleBreakpoint: (lineNumber: number, activeFile: string, classHash: string) => void;
	isExpressionHover: boolean;
	setExpressionHover: (isHover: boolean) => void;
	loading: boolean;
	error?: string | null;
	hasDebuggableContract: boolean;
	getStepForFunctionCall: (functionCallId: number) => DebuggerExecutionTraceEntry | undefined;
	getStepForContractCall: (contractCallId: number) => DebuggerExecutionTraceEntry | undefined;
	setIsClickedDebuggerTab: (clickedDebugger: boolean) => void;
	setContractCall: (contractCall: ContractCall) => void;
}

export const DebuggerContext = createContext<DebuggerContextProps | undefined>(undefined);

export const useDebugger = () => {
	const context = useContext(DebuggerContext);
	if (!context) return null;
	return context;
};

export const DebuggerContextProvider = ({
	children,
	debuggerPayload
}: PropsWithChildren<{ debuggerPayload: DebuggerPayload }>) => {
	const [debuggerInfo, setDebuggerInfo] = useState<DebuggerInfo | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [currentStepIndex, _setCurrentStepIndex] = useState(0);
	const [currentStep, _setCurrentStep] = useState<DebuggerExecutionTraceEntry | undefined>(
		undefined
	);
	const [activeFile, setActiveFile] = useState<string>();
	const [fileBreakpoints, setFileBreakpoints] = useState<Record<string, Record<string, number[]>>>(
		{}
	);
	const [contractCall, setContractCall] = useState<ContractCall>();
	const [codeLocation, setCodeLocation] = useState<CodeLocation>();
	const [sourceCode, setSourceCode] = useState<Record<string, string>>({});
	const [isExpressionHover, setExpressionHover] = useState(false);
	const [hasDebuggableContract, setHasDebuggableContract] = useState(false);
	const [clickedDebuggerTab, setIsClickedDebuggerTab] = useState(false);

	// Pending navigation - when user clicks debug before data is loaded
	const [pendingFunctionCallId, setPendingFunctionCallId] = useState<number | null>(null);
	const [pendingContractCallId, setPendingContractCallId] = useState<number | null>(null);
	const hasPendingNavigationRef = useRef(false);

	const { contractCallsMap: callTraceContractCalls, functionCallsMap: callTraceFunctionCalls } =
		useContext(CallTraceContext);

	useEffect(() => {
		if (clickedDebuggerTab) {
			const fetch = async () => {
				if (!debuggerPayload) return;
				setLoading(true);

				try {
					const hasDebuggableContract_ = Object.values(callTraceContractCalls).some(
						(call) => call.callDebuggerDataAvailable
					);
					setHasDebuggableContract(hasDebuggableContract_);

					if (!hasDebuggableContract_) {
						setLoading(false);
						return;
					}

					const result = await debugTransactionByData(debuggerPayload);
					setDebuggerInfo(result);

					if (result?.simulationDebuggerData?.debuggerTrace && !hasPendingNavigationRef.current) {
						const i = result.simulationDebuggerData.initialStepIndex
							?? findInitialIndex(result.simulationDebuggerData.debuggerTrace);
						_setCurrentStepIndex(i);
						_setCurrentStep(result.simulationDebuggerData.debuggerTrace[i]);
					}
				} catch (err: any) {
					setError(err.message || 'Unknown error');
				} finally {
					setLoading(false);
				}
			};

			fetch();
		}
	}, [debuggerPayload, clickedDebuggerTab]);

	const simulationDebuggerData = debuggerInfo?.simulationDebuggerData;
	const contractCallsMap = useMemo(
		() => debuggerInfo?.contractCallsMap || {},
		[debuggerInfo?.contractCallsMap]
	);
	const functionCallsMap = useMemo(
		() => debuggerInfo?.functionCallsMap || {},
		[debuggerInfo?.functionCallsMap]
	);

	// Create mapping from call trace (simulation) function IDs to debugger function IDs
	// Uses contractCallId + fnName since these are consistent across both traces
	const callTraceToDebuggerFunctionIdMap = useMemo(() => {
		const mapping: Record<number, number> = {};

		if (
			!functionCallsMap ||
			!callTraceFunctionCalls ||
			Object.keys(functionCallsMap).length === 0 ||
			Object.keys(callTraceFunctionCalls).length === 0
		) {
			return mapping;
		}

		// Build a lookup map for debugger functions
		// contractCallId is the same in both traces, fnName identifies the function
		const debuggerFunctionsByKey: Record<string, number> = {};
		for (const [id, fc] of Object.entries(functionCallsMap)) {
			if (fc.contractCallId != null && fc.fnName) {
				const key = `${fc.contractCallId}_${fc.fnName}`;
				debuggerFunctionsByKey[key] = Number(id);
			}
		}

		// Map call trace function IDs to debugger function IDs
		for (const [id, fc] of Object.entries(callTraceFunctionCalls)) {
			if (fc.contractCallId != null && fc.fnName) {
				const key = `${fc.contractCallId}_${fc.fnName}`;
				const debuggerId = debuggerFunctionsByKey[key];
				if (debuggerId != null) {
					mapping[Number(id)] = debuggerId;
				}
			}
		}

		return mapping;
	}, [functionCallsMap, callTraceFunctionCalls]);

	// Handle pending navigation after debugger data is loaded
	useEffect(() => {
		if (!debuggerInfo || loading) return;

		if (pendingFunctionCallId != null) {
			const debuggerId = callTraceToDebuggerFunctionIdMap[pendingFunctionCallId];
			const lookupId = debuggerId ?? pendingFunctionCallId;
			const fc = functionCallsMap[lookupId];

			if (fc?.debuggerTraceStepIndex != null) {
				_setCurrentStepIndex(fc.debuggerTraceStepIndex);
				const newStep = simulationDebuggerData?.debuggerTrace[fc.debuggerTraceStepIndex];
				_setCurrentStep(newStep);

				const { contractCall, classSourceCode, activeFile, codeLocation } = getDebuggerDataForStep(
					contractCallsMap,
					simulationDebuggerData || null,
					newStep || null
				);
				setContractCall(contractCall);
				setSourceCode(classSourceCode);
				setActiveFile(activeFile);
				setCodeLocation(codeLocation);
			} else {
				// Function not found in debugger trace - contract might not be verified or no code locations
				const callTraceFc = callTraceFunctionCalls[pendingFunctionCallId];
				if (callTraceFc) {
					const cc = callTraceContractCalls[callTraceFc.contractCallId];
					if (cc) {
						setContractCall(cc);
						_setCurrentStep(undefined);
					}
				}
			}
			setPendingFunctionCallId(null);
		}

		// Handle pending contract call navigation
		if (pendingContractCallId != null) {
			const cc = contractCallsMap[pendingContractCallId];
			if (cc?.debuggerTraceStepIndex != null) {
				_setCurrentStepIndex(cc.debuggerTraceStepIndex);
				const newStep = simulationDebuggerData?.debuggerTrace[cc.debuggerTraceStepIndex];
				_setCurrentStep(newStep);

				const { contractCall, classSourceCode, activeFile, codeLocation } = getDebuggerDataForStep(
					contractCallsMap,
					simulationDebuggerData || null,
					newStep || null
				);
				setContractCall(contractCall);
				setSourceCode(classSourceCode);
				setActiveFile(activeFile);
				setCodeLocation(codeLocation);
			} else {
				// Contract not found in debugger trace - might not be verified or no code locations
				const callTraceCc = callTraceContractCalls[pendingContractCallId];
				if (callTraceCc) {
					setContractCall(callTraceCc);
					_setCurrentStep(undefined);
				}
			}
			setPendingContractCallId(null);
		}
	}, [
		debuggerInfo,
		loading,
		pendingFunctionCallId,
		pendingContractCallId,
		callTraceToDebuggerFunctionIdMap,
		functionCallsMap,
		contractCallsMap,
		simulationDebuggerData,
		callTraceFunctionCalls,
		callTraceContractCalls
	]);

	useEffect(() => {
		// Skip if there's pending navigation and clear the ref
		if (!simulationDebuggerData || hasPendingNavigationRef.current) {
			if (hasPendingNavigationRef.current) {
				hasPendingNavigationRef.current = false;
			}
			return;
		}

		const step = simulationDebuggerData.debuggerTrace[currentStepIndex];
		_setCurrentStep(step);

		const { contractCall, classSourceCode, activeFile, codeLocation } = getDebuggerDataForStep(
			contractCallsMap,
			simulationDebuggerData,
			step
		);
		setContractCall(contractCall);
		setSourceCode(classSourceCode);
		setActiveFile(activeFile);
		setCodeLocation(codeLocation);
	}, [simulationDebuggerData]);

	const availableBreakpoints = useMemo(() => {
		if (!simulationDebuggerData) return {};
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

	const toggleBreakpoint = (lineNumber: number, activeFile: string, classHash: string) => {
		setFileBreakpoints((prev) => {
			const newFileBreakpoints = structuredClone(prev);

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

	function setCurrentStepIndex(index: number) {
		_setCurrentStepIndex(index);
		const newStep = simulationDebuggerData?.debuggerTrace[index];
		_setCurrentStep(newStep);

		const { contractCall, classSourceCode, activeFile, codeLocation, functionCallId } =
			getDebuggerDataForStep(contractCallsMap, simulationDebuggerData || null, newStep || null);

		setContractCall(contractCall);
		setSourceCode(classSourceCode);
		setActiveFile(activeFile);

		setCodeLocation(codeLocation);
	}

	const setCurrentContractCall = (call: ContractCall) => {
		if (call.debuggerTraceStepIndex != null) {
			setCurrentStepIndex(call.debuggerTraceStepIndex);
		}
	};

	const debugFunctionCall = (functionCallId: number) => {
		// If debugger data not loaded yet, store pending navigation and trigger load
		if (!debuggerInfo) {
			hasPendingNavigationRef.current = true;
			setPendingFunctionCallId(functionCallId);
			setIsClickedDebuggerTab(true);
			return;
		}

		const debuggerId = callTraceToDebuggerFunctionIdMap[functionCallId];

		const lookupId = debuggerId ?? functionCallId;
		const fc = functionCallsMap[lookupId];

		if (fc?.debuggerTraceStepIndex != null) {
			setCurrentStepIndex(fc.debuggerTraceStepIndex);
		} else {
			// Function not found in debugger trace - contract might not be verified
			const callTraceFc = callTraceFunctionCalls[functionCallId];
			if (callTraceFc) {
				const cc = callTraceContractCalls[callTraceFc.contractCallId];
				if (cc) {
					setContractCall(cc);
					_setCurrentStep(undefined);
				}
			}
		}
	};

	const debugContractCall = (contractCallId: number) => {
		// If debugger data not loaded yet, store pending navigation and trigger load
		if (!debuggerInfo) {
			hasPendingNavigationRef.current = true;
			setPendingContractCallId(contractCallId);
			setIsClickedDebuggerTab(true);
			return;
		}

		const cc = contractCallsMap[contractCallId];
		if (cc?.debuggerTraceStepIndex != null) {
			setCurrentStepIndex(cc.debuggerTraceStepIndex as number);
		} else {
			// Contract not found in debugger trace - might not be verified
			const callTraceCc = callTraceContractCalls[contractCallId];
			if (callTraceCc) {
				setContractCall(callTraceCc);
				_setCurrentStep(undefined);
			}
		}
	};

	const nextStep = () => {
		if (!simulationDebuggerData) return;
		if (currentStepIndex < simulationDebuggerData.debuggerTrace.length - 1) {
			setCurrentStepIndex(currentStepIndex + 1);
		}
	};

	const prevStep = () => {
		if (currentStepIndex > 0) {
			setCurrentStepIndex(currentStepIndex - 1);
		}
	};

	const stepOver = () => {
		if (!simulationDebuggerData) return;
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

	const runToBreakpoint = () => {
		if (!simulationDebuggerData) return;

		for (let i = currentStepIndex + 1; i < simulationDebuggerData.debuggerTrace.length; i++) {
			if (simulationDebuggerData.debuggerTrace[i].withLocation) {
				const step = simulationDebuggerData.debuggerTrace[i].withLocation!;
				const contractCall = contractCallsMap[step.contractCallId];
				const classHash = contractCall.classHash;
				const classDebuggerData = simulationDebuggerData.classesDebuggerData[classHash];
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

	const initialStepIndex = simulationDebuggerData
		? simulationDebuggerData.initialStepIndex ?? findInitialIndex(simulationDebuggerData.debuggerTrace)
		: 0;

	const resetToInitialStep = () => {
		if (!simulationDebuggerData) return;
		setCurrentStepIndex(initialStepIndex);
	};

	const isContractCallDebuggable = (id: number) =>
		contractCallsMap[id]?.debuggerTraceStepIndex != null;

	const isFunctionCallDebuggable = (id: number) => {
		const debuggerId = callTraceToDebuggerFunctionIdMap[id];
		const lookupId = debuggerId ?? id;
		const fc = functionCallsMap[lookupId];
		return fc?.debuggerTraceStepIndex != null;
	};

	const getStepForFunctionCall = (functionCallId: number) => {
		const debuggerId = callTraceToDebuggerFunctionIdMap[functionCallId];
		const lookupId = debuggerId ?? functionCallId;
		const fc = functionCallsMap[lookupId];
		if (fc?.debuggerTraceStepIndex != null) {
			return simulationDebuggerData?.debuggerTrace[fc.debuggerTraceStepIndex];
		}
		return undefined;
	};

	const getStepForContractCall = (contractCallId: number) => {
		const cc = contractCallsMap[contractCallId];
		if (cc?.debuggerTraceStepIndex != null) {
			setCurrentStepIndex(cc.debuggerTraceStepIndex);
			return simulationDebuggerData?.debuggerTrace[cc.debuggerTraceStepIndex];
		}
		return undefined;
	};

	return (
		<DebuggerContext.Provider
			value={{
				functionCallsMap,
				classesDebuggerData: simulationDebuggerData?.classesDebuggerData || {},
				currentStep,
				totalSteps: simulationDebuggerData?.debuggerTrace.length || 0,
				currentStepIndex,
				activeFile,
				contractCall,
				codeLocation,
				sourceCode,
				availableBreakpoints,
				debugFunctionCall,
				debugContractCall,
				nextStep,
				prevStep,
				stepOver,
				runToBreakpoint,
				resetToInitialStep,
				initialStepIndex,
				setActiveFile,
				setCurrentContractCall,
				isContractCallDebuggable,
				isFunctionCallDebuggable,
				fileBreakpoints,
				toggleBreakpoint,
				isExpressionHover,
				setExpressionHover,
				loading,
				error,
				getStepForFunctionCall,
				getStepForContractCall,
				hasDebuggableContract,
				setIsClickedDebuggerTab,
				setContractCall
			}}
		>
			{children}
		</DebuggerContext.Provider>
	);
};

// Helpers
function findInitialIndex(trace: DebuggerExecutionTraceEntry[]) {
	return trace.findIndex((step) => step.withLocation) || 0;
}

function getDebuggerDataForStep(
	contractCallsMap: { [key: string]: ContractCall },
	simulationDebuggerData: SimulationDebuggerData | null,
	step: DebuggerExecutionTraceEntry | null
) {
	const contractCallId = step?.withLocation
		? step.withLocation.contractCallId
		: step?.withContractCall?.contractCallId;
	const contractCall = contractCallId ? contractCallsMap[contractCallId] : undefined;

	const classDebuggerData = contractCall
		? simulationDebuggerData?.classesDebuggerData[contractCall.classHash]
		: undefined;
	const classSourceCode = classDebuggerData?.sourceCode ?? {};

	let activeFile: string | undefined;
	let codeLocation: CodeLocation | undefined;
	let functionCallId: number | undefined;

	if (step?.withLocation) {
		const classDebuggerData =
			contractCall && simulationDebuggerData?.classesDebuggerData[contractCall.classHash];
		const locations =
			classDebuggerData?.sierraStatementsToCairoInfo[step?.withLocation.sierraIndex]
				?.cairoLocations;
		codeLocation = locations?.[step?.withLocation.locationIndex]!; // TODO
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
