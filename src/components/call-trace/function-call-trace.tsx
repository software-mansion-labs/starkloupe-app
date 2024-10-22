import React from 'react';
import { ContractCall, CodeLocation, InternalFnCallIO, FunctionCall } from '@/lib/simulation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { ErrorTraceLine } from './error-trace-line';
import { CodeViewer } from '../code-viewer/code-viewer';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import { DebugButton } from './debug-btn';
import { CommonCallTrace } from './common-call-trace';
import { InfoBox } from '@/components/ui/info-box';
import { FnName } from '../ui/function-name';
import { getRawFunctionName } from '@/lib/utils';
import { Card } from '../ui/card';

export function FunctionCallTrace({
	functionCallId,
	nestingLevel
}: {
	functionCallId: number;
	nestingLevel: number;
}) {
	const {
		collapsedCalls,
		toggleCallCollapse,
		expandedCalls,
		toggleCallExpand,
		setActiveTab,
		functionCallsMap,
		contractCallsMap,
		isExecutionFailed,
		traceLineElementRefs,
		errorMessage
	} = useCallTrace();
	const { debugFunctionCall, isFunctionCallDebuggable, isContractCallDebuggable } = useDebugger();

	const functionCall = functionCallsMap[functionCallId];
	const contractCall = contractCallsMap[functionCall.contractCallId];
	const isDebuggable = isFunctionCallDebuggable(functionCallId);
	const isParentContractCallDebuggable = isContractCallDebuggable(functionCall.contractCallId);

	const noCodeLocationAvaliable = isParentContractCallDebuggable && !isDebuggable;
	if (!traceLineElementRefs.current[functionCallId]) {
		traceLineElementRefs.current[functionCallId] = React.createRef<HTMLDivElement>();
	}

	return (
		<React.Fragment key={functionCallId}>
			<TraceLine
				isActive={expandedCalls[functionCallId]}
				onClick={() => toggleCallExpand(functionCallId)}
				ref={traceLineElementRefs.current[functionCallId]}
			>
				{CallTypeChip('Function')}
				{isExecutionFailed && <div className="w-5 mr-0.5"></div>}

				<DebugButton
					onDebugClick={() => {
						debugFunctionCall(functionCallId);
						setActiveTab('debugger');
					}}
					isDebuggable={isDebuggable}
					noCodeLocationAvaliable={noCodeLocationAvaliable}
				/>
				<div
					style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
					className="flex flex-row items-center"
				>
					<div
						className={`w-5 h-5 p-1 mr-1  rounded-sm  ${
							functionCall.childrenCallIds.length > 0 || functionCall.isDeepestPanicResult
								? 'cursor-pointer hover:bg-neutral-200'
								: ''
						}`}
						onClick={(event) => {
							event.stopPropagation();
							(functionCall.childrenCallIds.length > 0 || functionCall.isDeepestPanicResult) &&
								toggleCallCollapse(functionCallId);
						}}
					>
						{functionCall.childrenCallIds.length > 0 || functionCall.isDeepestPanicResult ? (
							collapsedCalls[functionCallId] === true ? (
								<ChevronRightIcon />
							) : (
								<ChevronDownIcon />
							)
						) : (
							''
						)}
					</div>
					<FnName fnName={functionCall.fnName} />
					<CallIO ios={functionCall.arguments} />
					&nbsp;{'->'}&nbsp;
					<CallIO ios={functionCall.results} />
				</div>
			</TraceLine>
			{expandedCalls[functionCallId] && (
				<FunctionCallDetails call={functionCall} contractCall={contractCall} />
			)}{' '}
			{collapsedCalls[functionCallId] != true && (
				<>
					{functionCall.childrenCallIds.map((nestedCallId) => (
						<CommonCallTrace
							key={nestedCallId}
							callId={nestedCallId}
							nestingLevel={nestingLevel + 1}
						/>
					))}
					{functionCall.isDeepestPanicResult && errorMessage && (
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

function FunctionCallDetails({
	call,
	contractCall
}: {
	call: FunctionCall;
	contractCall: ContractCall;
}) {
	const { simulationDebuggerData } = useCallTrace();
	const details: { name: string; value: string; isCopyable?: boolean; valueToCopy?: string }[] = [];
	if (call.fnName) {
		const rawFnName = getRawFunctionName(call.fnName);
		const splittedFnName = rawFnName.split('::');

		details.push(
			{
				name: 'Function Name',
				value: splittedFnName[splittedFnName.length - 1]
			},
			{
				name: 'Interface Name',
				value: call.fnName
			}
		);
	}
	if (call.arguments) {
		details.push({
			name: 'Raw Arguments',
			value: JSON.stringify(call.arguments)
		});
	}

	if (call.results) {
		details.push({
			name: 'Raw Results',
			value: JSON.stringify(call.results)
		});
	}

	let code: string | undefined = undefined;

	const cairoLocation: CodeLocation | null = call.codeLocation ?? null;
	if (cairoLocation) {
		code =
			simulationDebuggerData.classesDebuggerData[contractCall.classHash]?.sourceCode[
				cairoLocation.filePath
			];
	}

	return (
		<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-1 px-4">
			<div className="w-[calc(100vw-4rem)] sm:w-[calc(100vw-7rem)]">
				<div className="">
					<InfoBox details={details} />
				</div>
				{code && cairoLocation && (
					<Card className="mt-5">
						<div className="h-80 ">
							<CodeViewer content={code} codeLocation={cairoLocation} />
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
