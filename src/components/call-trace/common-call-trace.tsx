import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { ContractCallTrace } from './contract-call-trace';
import { FunctionCallTrace } from './function-call-trace';
import { ErrorTraceLine } from './error-trace-line';

export function CommonCallTrace({
	callId,
	nestingLevel,
	callType
}: {
	callId: number;
	nestingLevel: number;
	callType?: 'function' | 'contract';
}) {
	const { functionCallsMap, contractCallsMap, errorMessage } = useCallTrace();

	if (!callType) {
		const functionCall = functionCallsMap[callId];
		const contractCall = contractCallsMap[callId];

		if (functionCall) callType = 'function';
		else if (contractCall) callType = 'contract';
	}

	if (callType === 'function') {
		const functionCall = functionCallsMap[callId];
		if (!functionCall.isHidden) {
			return <FunctionCallTrace functionCallId={callId} nestingLevel={nestingLevel} />;
		} else {
			return (
				<>
					{functionCall.childrenCallIds.map((nestedCallId) => (
						<CommonCallTrace key={nestedCallId} callId={nestedCallId} nestingLevel={nestingLevel} />
					))}
					{functionCall.isDeepestPanicResult && errorMessage && (
						<ErrorTraceLine
							executionFailed
							errorMessage={errorMessage}
							nestingLevel={nestingLevel}
						/>
					)}
				</>
			);
		}
	} else if (callType === 'contract') {
		const contractCall = contractCallsMap[callId];
		if (contractCall.isDeepestPanicResult) {
			console.log(contractCall);
			console.log(nestingLevel);
			<ErrorTraceLine
				errorMessage={errorMessage || ''}
				nestingLevel={nestingLevel}
				executionFailed={true}
			/>;
		}
		if (!contractCall.isHidden) {
			return <ContractCallTrace contractCallId={callId} nestingLevel={nestingLevel} />;
		} else {
			return contractCall.functionCallId ? (
				<CommonCallTrace
					callId={contractCall.functionCallId}
					nestingLevel={nestingLevel}
					callType="function"
				/>
			) : (
				<>
					{contractCall.childrenCallIds.map((childCallId) => (
						<CommonCallTrace
							key={childCallId}
							callId={childCallId}
							nestingLevel={nestingLevel}
							callType="contract"
						/>
					))}
					{contractCall.isDeepestPanicResult &&
						errorMessage &&
						console.log('deepest contract call error ', nestingLevel)}
				</>
			);
		}
	}
}
