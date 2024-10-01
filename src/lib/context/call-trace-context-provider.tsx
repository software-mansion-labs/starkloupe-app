import { PropsWithChildren, createContext, useContext, useState } from 'react';
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
	toggleCallCollapse: (id: string) => void;
	expandAll: () => void;
	collapseAll: () => void;
	toggleCallExpand: (id: string) => void;
	toggleInternalFnCallCollapse: (id: string) => void;
	setActiveTab: (tab: TabId) => void;
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
	toggleCallCollapse: () => undefined,
	expandAll: () => undefined,
	collapseAll: () => undefined,
	toggleCallExpand: () => undefined,
	toggleInternalFnCallCollapse: () => undefined,
	setActiveTab: () => undefined
});

export const CallTraceContextProvider: React.FC<
	PropsWithChildren<{ simulationResult: SimulationResult }>
> = ({ children, simulationResult }) => {
	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>({});
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);
	const [activeTab, setActiveTab] = useState<TabId>('call-trace');

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

		simulationResult.callsMap.forEach((value, key) => {
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
				callsMap: simulationResult.callsMap,
				collapsedCalls,
				expandedCalls,
				showEvents,
				simulationDebuggerData: simulationResult.simulationDebuggerData,
				toggleCallCollapse,
				toggleCallExpand,
				collapseAll,
				expandAll,
				notCollapsedInternalFnCalls,
				toggleInternalFnCallCollapse,
				activeTab,
				setActiveTab
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
