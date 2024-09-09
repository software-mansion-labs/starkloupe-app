import { useContext } from 'react';
import React from 'react';
import { EventTrace } from '@/lib/simulation';
import { CallTraceContext } from '@/lib/context/call-trace';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';

export function EventsList({ events }: { events: EventTrace[] }) {
	const { expandedCalls } = useContext(CallTraceContext);

	if (events.length === 0) {
		return <div className="px-4 py-2 text-sm">No events emitted during this transaction.</div>;
	}

	return events.map((event, index) => {
		const key = `event-${index}`;

		return (
			<React.Fragment key={key}>
				<TraceLine
					className={`border-y-2 cursor-pointer ${
						expandedCalls[key] ? 'border-neutral-300 trace-line--selected' : 'border-transparent'
					}`}
				>
					{CallTypeChip('Event')}
					<div
						style={{ marginLeft: CALL_NESTING_SPACE_BUMP }}
						className="flex flex-row items-center trace-line_content"
					>
						<span className="text-blue-600">{event.contractName}</span>
						{'.'}
						<span className="text-pink-500">{event.eventName}</span>
						<span className="text-yellow-900">{'('}</span>
						{event.eventArgumentsNames && (
							<span className="text-orange-500">{event.eventArgumentsNames.join(', ')}</span>
						)}
						<span className="text-yellow-900">{')'}</span>
					</div>
				</TraceLine>
			</React.Fragment>
		);
	});
}
