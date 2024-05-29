import React, { useContext } from 'react';
import { InternalFnCallTrace } from '@/lib/simulation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CallTraceContext } from '@/lib/context/call-trace';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { ErrorTraceLine } from './error-trace-line';

export function InternalCallTrace({
	calls,
	nestingLevel,
	parentId,
	errorMessage
}: {
	calls: InternalFnCallTrace[];
	nestingLevel: number;
	parentId: string;
	errorMessage?: string;
}) {
	const { notCollapsedInternalFnCalls, toggleInternalFnCallCollapse } =
		useContext(CallTraceContext);

	return calls.map((call, index) => {
		const callIdentifier = `${parentId}-${index}`;

		return (
			<React.Fragment key={callIdentifier}>
				<TraceLine className={`border-y-2 cursor-pointer border-transparent trace-line--selected`}>
					{CallTypeChip('Function')}
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
								call.nestedCalls.length > 0 && toggleInternalFnCallCollapse(callIdentifier);
							}}
						>
							{call.nestedCalls.length > 0 ? (
								notCollapsedInternalFnCalls[callIdentifier] !== true ? (
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

				{notCollapsedInternalFnCalls[callIdentifier] === true ? (
					<InternalCallTrace
						calls={call.nestedCalls}
						nestingLevel={nestingLevel + 1}
						parentId={callIdentifier}
						errorMessage={errorMessage}
					/>
				) : null}

				{notCollapsedInternalFnCalls[callIdentifier] === true &&
					call.data.isPanicResult &&
					errorMessage && (
						<ErrorTraceLine errorMessage={errorMessage} nestingLevel={nestingLevel + 1} />
					)}
			</React.Fragment>
		);
	});
}
