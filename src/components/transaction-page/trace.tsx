import { useState } from 'react';
import { Call, CallIoDecoded } from '@/lib/transaction';
import { copyToClipboard, shortenHash } from '@/lib/utils';
import { ArrowLongRightIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/button';
import { ToggleButton } from '@/components/ui/toggle-button';
import React from 'react';
import clsx from 'clsx';

const CALL_NESTING_SPACE_BUMP: number = 16; // in pixels

interface collapsedCallsDic {
	[key: string]: boolean;
}

export function Trace({ executeInvocation }: { executeInvocation: Call }) {
	const [collapsedCalls, setCollapsedCalls] = useState<collapsedCallsDic>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);

	let handleCallCollapse = function (collapsedCallsData: collapsedCallsDic) {
		setCollapsedCalls(collapsedCallsData);
	};

	return (
		<div className="pt-16">
			<div className="mb-3 flex items-baseline">
				<div className="mr-8 font-medium">Execute Invocation</div>
				<ToggleButton
					enabled={showEvents}
					onToggleChange={() => {
						setShowEvents(!showEvents);
					}}
					onCopy={'Events visible'}
					offCopy={'Events hidden'}
				/>
			</div>
			<div className="overflow-x-auto whitespace-nowrap min-h-[20rem]">
				{CallElements([executeInvocation], 0, showEvents, collapsedCalls, handleCallCollapse)}
			</div>
		</div>
	);
}

function TraceLine({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
	return (
		<div
			className={clsx(
				'p-1 pr-4 flex flex-row items-center hover:bg-neutral-100 w-min rounded-sm',
				className
			)}
			{...props}
		/>
	);
}

function CallChip({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
	return (
		<span
			className={clsx(
				'bg-neutral-50 border-neutral-200 border rounded-sm inline-block text-xs font-medium px-2.5 py-0.5 mr-1',
				className
			)}
			{...props}
		/>
	);
}

function CallElements(
	calls: Call[],
	nesting_level: number,
	showEvents: boolean,
	collapsedCalls: collapsedCallsDic,
	callCollapseHandler: (data: collapsedCallsDic) => void
) {
	return calls.map((call, index) => {
		const callIdentifier =
			call.entry_point_selector + call.class_hash + call.contract_address + index + nesting_level;

		return (
			<React.Fragment key={callIdentifier}>
				<TraceLine>
					{CallTypeChip(call.call_type)}
					<div
						style={{ marginLeft: nesting_level * CALL_NESTING_SPACE_BUMP }}
						className="flex flex-row items-center"
					>
						<div className="w-5 h-5 p-1 mr-1">
							{call.calls.length > 0 || (call.events_decoded && call.events_decoded.length > 0) ? (
								collapsedCalls?.[callIdentifier] == true ? (
									<ChevronRightIcon
										onClick={() => {
											callCollapseHandler({ ...collapsedCalls, ...{ [callIdentifier]: false } });
										}}
									/>
								) : (
									<ChevronDownIcon
										onClick={() => {
											callCollapseHandler({ ...collapsedCalls, ...{ [callIdentifier]: true } });
										}}
									/>
								)
							) : (
								''
							)}
						</div>
						<CallChip onClick={() => copyToClipboard(call.contract_address)}>
							{call.contract_display_name}
							{call.contract_data?.token_name &&
								` (${call.contract_data?.token_name} - ${call.contract_data?.token_symbol})`}
						</CallChip>
						<CallChip>
							{call.function_name ?? shortenHash(call.entry_point_selector, 13)}({' '}
							{CallInputs(call.inputs_decoded)} )
							{call.outputs_decoded && call.outputs_decoded.length > 0 && (
								<>
									<ArrowLongRightIcon className="h-3 w-3 inline mx-1" />
									{'{ '}
									{CallInputs(call.outputs_decoded)}
									{' }'}
								</>
							)}
						</CallChip>
					</div>
				</TraceLine>
				{call.error_message && !(collapsedCalls?.[callIdentifier] == true) && (
					<TraceLine>
						{CallTypeChip('ERROR')}
						<CallChip style={{ marginLeft: (nesting_level + 2.5) * CALL_NESTING_SPACE_BUMP }}>
							{call.error_message}
						</CallChip>
					</TraceLine>
				)}
				{showEvents == true &&
					!(collapsedCalls?.[callIdentifier] == true) &&
					call.events_decoded &&
					call.events_decoded.length > 0 &&
					call.events_decoded.map((event_decoded, j) => (
						<TraceLine key={j}>
							{CallTypeChip('EVENT')}
							<CallChip style={{ marginLeft: (nesting_level + 2.5) * CALL_NESTING_SPACE_BUMP }}>
								{event_decoded.name}
								{event_decoded.order ? `order=${event_decoded.order}` : ''}
								<ArrowLongRightIcon className="h-3 w-3 inline mx-1" />{' '}
								{CallInputs(event_decoded.data)}
							</CallChip>
						</TraceLine>
					))}

				{collapsedCalls?.[callIdentifier] == true ? (
					<></>
				) : (
					CallElements(
						call.calls,
						nesting_level + 1,
						showEvents,
						collapsedCalls,
						callCollapseHandler
					)
				)}
			</React.Fragment>
		);
	});
}

function CallInputs(inputs?: CallIoDecoded[]) {
	return inputs?.map((i, index) => (
		<span key={index}>
			{i.name && <span>{i.name}=</span>}
			{typeof i.value === 'string' ? (
				<span>{shortenHash(i.value)}</span>
			) : i.type && i.type.slice(-1) === '*' ? (
				<span>[{CallInputs(i.value)}]</span>
			) : i.value_formats && i.value_formats.DECIMAL ? (
				<span>{i.value_formats.DECIMAL}</span>
			) : (
				<span>
					{'{ '}
					{CallInputs(i.value)}
					{' }'}
				</span>
			)}
			{index + 1 < inputs.length ? ', ' : ''}
		</span>
	));
}

function CallTypeChip(callType: string) {
	let callTypes: string[];

	if (callType == 'CALL DELEGATE') {
		callTypes = ['CALL', 'DELEGATE'];
	} else {
		callTypes = [callType];
	}

	let callTypeCellClass: { [key: string]: string } = {
		['CALL']: 'bg-green-100 border-green-400 text-green-900',
		['DELEGATE']: 'bg-blue-100 border-blue-400 text-blue-900',
		['EVENT']: 'bg-purple-100 border-purple-400 text-purple-900',
		['ERROR']: 'bg-red-100 border-red-400 text-red-900'
	};

	return (
		<div className="w-20 flex-none flex">
			{callTypes.map((callType) => (
				<div
					key={callType}
					className={`${callTypeCellClass[callType]} flex-auto border text-center rounded-sm inline-block text-xs font-medium px-1.5 py-0.5 mr-1`}
				>
					{callType == 'DELEGATE' ? 'D' : callType}
				</div>
			))}
		</div>
	);
}
