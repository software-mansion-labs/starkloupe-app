import { InternalFnCallTrace } from '@/lib/simulation';
import React, { useContext } from 'react';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { CallTraceContext } from './context';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

export function InternalCallTrace({
	calls,
	nestingLevel,
	parentId
}: {
	calls: InternalFnCallTrace[];
	nestingLevel: number;
	parentId: string;
}) {
	const { collapsedCalls, toggleCallCollapse } = useContext(CallTraceContext);

	return calls.map((call) => {
		const callIdentifier = parentId + call.data.fp;

		return (
			<React.Fragment key={callIdentifier}>
				<TraceLine className={`border-y-2 cursor-pointer border-transparent trace-line--selected`}>
					{CallTypeChip('Internal')}
					<div
						style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
						className="flex flex-row items-center"
					>
						<div
							className={`w-5 h-5 p-1 mr-1  rounded-sm  ${
								call.nestedCalls.length > 0 ? 'cursor-pointer hover:bg-neutral-200' : ''
							}`}
							onClick={(event) => {
								event.stopPropagation();
								call.nestedCalls.length > 0 && toggleCallCollapse(callIdentifier);
							}}
						>
							{call.nestedCalls.length > 0 ? (
								collapsedCalls[callIdentifier] == true ? (
									<ChevronRightIcon />
								) : (
									<ChevronDownIcon />
								)
							) : (
								''
							)}
						</div>
						<span className="text-pink-500">{call.data.fnName ?? 'Unknown internal function'}</span>
					</div>
				</TraceLine>

				{collapsedCalls[callIdentifier] != true ? (
					<InternalCallTrace
						calls={call.nestedCalls}
						nestingLevel={nestingLevel + 1}
						parentId={callIdentifier}
					/>
				) : null}
			</React.Fragment>
		);
	});
}
