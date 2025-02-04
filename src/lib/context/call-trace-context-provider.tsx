import React, {
	MutableRefObject,
	PropsWithChildren,
	RefObject,
	createContext,
	useContext,
	useMemo,
	useRef,
	useState
} from 'react';
import {
	ContractCall,
	FunctionCall,
	EventCall,
	SimulationDebuggerData,
	SimulationResult
} from '@/lib/simulation';

interface StringBooleanDict {
	[key: string]: boolean;
}

export type TabId = 'call-trace' | 'debugger';

interface CallTraceContextProps {
	contractCallsMap: { [key: number]: ContractCall };
	functionCallsMap: { [key: number]: FunctionCall };
	eventCallsMap: { [key: string]: EventCall };
	simulationResult: SimulationResult;
	collapsedCalls: StringBooleanDict;
	expandedCalls: StringBooleanDict;
	simulationDebuggerData: SimulationDebuggerData;
	activeTab: TabId;
	isExecutionFailed: boolean;
	errorMessage: string | undefined;
	traceLineElementRefs: MutableRefObject<{
		[key: number]: RefObject<HTMLDivElement>;
	}>;
	toggleCallCollapse: (id: number) => void;
	expandAll: () => void;
	collapseAll: () => void;
	toggleCallExpand: (id: number) => void;
	setActiveTab: (tab: TabId) => void;
	scrollToTraceLineElement: (key: number) => void;
}

export const CallTraceContext = createContext<CallTraceContextProps>({
	simulationResult: {} as SimulationResult,
	contractCallsMap: {},
	functionCallsMap: {},
	eventCallsMap: {},
	collapsedCalls: {},
	expandedCalls: {},
	simulationDebuggerData: { classesDebuggerData: {}, debuggerTrace: [] },
	activeTab: 'call-trace',
	isExecutionFailed: false,
	traceLineElementRefs: { current: {} },
	errorMessage: undefined,
	toggleCallCollapse: () => undefined,
	expandAll: () => undefined,
	collapseAll: () => undefined,
	toggleCallExpand: () => undefined,
	setActiveTab: () => undefined,
	scrollToTraceLineElement: (key: number) => undefined
});

export const CallTraceContextProvider: React.FC<
	PropsWithChildren<{ simulationResult: SimulationResult }>
> = ({ children, simulationResult }) => {
	// This collapses calls starting with "core".
	// If call has children: only parent is collapsed
	const initiallyCollapsed: StringBooleanDict = useMemo(() => {
		try {
			const collapsed: StringBooleanDict = {};
			const processCalls = (calls: Array<any>, getName: (call: any) => string | undefined) => {
				calls.forEach((call) => {
					const startsWithCore = getName(call)?.startsWith('core') ?? false;
					let parentId = call.parentCallId;
					let hasCollapsedAncestor = false;
					while (parentId !== undefined) {
						if (collapsed[parentId]) {
							hasCollapsedAncestor = true;
							break;
						}
						const parentCall =
							simulationResult.contractCallsMap[parentId] ||
							simulationResult.functionCallsMap[parentId];

						parentId = parentCall?.parentCallId;
					}
					if (startsWithCore && !hasCollapsedAncestor) {
						collapsed[call.callId] = true;
					}
				});
			};
			processCalls(
				Object.values(simulationResult.contractCallsMap),
				(call) => call.entryPointInterfaceName
			);
			processCalls(Object.values(simulationResult.functionCallsMap), (call) => call.fnName);
			return collapsed;
		} catch (err) {
			console.log('Collapsing calls error: ', err);
			return {};
		}
	}, [simulationResult]);

	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>(() => initiallyCollapsed);
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [activeTab, setActiveTab] = useState<TabId>('call-trace');
	const isExecutionFailed = simulationResult.executionResult.executionStatus === 'REVERTED';
	const traceLineElementRefs = useRef<{ [callId: number]: React.RefObject<HTMLDivElement> }>({});
	const errorMessage =
		simulationResult.executionResult.executionStatus === 'REVERTED'
			? simulationResult.executionResult.revertReason
			: undefined;

	const scrollToTraceLineElement = (callId: number) => {
		const element = traceLineElementRefs.current[callId]?.current;
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const toggleCallCollapse = (id: number) => {
		setCollapsedCalls((prevState) => {
			return { ...prevState, [id]: !!!prevState[id] };
		});
	};

	const expandAll = () => {
		setCollapsedCalls({});
	};

	const collapseAll = () => {
		const newState: StringBooleanDict = {};

		Object.entries(simulationResult.contractCallsMap).forEach(([contractCallId, contractCall]) => {
			if (contractCall.childrenCallIds.length > 0 || contractCall.functionCallId) {
				newState[contractCallId] = true;
			}
			if (contractCall.eventCallIds.length > 0) {
				contractCall.eventCallIds.forEach((eventCallId) => {
					newState[eventCallId] = true;
				});
			}
		});

		Object.entries(simulationResult.functionCallsMap).forEach(([functionCallId, functionCall]) => {
			if (functionCall.childrenCallIds.length > 0) {
				newState[functionCallId] = true;
			}
		});

		setCollapsedCalls(newState);
	};

	const toggleCallExpand = (id: number) => {
		setExpandedCalls((prevState) => {
			return { ...prevState, [id]: !!!prevState[id] };
		});
	};

	return (
		<CallTraceContext.Provider
			value={{
				simulationResult,
				contractCallsMap: simulationResult.contractCallsMap,
				functionCallsMap: simulationResult.functionCallsMap,
				eventCallsMap: simulationResult.eventCallsMap,
				collapsedCalls,
				expandedCalls,
				simulationDebuggerData: simulationResult.simulationDebuggerData,
				errorMessage,
				activeTab,
				isExecutionFailed,
				traceLineElementRefs,
				toggleCallCollapse,
				toggleCallExpand,
				collapseAll,
				expandAll,
				setActiveTab,
				scrollToTraceLineElement
			}}
		>
			{children}
		</CallTraceContext.Provider>
	);
};

export const useCallTrace = () => {
	const context = useContext(CallTraceContext);
	if (!context) {
		throw new Error('useCallTrace must be used within a CallTraceContextProvider');
	}
	return context;
};
