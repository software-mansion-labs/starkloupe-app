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
	ContractCallEvent,
	FunctionCall,
	SimulationDebuggerData,
	SimulationResult
} from '@/lib/simulation';

interface StringBooleanDict {
	[key: string]: boolean;
}

export type TabId = 'call-trace' | 'events-list' | 'debugger';

interface CallTraceContextProps {
	contractCallsMap: { [key: number]: ContractCall };
	functionCallsMap: { [key: number]: FunctionCall };
	events: ContractCallEvent[];
	simulationResult: SimulationResult;
	collapsedCalls: StringBooleanDict;
	expandedCalls: StringBooleanDict;
	showEvents: boolean;
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
	events: [],
	collapsedCalls: {},
	expandedCalls: {},
	showEvents: true,
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
	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>({});
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);
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
				events: simulationResult.events,
				collapsedCalls,
				expandedCalls,
				showEvents,
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
