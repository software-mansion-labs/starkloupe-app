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
	CallTrace,
	CallsMap,
	InternalFnCallTrace,
	SimulationDebuggerData,
	SimulationResult
} from '@/lib/simulation';

interface StringBooleanDict {
	[key: string]: boolean;
}

export type TabId = 'call-trace' | 'events-list' | 'debugger';

interface CallTraceContextProps {
	simulationResult: SimulationResult;
	callsMap: CallsMap;
	collapsedCalls: StringBooleanDict;
	expandedCalls: StringBooleanDict;
	showEvents: boolean;
	notCollapsedInternalFnCalls: StringBooleanDict;
	simulationDebuggerData: SimulationDebuggerData;
	activeTab: TabId;
	traceLineElementRefs: MutableRefObject<{
		[key: string]: RefObject<HTMLDivElement>;
	}>;
	toggleCallCollapse: (id: string) => void;
	expandAll: () => void;
	collapseAll: () => void;
	toggleCallExpand: (id: string) => void;
	toggleInternalFnCallCollapse: (id: string) => void;
	setActiveTab: (tab: TabId) => void;
	scrollToTraceLineElement: (key: string) => void;
}

export const CallTraceContext = createContext<CallTraceContextProps>({
	simulationResult: {} as SimulationResult,
	callsMap: new Map(),
	collapsedCalls: {},
	expandedCalls: {},
	notCollapsedInternalFnCalls: {},
	showEvents: true,
	simulationDebuggerData: { classesDebuggerData: {} },
	activeTab: 'call-trace',
	traceLineElementRefs: { current: {} },
	toggleCallCollapse: () => undefined,
	expandAll: () => undefined,
	collapseAll: () => undefined,
	toggleCallExpand: () => undefined,
	toggleInternalFnCallCollapse: () => undefined,
	setActiveTab: () => undefined,
	scrollToTraceLineElement: (key: string) => undefined
});

export const CallTraceContextProvider: React.FC<
	PropsWithChildren<{ simulationResult: SimulationResult }>
> = ({ children, simulationResult }) => {
	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>({});
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);
	const [activeTab, setActiveTab] = useState<TabId>('call-trace');
	const callsMap = useMemo(() => makeCallsMap(simulationResult), [simulationResult]);

	const traceLineElementRefs = useRef<{ [callid: string]: React.RefObject<HTMLDivElement> }>({});
	const notCollapsedInternalFnCallsIds = findCallPathWithError([simulationResult.callTrace]);
	const initialNotCollapsedInternalFnCalls = notCollapsedInternalFnCallsIds
		? notCollapsedInternalFnCallsIds.reduce((obj: StringBooleanDict, id) => {
				obj[id] = true;
				return obj;
		  }, {})
		: {};

	const [notCollapsedInternalFnCalls, setNotCollapsedInternalFnCalls] = useState<StringBooleanDict>(
		initialNotCollapsedInternalFnCalls
	);

	const scrollToTraceLineElement = (callId: string) => {
		const element = traceLineElementRefs.current[callId]?.current;
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const toggleCallCollapse = (id: string) => {
		setCollapsedCalls((prevState) => {
			return { ...prevState, [id]: !!!prevState[id] };
		});
	};

	const expandAll = () => {
		setCollapsedCalls({});
	};

	const collapseAll = () => {
		const newState: StringBooleanDict = {};

		callsMap.forEach((value, key) => {
			if (value && value.contractCall) {
				if (value.contractCall.nestedCalls.length > 0 || value.contractCall.fnCalls.length > 0) {
					newState[key] = true;
				}
			}
		});
		setCollapsedCalls(newState);
	};

	const toggleInternalFnCallCollapse = (id: string) => {
		setNotCollapsedInternalFnCalls((prevState) => {
			return { ...prevState, [id]: !!!prevState[id] };
		});
	};

	const toggleCallExpand = (id: string) => {
		setExpandedCalls((prevState) => {
			return { ...prevState, [id]: !!!prevState[id] };
		});
	};

	return (
		<CallTraceContext.Provider
			value={{
				simulationResult,
				callsMap,
				collapsedCalls,
				expandedCalls,
				showEvents,
				simulationDebuggerData: simulationResult.simulationDebuggerData,
				toggleCallCollapse,
				toggleCallExpand,
				collapseAll,
				expandAll,
				traceLineElementRefs,
				notCollapsedInternalFnCalls,
				toggleInternalFnCallCollapse,
				activeTab,
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

function findCallPathWithError(calls: CallTrace[]): string[] | null {
	for (let i = 0; i < calls.length; i++) {
		const call = calls[i];
		if (call.additionalInfo.errorMessage) {
			if (call.fnCalls.length > 0) {
				return findInternalFnCallPathWithError(call.fnCalls, []);
			}
			break;
		} else {
			const internalFnCallsIdTrace = findCallPathWithError(call.nestedCalls);
			if (internalFnCallsIdTrace) return internalFnCallsIdTrace;
		}
	}
	return null;
}

function findInternalFnCallPathWithError(
	internalFnCalls: InternalFnCallTrace[],
	internalFnCallsIdTrace: string[]
): string[] | null {
	for (let i = 0; i < internalFnCalls.length; i++) {
		const internalCall = internalFnCalls[i];
		if (internalCall.data.isPanicResult) {
			return [...internalFnCallsIdTrace, internalCall.data.id];
		}
		if (internalCall.nestedCalls.length > 0) {
			const currentInternalFnCallsIdTrace = findInternalFnCallPathWithError(
				internalCall.nestedCalls,
				[...internalFnCallsIdTrace, internalCall.data.id]
			);
			if (currentInternalFnCallsIdTrace) return currentInternalFnCallsIdTrace;
		}
	}
	return null;
}

/**
 * Makes a map of call id to contract call or fn call
 */
function makeCallsMap(simulationResult: SimulationResult): CallsMap {
	const callsMap: CallsMap = new Map();
	makeContractCallsMap([simulationResult.callTrace], callsMap);
	return callsMap;
}

function makeContractCallsMap(contractCalls: CallTrace[], callsMap: CallsMap) {
	for (const contractCall of contractCalls) {
		callsMap.set(contractCall.contractCallId, { contractCall });
		makeFnCallsMap(contractCall.fnCalls, callsMap);
		makeContractCallsMap(contractCall.nestedCalls, callsMap);
	}
}

function makeFnCallsMap(fnCalls: InternalFnCallTrace[], callsMap: CallsMap) {
	for (const fnCall of fnCalls) {
		callsMap.set(fnCall.data.id, { fnCall });
		makeFnCallsMap(fnCall.nestedCalls, callsMap);
	}
}
