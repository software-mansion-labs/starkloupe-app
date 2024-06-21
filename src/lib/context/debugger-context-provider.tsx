import { PropsWithChildren, createContext, useState } from 'react';
import { CallDebuggerData, CallTrace, ClassDebuggerData, SimulationResult } from '@/lib/simulation';

interface DebuggerInfo {
	callDebuggerData: CallDebuggerData;
	classDebuggerData: ClassDebuggerData;
}

interface DebuggerContextProps {
	debuggerInfo?: DebuggerInfo;
	debugCall: (call: CallTrace) => void;
}

export const DebuggerContext = createContext<DebuggerContextProps>({
	debuggerInfo: undefined,
	debugCall: () => undefined
});

export const DebuggerContextProvider: React.FC<
	PropsWithChildren<{ simulationResult: SimulationResult }>
> = ({ children, simulationResult }) => {
	const [debuggerInfo, setDebuggerInfo] = useState<DebuggerInfo | undefined>();

	const debugCall = (call: CallTrace) => {
		if (call.additionalInfo.callDebuggerData) {
			setDebuggerInfo({
				callDebuggerData: call.additionalInfo.callDebuggerData,
				classDebuggerData:
					simulationResult.simulationDebuggerData.classesDebuggerData[call.additionalInfo.classHash]
			});
		}
	};

	return (
		<DebuggerContext.Provider
			value={{
				debuggerInfo,
				debugCall
			}}
		>
			{children}
		</DebuggerContext.Provider>
	);
};
