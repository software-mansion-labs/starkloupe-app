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
	FlameNode
} from '@/lib/simulation';
import { DebuggerPayload } from '@/lib/debugger';
import { loadCustomSettingsFromStorage, saveCustomSettingsToStorage } from '../utils/cache-utils';

interface StringBooleanDict {
	[key: string]: boolean;
}

export type TabId =
	| 'call-trace'
	| 'events-list'
	| 'debugger'
	| 'storage-changes'
	| 'gas-profiler'
	| 'input-output';

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
	customSettings: { [key: string]: { name: string | null; color: string | null } };
	updateContractColor: (contractAddress: string, color: string) => void;
	updateContractName: (contractAddress: string, newContractCallName: string) => void;
	updateContractSettings: (
		contractAddress: string,
		settings: { name?: string | null; color?: string | null }
	) => void;
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
	customSettings: {},
	updateContractColor: (contractAddress: string, color: string) => undefined,
	updateContractName: (contractAddress: string, newContractCallName: string) => undefined,
	updateContractSettings: (
		contractAddress: string,
		settings: { name?: string | null; color?: string | null }
	) => undefined
});

export const CallTraceContextProvider: React.FC<
	PropsWithChildren<{
		simulationResult: SimulationResult;
		l2Flamegraph: FlameNode | undefined;
		l1DataFlamegraph: FlameNode | undefined;
		debuggerPayload: DebuggerPayload | null;
	}>
> = ({ children, simulationResult, l2Flamegraph, l1DataFlamegraph, debuggerPayload }) => {
	// This collapses calls starting with "core".
	// If call has children: only parent is collapsed
	const initiallyCollapsed: StringBooleanDict = useMemo(() => {
		try {
			const collapsed: StringBooleanDict = {};
			const processCalls = (
				calls: Array<any>,
				getName: (call: any) => string | undefined,
				shouldFilterByCore: boolean
			) => {
				calls.forEach((call) => {
					const startsWithCore = shouldFilterByCore
						? getName(call)?.startsWith('core') ?? false
						: false;
					let hasDeepestPanicChild = false;

					if (call.childrenCallIds) {
						hasDeepestPanicChild = call.childrenCallIds.some((childId: number) => {
							const childCall =
								simulationResult.contractCallsMap[childId] ||
								simulationResult.functionCallsMap[childId];
							return childCall?.isDeepestPanicResult === true;
						});
					}

					const isPanicCall = call.isDeepestPanicResult === true;
					let parentId = call.parentCallId;
					let hasCollapsedAncestor = false;

					while (parentId !== undefined && !isPanicCall && !hasDeepestPanicChild) {
						if (collapsed[parentId]) {
							hasCollapsedAncestor = true;
							break;
						}
						const parentCall =
							simulationResult.contractCallsMap[parentId] ||
							simulationResult.functionCallsMap[parentId];

						parentId = parentCall?.parentCallId;
					}

					if (startsWithCore && !hasCollapsedAncestor && !isPanicCall && !hasDeepestPanicChild) {
						collapsed[call.callId] = true;
					}
				});
			};
			processCalls(
				Object.values(simulationResult.contractCallsMap),
				(call) => call.entryPointInterfaceName,
				false
			);

			processCalls(Object.values(simulationResult.functionCallsMap), (call) => call.fnName, true);

			return collapsed;
		} catch (err) {
			console.log('Collapsing calls error: ', err);
			return {};
		}
	}, [simulationResult]);

	const [customSettings, setCustomSettings] = useState<{
		[key: string]: { name: string | null; color: string | null };
	}>(() => {
		return loadCustomSettingsFromStorage();
	});
	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>(() => initiallyCollapsed);
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);
	const [activeTab, setActiveTab] = useState<TabId>('call-trace');
	const isExecutionFailed = simulationResult.executionResult.executionStatus === 'REVERTED';
	const traceLineElementRefs = useRef<{ [callId: number]: React.RefObject<HTMLDivElement> }>({});
	const [chosenCallName, setChosenCallName] = useState<string | null>(null);
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

	const updateContractColor = (contractAddress: string, color: string) => {
		setCustomSettings((prevSettings) => {
			const newSettings = {
				...prevSettings,
				[contractAddress]: {
					...prevSettings[contractAddress],
					color: color
				}
			};

			saveCustomSettingsToStorage(newSettings);

			return newSettings;
		});
	};

	const updateContractName = (contractAddress: string, newContractCallName: string) => {
		setCustomSettings((prevSettings) => {
			const newSettings = {
				...prevSettings,
				[contractAddress]: {
					...prevSettings[contractAddress],
					name: newContractCallName
				}
			};

			saveCustomSettingsToStorage(newSettings);

			return newSettings;
		});
	};

	const updateContractSettings = (
		contractAddress: string,
		settings: { name?: string | null; color?: string | null }
	) => {
		setCustomSettings((prevSettings) => {
			const newSettings = {
				...prevSettings,
				[contractAddress]: {
					name:
						settings.name !== undefined
							? settings.name
							: prevSettings[contractAddress]?.name || null,
					color:
						settings.color !== undefined
							? settings.color
							: prevSettings[contractAddress]?.color || null
				}
			};

			saveCustomSettingsToStorage(newSettings);

			return newSettings;
		});
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
				customSettings,
				updateContractColor,
				updateContractName,
				updateContractSettings
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
