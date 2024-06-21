import { useContext } from 'react';
import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CallTrace, CodeLocation, DataType } from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';
import { CallTraceContext } from '@/lib/context/call-trace';
import { InfoBox } from '@/components/ui/info-box';
import { InternalCallTrace } from './internal-entries';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { CalldataTable } from '../calldata-table';
import { BugAntIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CodeViewer } from '../code-viewer/code-viewer';
import { DebuggerContext } from '@/lib/context/debugger-context-provider';

export function ContractCallTrace({
	calls,
	nestingLevel,
	executionFailed,
	parentId
}: {
	calls: CallTrace[];
	nestingLevel: number;
	executionFailed: boolean;
	parentId?: string;
}) {
	const {
		expandedCalls,
		collapsedCalls,
		toggleCallCollapse,
		toggleCallExpand,
		setActiveTab,
		simulationDebuggerData
	} = useContext(CallTraceContext);
	const { debugCall } = useContext(DebuggerContext);

	return calls.map((call, index) => {
		const callIdentifier = parentId ? `${parentId}-${index}` : index.toString();
		const hasNestedElements = call.nestedCalls.length > 0 || call.internalFnCallTrace;

		let contractName: string | undefined = undefined;
		let entryPointFunctionName = call.additionalInfo?.entryPointFunctionName;

		// The error column doesn't render in case the whole tx is successful
		// If the tx is reverted, the error column will render for all call lines
		// Only the error-ed call line will have the error icon
		let errorColumn = <></>;
		if (executionFailed) {
			errorColumn = (
				<div className="w-5">
					{!!call.additionalInfo.errorMessage && (
						<ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
					)}
				</div>
			);
		}

		if (call.additionalInfo.contractName) {
			contractName = call.additionalInfo.contractName;
		} else if (call.additionalInfo.erc20TokenName || call.additionalInfo.erc20TokenSymbol) {
			contractName = [
				call.additionalInfo.erc20TokenName,
				`(${call.additionalInfo.erc20TokenSymbol})`
			].join(' ');
		}
		if (!contractName) {
			contractName = shortenHash(call.entryPoint.storageAddress, 13);
		}

		const isDebuggable =
			call.additionalInfo.callDebuggerData &&
			simulationDebuggerData.classesDebuggerData[call.additionalInfo.classHash];

		return (
			<React.Fragment key={callIdentifier}>
				<TraceLine
					isActive={expandedCalls[callIdentifier]}
					onClick={() => toggleCallExpand(callIdentifier)}
				>
					{CallTypeChip(call.entryPoint.callType)}

					{/* Error column
					 * Empty in most lines,
					 * or exclamation triangle icon in case of error on the line
					 */}
					{errorColumn}

					<div
						onClick={(event) => {
							event.stopPropagation();
							if (!isDebuggable) return;
							debugCall(call);
							setActiveTab('debugger');
						}}
						className={`w-5 h-5 p-0.5 rounded-sm ${
							isDebuggable ? 'cursor-pointer hover:bg-neutral-200' : ''
						}`}
					>
						{isDebuggable && <BugAntIcon className="w-4 h-4 text-green-700" />}
					</div>

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
						<span className="text-blue-600">{contractName}</span>
						{'.'}
						<span className="text-pink-500">
							{call.additionalInfo?.entryPointFunctionName ??
								shortenHash(call.entryPoint.entryPointSelector, 13)}
						</span>
						<span className="text-yellow-900">{'('}</span>
						{call.additionalInfo?.functionArgumentsNames ? (
							<span className="text-orange-500">
								{call.additionalInfo.functionArgumentsNames.join(', ')}
							</span>
						) : (
							call.additionalInfo?.functionArguments && (
								<span className="text-orange-500">
									{call.additionalInfo.functionArguments.map((arg) => shortenHash(arg)).join(', ')}
								</span>
							)
						)}
						<span className="text-yellow-900">{')'}</span>
						{call.additionalInfo?.functionResult &&
						call.additionalInfo?.functionReturnResultTypes ? (
							<>
								<span className="text-yellow-900">{'->'}</span>
								<span className="text-pink-500">
									{`(${call.additionalInfo?.functionReturnResultTypes.join(', ')})`}
								</span>
							</>
						) : (
							<>
								<span className="text-yellow-900">{'->()'}</span>{' '}
							</>
						)}
					</div>
				</TraceLine>
				{expandedCalls[callIdentifier] && <ContractCallDetails call={call} />}{' '}
				{collapsedCalls[callIdentifier] != true && call.internalFnCallTrace && (
					<InternalCallTrace
						calls={[call.internalFnCallTrace]}
						nestingLevel={nestingLevel + 1}
						parentId={callIdentifier}
						executionFailed={executionFailed}
						errorMessage={call.additionalInfo.errorMessage ?? undefined}
						classHash={call.additionalInfo.classHash}
					/>
				)}
				{collapsedCalls[callIdentifier] != true && (
					<ContractCallTrace
						calls={call.nestedCalls}
						nestingLevel={nestingLevel + 1}
						parentId={callIdentifier}
						executionFailed={executionFailed}
					/>
				)}
			</React.Fragment>
		);
	});
}

function ContractCallDetails({ call }: { call: CallTrace }) {
	const { simulationDebuggerData } = useContext(CallTraceContext);
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

	if (call.additionalInfo.erc20TokenName) {
		details.push({
			name: 'Token Name',
			value: call.additionalInfo.erc20TokenName
		});
	}

	if (call.additionalInfo.erc20TokenSymbol) {
		details.push({
			name: 'Token Symbol',
			value: call.additionalInfo.erc20TokenSymbol
		});
	}

	if (call.additionalInfo.entryPointFunctionName) {
		details.push({
			name: 'Function Name',
			value: call.additionalInfo.entryPointFunctionName
		});
	}

	if (call.additionalInfo.entryPointInterfaceName) {
		details.push({
			name: 'Interface Name',
			value: call.additionalInfo.entryPointInterfaceName
		});
	}

	if (call.additionalInfo.errorMessage) {
		details.push({
			name: 'Error Message',
			value: call.additionalInfo.errorMessage
		});
	}

	if (call.additionalInfo.functionResult) {
		details.unshift({
			name: 'Raw Result',
			value: JSON.stringify(call.additionalInfo.functionResult)
		});
	}

	if (call.additionalInfo.functionArguments) {
		details.unshift({
			name: 'Raw Arguments',
			value: JSON.stringify(call.additionalInfo.functionArguments)
		});
	}

	console.log(call.additionalInfo);

	let code: string | undefined = undefined;

	const cairoLocation: CodeLocation | undefined = call.additionalInfo.cairoLocations?.[0];
	if (cairoLocation) {
		code =
			simulationDebuggerData.classesDebuggerData[call.additionalInfo.classHash]?.sourceCode[
				cairoLocation.filePath
			];
	}

	return (
		<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-1 px-4">
			<InfoBox details={details} />
			{call.additionalInfo?.calldataDecoded && (
				<CalldataTable calldata={call.additionalInfo.calldataDecoded} type={DataType.INPUT} />
			)}
			{call.additionalInfo?.functionResult && (
				<CalldataTable calldata={call.additionalInfo.functionResult} type={DataType.OUTPUT} />
			)}
			{code && cairoLocation && (
				<div className="h-80">
					<CodeViewer code={code} codeLocation={cairoLocation} />
				</div>
			)}
		</div>
	);
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
