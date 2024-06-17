import { PropsWithChildren, createContext, useState } from 'react';
import { CallTrace, InternalFnCallTrace, SimulationResult, SourceCode } from '@/lib/simulation';

interface StringBooleanDict {
	[key: string]: boolean;
}

interface CallTraceContextProps {
	collapsedCalls: StringBooleanDict;
	expandedCalls: StringBooleanDict;
	showEvents: boolean;
	notCollapsedInternalFnCalls: StringBooleanDict;
	sourceCode: SourceCode;
	toggleCallCollapse: (id: string) => void;
	toggleCallExpand: (id: string) => void;
	toggleInternalFnCallCollapse: (id: string) => void;
}

export const CallTraceContext = createContext<CallTraceContextProps>({
	collapsedCalls: {},
	expandedCalls: {},
	notCollapsedInternalFnCalls: {},
	showEvents: true,
	sourceCode: {},
	toggleCallCollapse: () => undefined,
	toggleCallExpand: () => undefined,
	toggleInternalFnCallCollapse: () => undefined
});

export const CallTraceContextProvider: React.FC<
	PropsWithChildren<{ simulationResult: SimulationResult }>
> = ({ children, simulationResult }) => {
	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>({});
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);

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
				collapsedCalls,
				expandedCalls,
				showEvents,
				sourceCode: simulationResult.sourceCode ?? {},
				toggleCallCollapse,
				toggleCallExpand,
				notCollapsedInternalFnCalls,
				toggleInternalFnCallCollapse
			}}
		>
			{children}
		</CallTraceContext.Provider>
	);
};

function findCallPathWithError(calls: CallTrace[], parentId?: string): string[] | null {
	for (let i = 0; i < calls.length; i++) {
		const call = calls[i];
		const callIdentifier = parentId ? `${parentId}-${i}` : i.toString();
		if (call.additionalInfo.errorMessage) {
			if (call.internalFnCallTrace) {
				return findInternalFnCallPathWithError([call.internalFnCallTrace], callIdentifier, []);
			}
			break;
		} else {
			const internalFnCallsIdTrace = findCallPathWithError(call.nestedCalls, callIdentifier);
			if (internalFnCallsIdTrace) return internalFnCallsIdTrace;
		}
	}
	return null;
}

function findInternalFnCallPathWithError(
	internalFnCalls: InternalFnCallTrace[],
	parentId: string,
	internalFnCallsIdTrace: string[]
): string[] | null {
	for (let i = 0; i < internalFnCalls.length; i++) {
		const internalCall = internalFnCalls[i];
		const callIdentifier = `${parentId}-${i}`;
		if (internalCall.data.isPanicResult) {
			return [...internalFnCallsIdTrace, callIdentifier];
		}
		if (internalCall.nestedCalls.length > 0) {
			const currentInternalFnCallsIdTrace = findInternalFnCallPathWithError(
				internalCall.nestedCalls,
				callIdentifier,
				[...internalFnCallsIdTrace, callIdentifier]
			);
			if (currentInternalFnCallsIdTrace) return currentInternalFnCallsIdTrace;
		}
	}
	return null;
}
