import { PropsWithChildren, createContext, useState } from 'react';

interface StringBooleanDict {
	[key: string]: boolean;
}

interface CallTraceContextProps {
	collapsedCalls: StringBooleanDict;
	expandedCalls: StringBooleanDict;
	showEvents: boolean;
	toggleCallCollapse: (id: string) => void;
	toggleCallExpand: (id: string) => void;
}

export const CallTraceContext = createContext<CallTraceContextProps>({
	collapsedCalls: {},
	expandedCalls: {},
	showEvents: true,
	toggleCallCollapse: () => undefined,
	toggleCallExpand: () => undefined
});

export const CallTraceContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [collapsedCalls, setCollapsedCalls] = useState<StringBooleanDict>({});
	const [expandedCalls, setExpandedCalls] = useState<StringBooleanDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);

	const toggleCallCollapse = (id: string) => {
		setCollapsedCalls((prevState) => {
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
				toggleCallExpand
			}}
		>
			{children}
		</CallTraceContext.Provider>
	);
};
