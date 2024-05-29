import { PropsWithChildren, createContext, useState } from 'react';
import { CallTrace, InternalFnCallTrace } from '@/lib/simulation';

interface StringBooleanDict {
	[key: string]: boolean;
}

interface CallTraceContextProps {
	collapsedCalls: StringBooleanDict;
	expandedCalls: StringBooleanDict;
	showEvents: boolean;
	notCollapsedInternalFnCalls: StringBooleanDict;
	toggleCallCollapse: (id: string) => void;
	toggleCallExpand: (id: string) => void;
	toggleInternalFnCallCollapse: (id: string) => void;
}

export const CallTraceContext = createContext<CallTraceContextProps>({
	collapsedCalls: {},
	expandedCalls: {},
	notCollapsedInternalFnCalls: {},
	showEvents: true,
	toggleCallCollapse: () => undefined,
	toggleCallExpand: () => undefined,
	toggleInternalFnCallCollapse: () => undefined
});

export const CallTraceContextProvider: React.FC<PropsWithChildren<{ callTrace: CallTrace }>> = ({
	children,
	callTrace
}) => {
	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>({});
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);

	const a = processCalls([callTrace]);
	const b = a
		? a.reduce((obj: StringBooleanDict, key) => {
				obj[key] = true;
				return obj;
		  }, {})
		: {};
	console.log(b);

	const [notCollapsedInternalFnCalls, setNotCollapsedInternalFnCalls] =
		useState<StringBooleanDict>(b);

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

function processCalls(calls: CallTrace[], parentId?: string): string[] | null {
	for (let i = 0; i < calls.length; i++) {
		const call = calls[i];
		const callIdentifier = parentId ? `${parentId}-${i}` : i.toString();
		if (call.additionalInfo.errorMessage) {
			if (call.internalFnCallTrace) {
				return processInternalFnCalls([call.internalFnCallTrace], callIdentifier, []);
			}
			break;
		} else {
			const internalFnCallsIdTrace = processCalls(call.nestedCalls, callIdentifier);
			if (internalFnCallsIdTrace) return internalFnCallsIdTrace;
		}
	}
	return null;
}

function processInternalFnCalls(
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
			const currentInternalFnCallsIdTrace = processInternalFnCalls(
				internalCall.nestedCalls,
				callIdentifier,
				[...internalFnCallsIdTrace, callIdentifier]
			);
			if (currentInternalFnCallsIdTrace) return currentInternalFnCallsIdTrace;
		}
	}
	return null;
}
