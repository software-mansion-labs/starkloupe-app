import React, { memo } from 'react';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';

export const EventCallTrace = memo(function EventCallTrace({
	eventCallId,
	nestingLevel
}: {
	eventCallId: number;
	nestingLevel: number;
}) {
	const { expandedCalls, contractCallsMap, eventCallsMap, traceLineElementRefs } = useCallTrace();

	const eventCall = eventCallsMap[eventCallId];

	return (
		<React.Fragment key={eventCallId}>
			<TraceLine
				isActive={expandedCalls[eventCallId]}
				ref={traceLineElementRefs.current[eventCallId]}
			>
				{CallTypeChip('Event')}

				{/* Debug button */}
				<div className="w-5"></div>

				<div
					style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
					className="flex flex-row items-center"
				>
					<div className={`w-5 h-5 p-1 mr-1`}></div>
					<span className="text-pink-600">{eventCall.name}</span> (
					{eventCall.parameters.map((param, index) => (
						<span key={index}>
							<span className="text-orange-600">{param.name}</span>:&nbsp;
							<span className="text-green-600">{param.typeName}</span>
							{index < eventCall.parameters.length - 1 && <span>,&nbsp;</span>}
						</span>
					))}
					)
				</div>
			</TraceLine>
		</React.Fragment>
	);
});
