import { useEffect, useRef, useState } from 'react';
import { Call, CallEventDecoded, CallIoDecoded } from '@/lib/transaction';
import { copyToClipboard, shortenHash } from '@/lib/utils';
import { ArrowLongRightIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/button';
import { ToggleButton } from '@/components/ui/toggle-button';
import React from 'react';
import clsx from 'clsx';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Details } from '.';

const CALL_NESTING_SPACE_BUMP: number = 16; // in pixels

interface collapsedCallsDic {
	[key: string]: boolean;
}

interface ExpandedCallsDict {
	[key: string]: boolean;
}

type Classes = { [key: string]: { code: string } };

export function Trace({
	executeInvocation,
	classes
}: {
	executeInvocation: Call;
	classes: Classes;
}) {
	const [collapsedCalls, setCollapsedCalls] = useState<collapsedCallsDic>({});
	const [expandedCalls, setExpandedCalls] = useState<ExpandedCallsDict>({});
	const [showEvents, setShowEvents] = useState<boolean>(true);

	let handleCallCollapse = function (collapsedCallsData: collapsedCallsDic) {
		setCollapsedCalls(collapsedCallsData);
	};

	let handleCallExpand = function (expandedCallsData: ExpandedCallsDict) {
		setExpandedCalls(expandedCallsData);
	};

	return (
		<div className="pt-16">
			<div className="pb-3 sm:flex sm:items-center">
				<h3 className="text-xs uppercase font-semibold text-gray-900 mr-8">Execute Invocation</h3>
				<div className="mt-3 sm:ml-4 sm:mt-0">
					<ToggleButton
						enabled={showEvents}
						onToggleChange={() => {
							setShowEvents(!showEvents);
						}}
						onCopy={'Events visible'}
						offCopy={'Events hidden'}
					/>
				</div>
			</div>
			<div className="overflow-x-auto whitespace-nowrap min-h-[20rem] -mx-4 text-xs">
				<div className="min-w-fit">
					{CallElements(
						[executeInvocation],
						0,
						showEvents,
						collapsedCalls,
						handleCallCollapse,
						expandedCalls,
						handleCallExpand,
						classes
					)}
				</div>
			</div>
		</div>
	);
}

function TraceLine({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
	return (
		<div
			className={clsx(
				'py-0.5 px-4 flex flex-row items-center hover:bg-neutral-100 font-mono',
				className
			)}
			{...props}
		/>
	);
}

function CallChip({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
	return <span className={clsx('inline-block py-0.5 mr-1', className)} {...props} />;
}

function CallDetailsIo(tables: { name: string; io: CallIoDecoded[] }[]) {
	return (
		tables.some((t) => t.io.length > 0) && (
			<div className="border border-neutral-300 rounded-sm my-2 overflow-hidden">
				<Table className="text-xs">
					<TableBody>
						{tables.map(
							(t, index) =>
								t.io.length > 0 && (
									<React.Fragment key={index}>
										<TableRow className="bg-neutral-100">
											<TableHead>{t.name}</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Value</TableHead>
										</TableRow>
										{t.io.map((i, index) => (
											<TableRow key={index}>
												<TableCell>{i.name}</TableCell>
												<TableCell>{i.type}</TableCell>
												<TableCell>
													{typeof i.value === 'string' ? (
														<span>{i.value}</span>
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
												</TableCell>
											</TableRow>
										))}
									</React.Fragment>
								)
						)}
					</TableBody>
				</Table>
			</div>
		)
	);
}

function CallElements(
	calls: Call[],
	nesting_level: number,
	showEvents: boolean,
	collapsedCalls: collapsedCallsDic,
	callCollapseHandler: (data: collapsedCallsDic) => void,
	expandedCalls: ExpandedCallsDict,
	callExpandHandler: (data: ExpandedCallsDict) => void,
	classes: Classes
) {
	return calls.map((call, index) => {
		// const [isExpanded, setIsExpanded] = useState(false);
		const callIdentifier =
			call.entry_point_selector + call.class_hash + call.contract_address + index + nesting_level;

		const callDetailsInfo = [
			{ name: 'Contract name', value: call.contract_display_name },
			{
				name: 'Contract address',
				value: call.contract_address
			},
			{
				name: 'Class hash',
				value: call.class_hash
			},
			{
				name: 'Entrypoint selector',
				value: call.entry_point_selector
			},
			{ name: 'Function name', value: call.function_name },
			{
				name: 'Token name',
				value: call.contract_data?.token_name
			},
			{
				name: 'Token symbol',
				value: call.contract_data?.token_symbol
			},
			{
				name: 'Contract version',
				value: call.contract_data?.version
			}
		];

		function CallDetails() {
			const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
			const monacoEl = useRef(null);

			useEffect(() => {
				if (monacoEl) {
					setEditor((editor) => {
						if (editor) return editor;
						const edi = monaco.editor.create(monacoEl.current!, {
							value: classes[call.class_hash].code,
							language: 'rust',
							readOnly: true,
							minimap: { enabled: false }
						});

						if (classes[call.class_hash].code) {
							let x = classes[call.class_hash].code.split('\n');
							// Find the index of the first line of the function
							let i = 0;
							let scrollTo = 0;
							for (; i < x.length; i++) {
								if (x[i].includes(`fn ${call.function_name}(`)) {
									scrollTo = i;
								}
							}

							edi.revealLineInCenter(scrollTo + 1);
						}

						return edi;
					});
				}

				return () => editor?.dispose();
			}, [monacoEl.current]);

			return (
				<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-1 px-4 mb-2">
					<div className="max-w-[90vw]">{Details(callDetailsInfo)}</div>
					<div className="w-fit min-w-[30rem]">
						{CallDetailsIo([
							{ io: call.inputs_decoded ?? [], name: 'Input name' },
							{ io: call.outputs_decoded ?? [], name: 'Output name' }
						])}
					</div>
					<div
						className={`h-[30rem] my-2 ${classes[call.class_hash].code ? '' : 'hidden'}`}
						style={{ width: 'calc(100vw - 4rem)' }}
						ref={monacoEl}
					></div>
				</div>
			);
		}

		function EventDetails({ eventDecoded }: { eventDecoded: CallEventDecoded }) {
			return (
				<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-1 px-4 mb-2">
					<div className="w-fit min-w-[30rem]">
						{CallDetailsIo([{ io: eventDecoded.data ?? [], name: 'Event argument' }])}
					</div>
				</div>
			);
		}

		return (
			<React.Fragment key={callIdentifier}>
				<TraceLine
					className={`border-y-2 cursor-pointer ${
						expandedCalls[callIdentifier]
							? 'border-neutral-300 trace-line--selected'
							: 'border-transparent'
					}`}
					onClick={() =>
						callExpandHandler({
							...expandedCalls,
							[callIdentifier]: !expandedCalls[callIdentifier]
						})
					}
				>
					{CallTypeChip(call.call_type)}
					<div
						style={{ marginLeft: nesting_level * CALL_NESTING_SPACE_BUMP }}
						className="flex flex-row items-center trace-line_content"
					>
						<div
							className={`w-5 h-5 p-1 mr-1  rounded-sm  ${
								call.calls.length > 0 || (call.events_decoded && call.events_decoded.length > 0)
									? 'cursor-pointer hover:bg-neutral-200'
									: ''
							}`}
						>
							{call.calls.length > 0 || (call.events_decoded && call.events_decoded.length > 0) ? (
								collapsedCalls?.[callIdentifier] == true ? (
									<ChevronRightIcon
										onClick={(event) => {
											event.stopPropagation();
											callCollapseHandler({ ...collapsedCalls, ...{ [callIdentifier]: false } });
										}}
									/>
								) : (
									<ChevronDownIcon
										onClick={(event) => {
											event.stopPropagation();
											callCollapseHandler({ ...collapsedCalls, ...{ [callIdentifier]: true } });
										}}
									/>
								)
							) : (
								''
							)}
						</div>
						<span className="text-blue-600">{call.contract_display_name}</span>
						{'.'}
						<span className="text-pink-500">
							{call.function_name ?? shortenHash(call.entry_point_selector, 13)}
						</span>
						<span className="text-yellow-900">{'('}</span>
						{CallInputs(call.inputs_decoded, true)}
						<span className="text-yellow-900">{')'}</span>
						{call.outputs_decoded && call.outputs_decoded.length > 0 && (
							<>
								<ArrowLongRightIcon className="h-3 w-3 inline mx-1" />
								{'{ '}
								{CallInputs(call.outputs_decoded, true)}
								{' }'}
							</>
						)}
					</div>
				</TraceLine>
				{expandedCalls[callIdentifier] && <CallDetails />}
				{showEvents == true &&
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
									style={{ marginLeft: (nesting_level + 2.5) * CALL_NESTING_SPACE_BUMP }}
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
					))}

				{collapsedCalls?.[callIdentifier] == true ? (
					<></>
				) : (
					CallElements(
						call.calls,
						nesting_level + 1,
						showEvents,
						collapsedCalls,
						callCollapseHandler,
						expandedCalls,
						callExpandHandler,
						classes
					)
				)}
				{call.error_message && !(collapsedCalls?.[callIdentifier] == true) && (
					<TraceLine>
						{CallTypeChip('ERROR')}
						<CallChip style={{ marginLeft: (nesting_level + 2.5) * CALL_NESTING_SPACE_BUMP }}>
							{call.error_message}
						</CallChip>
					</TraceLine>
				)}
			</React.Fragment>
		);
	});
}

const BRACKETS_COLORS = ['text-lime-600', 'text-red-500', 'text-purple-500'];
function CallInputs(inputs?: CallIoDecoded[], isShorten = false, nestingLevel = 0) {
	const BRACKETS_COLOR = BRACKETS_COLORS.at(nestingLevel % BRACKETS_COLORS.length);

	return inputs?.map((i, index) => (
		<span key={index}>
			{i.name && <span className="text-sky-900">{i.name}=</span>}
			{typeof i.value === 'string' ? (
				<span className="text-orange-800">{isShorten ? shortenHash(i.value) : i.value}</span>
			) : i.value_formats && i.value_formats.DECIMAL ? (
				<span className="text-green-700">{i.value_formats.DECIMAL}</span>
			) : (
				<span>
					<span className={BRACKETS_COLOR}>{'{'}</span>
					{CallInputs(i.value, isShorten, ++nestingLevel)}
					<span className={BRACKETS_COLOR}>{'}'}</span>
				</span>
			)}
			{index + 1 < inputs.length ? ',\u00A0' : ''}
		</span>
	));
}

function CallTypeChip(callType: string) {
	let callTypeCellClass: { [key: string]: string } = {
		['CALL']: 'bg-green-100 border-green-400 text-green-900',
		['CALL DELEGATE']: 'bg-green-100 border-green-400 text-green-900',
		['DELEGATE']: 'bg-blue-100 border-blue-400 text-blue-900',
		['EVENT']: 'bg-purple-100 border-purple-400 text-purple-900',
		['ERROR']: 'bg-red-100 border-red-400 text-red-900'
	};

	return (
		<div className="w-20 flex-none flex">
			<div
				key={callType}
				className={`${callTypeCellClass[callType]} flex-auto border text-center rounded-sm inline-block px-1.5 py-0.5 mr-1`}
			>
				{callType == 'CALL DELEGATE' ? 'D-CALL' : callType}
			</div>
		</div>
	);
}
