import { useContext } from 'react';
import React from 'react';
import { EventTrace } from '@/lib/simulation';
import { CallTraceContext } from '@/lib/context/call-trace';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';

export function EventsList({ events }: { events: EventTrace[] }) {
	const { expandedCalls } = useContext(CallTraceContext);
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
				{/* {expandedTraceIndex === index && (
            <div className="justify-center py-2">
             {call.eventDatas && call.eventDatas.length > 0 && (
              <Table className="w-auto bg-white text-xs border border-neutral-200 mx-auto mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {call.eventDatas.map((item: string, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="border-r border-neutral-200 last:border-r-0 whitespace-break-spaces">
                      {item}
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            )}
            {call.eventKeys && call.eventKeys.length > 0 && (
              <Table className="w-auto bg-white text-xs border border-neutral-200 mx-auto mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Keys</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {call.eventKeys.map((item: string, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="border-r border-neutral-200 last:border-r-0 whitespace-break-spaces">
                      {item}
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            )}
            </div>
          )} */}
			</React.Fragment>
		);
	});
}
