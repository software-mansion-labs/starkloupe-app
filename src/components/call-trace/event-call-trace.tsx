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
	const {
		isExecutionFailed,
		toggleCallExpand,
		expandedCalls,
		contractCallsMap,
		eventCallsMap,
		traceLineElementRefs
	} = useCallTrace();

	const call = eventCallsMap[eventCallId];

	if (!traceLineElementRefs.current[eventCallId]) {
		traceLineElementRefs.current[eventCallId] = React.createRef<HTMLDivElement>();
	}

	return (
		<React.Fragment key={call.callId}>
			<TraceLine isUnclickable>
				{CallTypeChip('Event')}

				{/* Error column */}
				{isExecutionFailed && <div className="w-5 mr-0.5"></div>}

				{/* Debug button */}
				<div className="w-5"></div>

				<div
					style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
					className="flex flex-row items-center"
				>
					<div className={`w-5 h-5 p-1 mr-1`}></div>
					<span className="text-pink-600">{call.name}</span> (
					{(call.members ?? []).map((member, index) => (
						<span key={index}>
							<span className="text-green-600">{member.name}</span>:&nbsp;
							<span className="text-orange-500">{member.type}</span>
							{index < (call.members?.length ?? 0) - 1 && <span>,&nbsp;</span>}
						</span>
					))}
					)
				</div>
			</TraceLine>
		</React.Fragment>
	);
});
