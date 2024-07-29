import { PropsWithChildren, createContext, useState } from 'react';
import { CallDebuggerData, CallTrace, ClassDebuggerData, SimulationResult } from '@/lib/simulation';

interface DebuggerInfo {
	callDebuggerData: CallDebuggerData;
	classDebuggerData: ClassDebuggerData;
	initialStepIndex: number;
}

interface DebuggerContextProps {
	debuggerInfo?: DebuggerInfo;
	contractAddress?: string | undefined;
	debugCall: (call: CallTrace, initialStepIndex: number) => void;
}

export const DebuggerContext = createContext<DebuggerContextProps>({
	debuggerInfo: undefined,
	debugCall: () => undefined
});

export const DebuggerContextProvider: React.FC<
	PropsWithChildren<{ simulationResult: SimulationResult }>
> = ({ children, simulationResult }) => {
	const [debuggerInfo, setDebuggerInfo] = useState<DebuggerInfo | undefined>();
	const [contractAddress, setContractAddress] = useState<string | undefined>();

	const debugCall = (call: CallTrace, initialStepIndex: number) => {
		if (call.additionalInfo.callDebuggerData) {
			setDebuggerInfo({
				callDebuggerData: call.additionalInfo.callDebuggerData,
				classDebuggerData:
					simulationResult.simulationDebuggerData.classesDebuggerData[
						call.additionalInfo.classHash
					],
				initialStepIndex
			});
		}
		setContractAddress(call.entryPoint.storageAddress);
	};

	return (
		<DebuggerContext.Provider
			value={{
				debuggerInfo,
				contractAddress,
				debugCall
			}}
		>
			{children}
		</DebuggerContext.Provider>
	);
};
