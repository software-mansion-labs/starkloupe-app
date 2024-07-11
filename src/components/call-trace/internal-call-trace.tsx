import React, { useContext } from 'react';
import {
	CodeLocation,
	InternalFnCallIO,
	InternalFnCallTrace,
	getInternalFunctionCallId
} from '@/lib/simulation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CallTraceContext } from '@/lib/context/call-trace';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { ErrorTraceLine } from './error-trace-line';
import { CodeViewer } from '../code-viewer/code-viewer';

export function InternalCallTrace({
	calls,
	nestingLevel,
	contractCallId,
	executionFailed,
	classHash,
	errorMessage
}: {
	calls: InternalFnCallTrace[];
	nestingLevel: number;
	contractCallId: string;
	executionFailed: boolean;
	classHash: string;
	errorMessage?: string;
}) {
	const {
		notCollapsedInternalFnCalls,
		toggleInternalFnCallCollapse,
		simulationDebuggerData,
		expandedCalls,
		toggleCallExpand
	} = useContext(CallTraceContext);

	return calls.map((call, index) => {
		const internalFunctionCallId = getInternalFunctionCallId({ contractCallId, fp: call.data.fp });

		let code: string | undefined = undefined;

		const cairoLocation: CodeLocation | undefined = call.data.cairoLocations?.[0];
		if (cairoLocation) {
			code =
				simulationDebuggerData.classesDebuggerData[classHash]?.sourceCode[cairoLocation.filePath];
		}

		return (
			<React.Fragment key={internalFunctionCallId}>
				<TraceLine
					isActive={expandedCalls[internalFunctionCallId]}
					isUnclickable={!code}
					onClick={() => code && toggleCallExpand(internalFunctionCallId)}
				>
					{CallTypeChip('Function')}
					{executionFailed && <div className="w-5"></div>}

					{/* TODO: add debug button */}
					<div className="w-5"></div>

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
									toggleInternalFnCallCollapse(internalFunctionCallId);
							}}
						>
							{call.nestedCalls.length > 0 || call.data.isPanicResult ? (
								notCollapsedInternalFnCalls[internalFunctionCallId] !== true ? (
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

				{expandedCalls[internalFunctionCallId] && (
					<div className="flex flex-col bg-sky-50 border-y border-blue-400">
						{code && cairoLocation && (
							<div className="h-80">
								<CodeViewer code={code} codeLocation={cairoLocation} />
							</div>
						)}
					</div>
				)}

				{notCollapsedInternalFnCalls[internalFunctionCallId] === true ? (
					<InternalCallTrace
						calls={call.nestedCalls}
						nestingLevel={nestingLevel + 1}
						contractCallId={contractCallId}
						executionFailed={executionFailed}
						errorMessage={errorMessage}
						classHash={classHash}
					/>
				) : null}
				{notCollapsedInternalFnCalls[internalFunctionCallId] === true &&
					call.data.isPanicResult &&
					errorMessage && (
						<ErrorTraceLine
							executionFailed
							errorMessage={errorMessage}
							nestingLevel={nestingLevel + 1}
						/>
					)}
			</React.Fragment>
		);
	});
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
					<span className="text-blue-600">{lastTwoElements[0]}</span>::
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
