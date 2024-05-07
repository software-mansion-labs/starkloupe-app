import { useContext } from 'react';
import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CallTrace } from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';
import { CallTraceContext } from '@/lib/context/call-trace';
import { CallDetails } from '@/components/ui/call-details';
import { InternalCallTrace } from './internal-entries';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';

export function ContractCallTrace({
	calls,
	nestingLevel,
	parentId
}: {
	calls: CallTrace[];
	nestingLevel: number;
	parentId?: string;
}) {
	const { expandedCalls, collapsedCalls, showEvents, toggleCallCollapse, toggleCallExpand } =
		useContext(CallTraceContext);

	return calls.map((call, index) => {
		const callIdentifier =
			(parentId ?? '') +
			call.entryPoint.entryPointSelector +
			call.entryPoint.storageAddress +
			index;
		const hasNestedElements = call.nestedCalls.length > 0 || call.internalFnCallTrace;

		return (
			<React.Fragment key={callIdentifier}>
				<TraceLine
					className={`border-y-2 cursor-pointer ${
						expandedCalls[callIdentifier]
							? 'border-neutral-300 trace-line--selected'
							: 'border-transparent'
					}`}
					onClick={() => toggleCallExpand(callIdentifier)}
				>
					{CallTypeChip(call.entryPoint.callType)}
					<div
						style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
						className="flex flex-row items-center trace-line_content"
					>
						<div
							className={`w-5 h-5 p-1 mr-1  rounded-sm  ${
								hasNestedElements ? 'cursor-pointer hover:bg-neutral-200' : ''
							}`}
							onClick={(event) => {
								event.stopPropagation();
								hasNestedElements && toggleCallCollapse(callIdentifier);
							}}
						>
							{hasNestedElements ? (
								collapsedCalls[callIdentifier] == true ? (
									<ChevronRightIcon />
								) : (
									<ChevronDownIcon />
								)
							) : (
								''
							)}
						</div>
						<span className="text-blue-600">{call.entryPoint.storageAddress}</span>
						{'.'}
						<span className="text-pink-500">
							{shortenHash(call.entryPoint.entryPointSelector, 13)}
						</span>
						<span className="text-yellow-900">{'('}</span>
						<span className="text-yellow-900">{')'}</span>
					</div>
				</TraceLine>
				{expandedCalls[callIdentifier] && <ContractCallDetails call={call} />}

				{collapsedCalls[callIdentifier] != true && call.internalFnCallTrace && (
					<InternalCallTrace
						calls={[call.internalFnCallTrace]}
						nestingLevel={nestingLevel + 1}
						parentId={callIdentifier}
					/>
				)}

				{collapsedCalls[callIdentifier] != true && (
					<ContractCallTrace
						calls={call.nestedCalls}
						nestingLevel={nestingLevel + 1}
						parentId={callIdentifier}
					/>
				)}
			</React.Fragment>
		);
	});
}

function ContractCallDetails({ call }: { call: CallTrace }) {
	const details: { name: string; value: string; isCopyable?: boolean; valueToCopy?: string }[] = [
		{
			name: 'Entry Point Type',
			value: call.entryPoint.entryPointType
		},
		{
			name: 'Caller Address',
			value: call.entryPoint.callerAddress
		},
		{
			name: 'Initial Gas',
			value: call.entryPoint.initialGas.toString()
		},
		{
			name: 'Calldata',
			value: JSON.stringify(call.entryPoint.calldata)
		},
		{
			name: 'Storage Address',
			value: call.entryPoint.storageAddress
		},
		{
			name: 'Class Hash',
			value: call.entryPoint.classHash
		},
		{
			name: 'Entrypoint Selector',
			value: call.entryPoint.entryPointSelector
		},
		{
			name: 'Result',
			value: JSON.stringify(call.result)
		}
	];
	return <CallDetails details={details} isTraceElement />;
}

// function EventDetails({ eventDecoded }: { eventDecoded: CallEventDecoded }) {
// 	return (
// 		<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-1 px-4 mb-2">
// 			<div className="w-fit min-w-[30rem]">
// 				{CallDetailsIo([{ io: eventDecoded.data ?? [], name: 'Event argument' }])}
// 			</div>
// 		</div>
// 	);
// }

/* {showEvents == true &&
					!(collapsedCalls?.[callIdentifier] == true) &&
					call.events_decoded &&
					call.events_decoded.length > 0 &&
					call.events_decoded.map((event_decoded, j) => (
						<div key={j}>
							<TraceLine
								key={j}
								onClick={() =>
									callExpandHandler({
										...expandedCalls,
										[callIdentifier + event_decoded.name]:
											!expandedCalls[callIdentifier + event_decoded.name]
									})
								}
								className={`border-y-2 cursor-pointer ${
									expandedCalls[callIdentifier + event_decoded.name]
										? 'border-neutral-300 trace-line--selected'
										: 'border-transparent'
								}`}
							>
								{CallTypeChip('EVENT')}
								<CallChip
									style={{ marginLeft: (nestingLevel + 2.5) * CALL_NESTING_SPACE_BUMP }}
									className="trace-line_content"
								>
									{event_decoded.name}
									{event_decoded.order ? `order=${event_decoded.order}` : ''}
									<ArrowLongRightIcon className="h-3 w-3 inline mx-1" />{' '}
									{CallInputs(event_decoded.data)}
								</CallChip>
							</TraceLine>
							{expandedCalls[callIdentifier + event_decoded.name] && (
								<EventDetails eventDecoded={event_decoded} />
							)}
						</div>
					))} */

{
	/* {call.error_message && !(collapsedCalls?.[callIdentifier] == true) && (
					<TraceLine>
						{CallTypeChip('ERROR')}
						<CallChip style={{ marginLeft: (nestingLevel + 2.5) * CALL_NESTING_SPACE_BUMP }}>
							{call.error_message}
						</CallChip>
					</TraceLine>
				)} */
}
