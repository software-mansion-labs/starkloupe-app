import React, { useContext } from 'react';
import { CallTrace, CodeLocation, InternalFnCallIO, InternalFnCallTrace } from '@/lib/simulation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { ErrorTraceLine } from './error-trace-line';
import { CodeViewer } from '../code-viewer/code-viewer';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import { DebugButton } from './debug-btn';
import { CommonCallTrace } from './common-call-trace';
import { InfoBox } from '@/components/ui/info-box';
import { DecodeDataTable } from '../decode-data-table';
import { DataType } from '@/lib/simulation';

export function FunctionCallTrace({
	call,
	nestingLevel,
	executionFailed,
	errorMessage,
	contractCall
}: {
	call: InternalFnCallTrace;
	nestingLevel: number;
	executionFailed: boolean;
	errorMessage?: string;
	contractCall: CallTrace;
}) {
	const {
		collapsedCalls,
		toggleCallCollapse,
		simulationDebuggerData,
		expandedCalls,
		toggleCallExpand,
		setActiveTab
	} = useCallTrace();
	const { debugCall, checkIfDebuggable } = useDebugger();

	const isDebuggable = checkIfDebuggable(call.data.id);

	return (
		<React.Fragment key={call.data.id}>
			<TraceLine
				isActive={expandedCalls[call.data.id]}
				onClick={() => toggleCallExpand(call.data.id)}
			>
				{CallTypeChip('Function')}
				{executionFailed && <div className="w-5 mr-0.5"></div>}

				<DebugButton
					onDebugClick={() => {
						debugCall(call.data.id);
						setActiveTab('debugger');
					}}
					isDebuggable={isDebuggable}
				/>

				<div
					style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
					className="flex flex-row items-center"
				>
					<div
						className={`w-5 h-5 p-1 mr-1  rounded-sm  ${
							call.nestedCalls.length > 0 || call.data.isPanicResult
								? 'cursor-pointer hover:bg-neutral-200'
								: ''
						}`}
						onClick={(event) => {
							event.stopPropagation();
							(call.nestedCalls.length > 0 || call.data.isPanicResult) &&
								toggleCallCollapse(call.data.id);
						}}
					>
						{call.nestedCalls.length > 0 || call.data.isPanicResult ? (
							collapsedCalls[call.data.id] === true ? (
								<ChevronRightIcon />
							) : (
								<ChevronDownIcon />
							)
						) : (
							''
						)}
					</div>
					<FnName fnName={call.data.fnName} />
					<CallIO ios={call.data.arguments} />
					&nbsp;{'->'}&nbsp;
					<CallIO ios={call.data.results} />
				</div>
			</TraceLine>
			{expandedCalls[call.data.id] && (
				<FunctionCallDetails call={call} contractCall={contractCall} />
			)}{' '}
			{collapsedCalls[call.data.id] != true && (
				<>
					{call.data.nestedCallsIds.map((nestedCallId) => (
						<CommonCallTrace
							key={nestedCallId}
							callId={nestedCallId}
							nestingLevel={nestingLevel + 1}
							executionFailed={executionFailed}
							parentContractCall={contractCall}
						/>
					))}
					{call.data.isPanicResult && errorMessage && (
						<ErrorTraceLine
							executionFailed
							errorMessage={errorMessage}
							nestingLevel={nestingLevel + 1}
						/>
					)}
				</>
			)}
		</React.Fragment>
	);
}

function CallIO({ ios }: { ios: InternalFnCallIO[] }) {
	const ioToSkip = ['RangeCheck', 'GasBuiltin'];
	return (
		<>
			<span className="text-yellow-900">{'('}</span>
			{ios.map((io, i) =>
				ioToSkip.includes(io.typeName ?? '') ? null : (
					<React.Fragment key={i}>
						<span className="text-orange-500">{io.typeName}</span>:&nbsp;
						<span className="text-orange-700">
							{io.value.length === 0
								? 'None'
								: io.value.length === 1
									? io.value[0]
									: `[${io.value.join(', ')}]`}
						</span>
						{i < ios.length - 1 ? <>,&nbsp;</> : ''}
					</React.Fragment>
				)
			)}
			<span className="text-yellow-900">{')'}</span>
		</>
	);
}

function getRawFunctionName(fnName: string): string {
	let rawFnName = fnName.replace(/::?<([^<>]*)>/g, '');
	while (/<[^<>]*>/g.test(rawFnName)) {
		rawFnName = rawFnName.replace(/::?<([^<>]*)>/g, '');
	}
	return rawFnName.replace(/::$/, '');
}

function FnName({ fnName }: { fnName: string | null }) {
	if (fnName) {
		const rawFnName = getRawFunctionName(fnName);
		const splittedFnName = rawFnName.split('::');

		return (
			<>
				{splittedFnName.length >= 2 ? (
					<>
						<span className="text-purple-600">{splittedFnName[splittedFnName.length - 2]}</span>::
						<span className="text-pink-500">{splittedFnName[splittedFnName.length - 1]}</span>
					</>
				) : (
					<span className="text-pink-500">{rawFnName}</span>
				)}
			</>
		);
	} else {
		return <span className="text-pink-500">Unknown function</span>;
	}
}

function FunctionCallDetails({
	call,
	contractCall
}: {
	call: InternalFnCallTrace;
	contractCall: CallTrace;
}) {
	const { simulationDebuggerData } = useCallTrace();
	const details: { name: string; value: string; isCopyable?: boolean; valueToCopy?: string }[] = [];
	if (call.data.fnName) {
		const rawFnName = getRawFunctionName(call.data.fnName);
		const splittedFnName = rawFnName.split('::');

		details.push(
			{
				name: 'Function Name',
				value: splittedFnName[splittedFnName.length - 1]
			},
			{
				name: 'Interface Name',
				value: call.data.fnName
			}
		);
	}
	if (call.data.arguments) {
		details.push({
			name: 'Raw Arguments',
			value: JSON.stringify(call.data.arguments)
		});
	}

	if (call.data.results) {
		details.push({
			name: 'Raw Results',
			value: JSON.stringify(call.data.results)
		});
	}

	let code: string | undefined = undefined;

	const cairoLocation: CodeLocation | null = call.data.cairoLocation;
	if (cairoLocation) {
		code =
			simulationDebuggerData.classesDebuggerData[contractCall.additionalInfo.classHash]?.sourceCode[
				cairoLocation.filePath
			];
	}

	return (
		<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-2 px-4">
			<InfoBox details={details} />
			{call.data?.argumentsDecoded && (
				<DecodeDataTable decodeData={call.data.argumentsDecoded} type={DataType.INPUT} />
			)}
			{call.data?.resultsDecoded && (
				<DecodeDataTable decodeData={call.data.resultsDecoded} type={DataType.OUTPUT} />
			)}
			{code && cairoLocation && (
				<div className="h-80">
					<CodeViewer content={code} codeLocation={cairoLocation} />
				</div>
			)}
		</div>
	);
}
