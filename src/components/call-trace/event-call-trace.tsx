import React, { memo } from 'react';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { EventCall, DataType } from '@/lib/simulation';
import { DecodeDataTable } from '../decode-data-table';

export const EventCallTrace = memo(function EventCallTrace({
	eventCallId,
	nestingLevel
}: {
	eventCallId: number;
	nestingLevel: number;
}) {
	const { toggleCallExpand, expandedCalls, contractCallsMap, eventCallsMap, traceLineElementRefs } =
		useCallTrace();

	const call = eventCallsMap[eventCallId];

	if (!traceLineElementRefs.current[eventCallId]) {
		traceLineElementRefs.current[eventCallId] = React.createRef<HTMLDivElement>();
	}

	return (
		<React.Fragment key={call.callId}>
			<TraceLine
				isActive={expandedCalls[call.callId]}
				onClick={() => {
					toggleCallExpand(call.callId);
				}}
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
					<span className="text-pink-600">{call.name}</span> (
					{(call.datas ?? []).map((param, index) => (
						<span key={index}>
							<span className="text-green-600">{param.name}</span>:&nbsp;
							<span className="text-orange-500">{param.typeName}</span>
							{index < (call.datas?.length ?? 0) - 1 && <span>,&nbsp;</span>}
						</span>
					))}
					)
				</div>
			</TraceLine>
			{expandedCalls[call.callId] && <EventCallDetails call={call} />}
		</React.Fragment>
	);
});

const EventCallDetails = memo(function EventCallDetails({ call }: { call: EventCall }) {
	return (
		<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-2 px-4 ">
			<div className="w-[calc(100vw-4rem)] sm:w-[calc(100vw-7rem)]">
				<div className=""></div>
				{call.datas && <DecodeDataTable decodeData={call.datas} type={DataType.INPUT} />}
			</div>
		</div>
	);
});
