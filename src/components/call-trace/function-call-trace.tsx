import React, { useContext } from 'react';
import { CallTrace, CodeLocation, InternalFnCallIO, InternalFnCallTrace } from '@/lib/simulation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CallTraceContext } from '@/lib/context/call-trace';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { ErrorTraceLine } from './error-trace-line';
import { CodeViewer } from '../code-viewer/code-viewer';
import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import { DebugButton } from './debug-btn';
import { CommonCallTrace } from './common-call-trace';

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
	} = useContext(CallTraceContext);
	const { debugCall } = useContext(DebuggerContext);

	let code: string | undefined = undefined;

	const cairoLocation: CodeLocation | null = call.data.cairoLocation;
	if (cairoLocation) {
		code =
			simulationDebuggerData.classesDebuggerData[contractCall.additionalInfo.classHash]?.sourceCode[
				cairoLocation.filePath
			];
	}

	const isDebuggable =
		!!contractCall.additionalInfo.callDebuggerData &&
		!!simulationDebuggerData.classesDebuggerData[contractCall.additionalInfo.classHash];

	return (
		<React.Fragment key={call.data.id}>
			<TraceLine
				isActive={expandedCalls[call.data.id]}
				isUnclickable={!code}
				onClick={() => code && toggleCallExpand(call.data.id)}
			>
				{CallTypeChip('Function')}
				{executionFailed && <div className="w-5 mr-0.5"></div>}

				<DebugButton
					onDebugClick={() => {
						debugCall(contractCall, call.data.debuggerExecutionTraceStepIndex);
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
				<div className="flex flex-col bg-sky-50 border-y border-blue-400">
					{code && cairoLocation && (
						<div className="h-80">
							<CodeViewer code={code} codeLocation={cairoLocation} />
						</div>
					)}
				</div>
			)}

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

function FnName({ fnName }: { fnName: string | null }) {
	if (fnName) {
		const splitted = fnName.split('::');
		if (splitted.length >= 2) {
			const lastTwoElements = splitted.slice(-2);
			return (
				<>
					<span className="text-purple-600">{lastTwoElements[0]}</span>::
					<span className="text-pink-500">{lastTwoElements[1]}</span>
				</>
			);
		} else {
			return <span className="text-pink-500">{fnName}</span>;
		}
	} else {
		return <span className="text-pink-500">Unknown function</span>;
	}
}
