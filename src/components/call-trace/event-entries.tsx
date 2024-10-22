import React from 'react';
import { ContractCallEvent } from '@/lib/simulation';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { getContractName } from '@/lib/utils';

export function EventsList({ events }: { events: ContractCallEvent[] }) {
	const { expandedCalls, contractCallsMap } = useCallTrace();

	if (events.length === 0) {
		return <div className="px-4 py-2 text-sm">No events emitted during this transaction.</div>;
	}

	return events.map((event, index) => {
		const key = `event-${index}`;
		const contractCall = contractCallsMap[event.contractCallId];

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
						<span className="text-blue-600">{getContractName({ contractCall })}</span>
						{'.'}
						<span className="text-pink-500">{event.name}</span>
						<span className="text-yellow-900">{'('}</span>
						{event.parameters && (
							<span className="text-orange-500">
								{event.parameters.map((p) => p.name).join(', ')}
							</span>
						)}
						<span className="text-yellow-900">{')'}</span>
					</div>
				</TraceLine>
			</React.Fragment>
		);
	});
}
