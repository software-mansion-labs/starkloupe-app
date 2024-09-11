import { CallTraceContext } from '@/lib/context/call-trace-context-provider';
import { useContext } from 'react';
import { ContractCallTrace } from './contract-call-trace';
import { FunctionCallTrace } from './function-call-trace';
import { CallTrace } from '@/lib/simulation';
import { ErrorTraceLine } from './error-trace-line';

export function CommonCallTrace({
	callId,
	nestingLevel,
	executionFailed,
	parentContractCall,
	errorMessage
}: {
	callId: string;
	nestingLevel: number;
	executionFailed: boolean;
	parentContractCall: CallTrace;
	errorMessage?: string;
}) {
	const { callsMap } = useContext(CallTraceContext);

	const call = callsMap.get(callId);

	if (call?.contractCall) {
		return (
			<ContractCallTrace
				call={call.contractCall}
				nestingLevel={nestingLevel}
				executionFailed={executionFailed}
			/>
		);
	} else if (call?.fnCall) {
		return (
			<>
				{call.fnCall.isHidden ? (
					<>
						{call.fnCall.data.nestedCallsIds.map((nestedCallsId) => (
							<CommonCallTrace
								key={nestedCallsId}
								callId={nestedCallsId}
								nestingLevel={nestingLevel}
								executionFailed={executionFailed}
								parentContractCall={parentContractCall}
								errorMessage={errorMessage}
							/>
						))}
					</>
				) : (
					<FunctionCallTrace
						call={call.fnCall}
						nestingLevel={nestingLevel}
						executionFailed={executionFailed}
						contractCall={parentContractCall}
						errorMessage={errorMessage}
					/>
				)}
				{call.fnCall.data.isPanicResult && errorMessage && (
					<ErrorTraceLine executionFailed errorMessage={errorMessage} nestingLevel={nestingLevel} />
				)}
			</>
		);
	}
}
