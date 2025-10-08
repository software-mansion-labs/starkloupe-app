import React, {
	MutableRefObject,
	PropsWithChildren,
	RefObject,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import {
	ContractCall,
	FunctionCall,
	EventCall,
	ContractCallEvent,
	SimulationDebuggerData,
	SimulationResult,
	FlameNode,
	L2TransactionData
} from '@/lib/simulation';
import { DebuggerPayload } from '@/lib/debugger';

interface StringBooleanDict {
	[key: string]: boolean;
}

export type TabId =
	| 'call-trace'
	| 'events-list'
	| 'debugger'
	| 'storage-changes'
	| 'gas-profiler'
	| 'input-output'
	| 'transaction-details';

interface CallTraceContextProps {
	contractCallsMap: { [key: number]: ContractCall };
	functionCallsMap: { [key: number]: FunctionCall };
	eventCallsMap: { [key: number]: EventCall };
	events: ContractCallEvent[];
	simulationResult: SimulationResult;
	collapsedCalls: StringBooleanDict;
	expandedCalls: StringBooleanDict;
	simulationDebuggerData: SimulationDebuggerData;
	activeTab: TabId;
	isExecutionFailed: boolean;
	errorMessage: string | undefined;
	l2Flamegraph: FlameNode | undefined;
	l1DataFlamegraph: FlameNode | undefined;
	debuggerPayload: DebuggerPayload | null;
	traceLineElementRefs: MutableRefObject<{
		[key: number]: RefObject<HTMLDivElement>;
	}>;
	toggleCallCollapse: (id: number) => void;
	expandAll: () => void;
	collapseAll: () => void;
	toggleCallExpand: (id: number) => void;
	setActiveTab: (tab: TabId) => void;
	scrollToTraceLineElement: (key: number) => void;
	chosenCallName: string | null;
	setChosenCallName: (callName: string | null) => void;
	callWithError: ContractCall | FunctionCall | undefined;
	showGasChips: boolean;
	gasChipToggle: (checkboxState: boolean) => void;
	transactionData: L2TransactionData;
	rpcUrl: string | undefined;
	chainDetails:
		| {
				stack?: string | undefined;
				chain?: string | undefined;
				customNetworkName?: string | undefined;
		  }
		| null
		| undefined;
}

export const CallTraceContext = createContext<CallTraceContextProps>({
	simulationResult: {} as SimulationResult,
	contractCallsMap: {},
	functionCallsMap: {},
	eventCallsMap: {},
	events: [],
	collapsedCalls: {},
	expandedCalls: {},
	simulationDebuggerData: { classesDebuggerData: {}, debuggerTrace: [] },
	activeTab: 'call-trace',
	isExecutionFailed: false,
	callWithError: undefined,
	l2Flamegraph: {} as FlameNode,
	l1DataFlamegraph: {} as FlameNode,
	traceLineElementRefs: { current: {} },
	errorMessage: undefined,
	debuggerPayload: {} as DebuggerPayload,
	toggleCallCollapse: () => undefined,
	expandAll: () => undefined,
	collapseAll: () => undefined,
	toggleCallExpand: () => undefined,
	setActiveTab: () => undefined,
	scrollToTraceLineElement: (key: number) => undefined,
	chosenCallName: null,
	setChosenCallName: () => undefined,
	showGasChips: true,
	gasChipToggle: () => undefined,
	transactionData: {} as L2TransactionData,
	rpcUrl: undefined,
	chainDetails: undefined
});

export const CallTraceContextProvider: React.FC<
	PropsWithChildren<{
		simulationResult: SimulationResult;
		l2Flamegraph: FlameNode | undefined;
		l1DataFlamegraph: FlameNode | undefined;
		debuggerPayload: DebuggerPayload | null;
		transactionData: L2TransactionData;
		rpcUrl: string | undefined;
		chainDetails:
			| {
					stack?: string | undefined;
					chain?: string | undefined;
					customNetworkName?: string | undefined;
			  }
			| null
			| undefined;
	}>
> = ({
	children,
	simulationResult,
	l2Flamegraph,
	l1DataFlamegraph,
	debuggerPayload,
	transactionData,
	rpcUrl,
	chainDetails
}) => {
	// Initialize with empty collapsed state since core:: calls are now hidden and don't need collapsing
	const initiallyCollapsed: StringBooleanDict = {};

	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>(() => initiallyCollapsed);
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);
	const [activeTab, setActiveTab] = useState<TabId>('call-trace');
	const isExecutionFailed = simulationResult.executionResult.executionStatus === 'REVERTED';
	const traceLineElementRefs = useRef<{ [callId: number]: React.RefObject<HTMLDivElement> }>({});
	const [chosenCallName, setChosenCallName] = useState<string | null>(null);
	const [callWithError, setContractCallWithError] = useState<
		ContractCall | FunctionCall | undefined
	>(undefined);
	const [showGasChips, setShowGasChips] = useState(true);
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

	const gasChipToggle = (checkboxState: boolean) => {
		setShowGasChips(checkboxState);
	};

	const toggleCallCollapse = (id: number) => {
		setCollapsedCalls((prevState) => {
			return { ...prevState, [id]: !!!prevState[id] };
		});
	};

	useEffect(() => {
		if (
			simulationResult.contractCallsMap[2].entryPointName === '__validate__' &&
			debuggerPayload?.transactionType === 'INVOKE'
		) {
			setCollapsedCalls((prevState) => {
				return { ...prevState, [simulationResult.contractCallsMap[2].callId]: true };
			});
		}

		if (isExecutionFailed && errorMessage) {
			const errorCall =
				Object.values(simulationResult.contractCallsMap).find(
					(item) => item.errorMessage === errorMessage
				) ||
				Object.values(simulationResult.functionCallsMap).find(
					(item) => item.errorMessage === errorMessage
				);
			setContractCallWithError(errorCall);
		}
	}, [simulationResult.contractCallsMap]);

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
				eventCallsMap: simulationResult.eventCallsMap,
				events: simulationResult.events,
				collapsedCalls,
				expandedCalls,
				simulationDebuggerData: simulationResult.simulationDebuggerData,
				errorMessage,
				l2Flamegraph,
				l1DataFlamegraph,
				debuggerPayload,
				activeTab,
				isExecutionFailed,
				traceLineElementRefs,
				toggleCallCollapse,
				toggleCallExpand,
				collapseAll,
				expandAll,
				setActiveTab,
				scrollToTraceLineElement,
				chosenCallName,
				setChosenCallName,
				callWithError,
				gasChipToggle,
				showGasChips,
				transactionData,
				rpcUrl,
				chainDetails
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
