import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { ContractCallTrace } from './contract-call-trace';
import { FunctionCallTrace } from './function-call-trace';
import { EventCallTrace } from './event-call-trace';
import { ErrorTraceLine } from './error-trace-line';
import { memo, useMemo } from 'react';

export const CommonCallTrace = memo(function CommonCallTrace({
	callId,
	nestingLevel,
	callType
}: {
	callId: number;
	nestingLevel: number;
	callType?: 'event' | 'function' | 'contract';
}) {
	const { eventCallsMap, functionCallsMap, contractCallsMap, errorMessage } = useCallTrace();

	if (!callType) {
		const functionCall = functionCallsMap[callId];
		const contractCall = contractCallsMap[callId];
		const eventCall = eventCallsMap[callId];

		if (functionCall) callType = 'function';
		else if (contractCall) callType = 'contract';
		else if (eventCall) callType = 'event';
	}
	const contractCallIdsArray = useMemo(() => {
		if (contractCallsMap && !contractCallsMap[callId]) {
			return null;
		}
		return contractCallsMap[callId].childrenCallIds.map((childCallId) => (
			<CommonCallTrace
				key={childCallId}
				callId={childCallId}
				nestingLevel={nestingLevel}
				callType="contract"
			/>
		));
		return null;
	}, [contractCallsMap, nestingLevel, callId]);

	const functionCallIdsList = useMemo(() => {
		if (functionCallsMap && !functionCallsMap[callId]) {
			return null;
		}

		if (functionCallsMap[callId].childrenCallIds) {
			return functionCallsMap[callId].childrenCallIds.map((nestedCallId) => (
				<CommonCallTrace key={nestedCallId} callId={nestedCallId} nestingLevel={nestingLevel} />
			));
		}

		return null;
	}, [functionCallsMap, callId, nestingLevel]);

	if (eventCallsMap && eventCallsMap[callId] && callType === 'event') {
		return <EventCallTrace eventCallId={callId} nestingLevel={nestingLevel} />;
	} else if (functionCallsMap && functionCallsMap[callId] && callType === 'function') {
		const functionCall = functionCallsMap[callId];
		if (!functionCall.isHidden) {
			return <FunctionCallTrace functionCallId={callId} nestingLevel={nestingLevel} />;
		} else {
			return (
				<>
					{functionCallIdsList}
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
	} else if (contractCallsMap && contractCallsMap[callId] && callType === 'contract') {
		const contractCall = contractCallsMap[callId];
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
					{contractCallIdsArray}
					{contractCall.isDeepestPanicResult && errorMessage && (
						<ErrorTraceLine
							executionFailed
							errorMessage={errorMessage}
							nestingLevel={nestingLevel}
						/>
					)}
				</>
			);
		}
	}
});
