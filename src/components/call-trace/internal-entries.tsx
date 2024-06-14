import React, { useContext } from 'react';
import { CodeLocation, InternalFnCallTrace } from '@/lib/simulation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CallTraceContext } from '@/lib/context/call-trace';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { ErrorTraceLine } from './error-trace-line';
import { CodeViewer } from '../code-viewer/code-viewer';

function padHexString(hexString: string) {
	const targetLength = 66; // The target length of the string
	const prefix = '0x'; // The prefix to be included in the length

	// Remove the prefix if it exists
	if (hexString.startsWith(prefix)) {
		hexString = hexString.slice(2);
	}

	// Pad the string with zeros at the start
	hexString = hexString.padStart(targetLength - prefix.length, '0');

	// Add the prefix back
	hexString = prefix + hexString;

	return hexString;
}

export function InternalCallTrace({
	calls,
	nestingLevel,
	parentId,
	executionFailed,
	classHash,
	errorMessage
}: {
	calls: InternalFnCallTrace[];
	nestingLevel: number;
	parentId: string;
	executionFailed: boolean;
	classHash: string;
	errorMessage?: string;
}) {
	const {
		notCollapsedInternalFnCalls,
		toggleInternalFnCallCollapse,
		sourceCode,
		expandedCalls,
		toggleCallExpand
	} = useContext(CallTraceContext);

	return calls.map((call, index) => {
		const callIdentifier = `${parentId}-${index}`;

		let code: string | undefined = undefined;

		// TODO: pad the class hash on the backend
		const classHashString = padHexString(classHash);
		const cairoLocation: CodeLocation | undefined = call.data.cairoLocations?.[0];
		if (cairoLocation) {
			code = sourceCode[padHexString(classHashString)]?.[cairoLocation.filePath];
		}

		return (
			<React.Fragment key={callIdentifier}>
				<TraceLine
					isActive={expandedCalls[callIdentifier]}
					isUnclickable={!code}
					onClick={() => code && toggleCallExpand(callIdentifier)}
				>
					{CallTypeChip('Function')}
					{executionFailed && <div className="w-5"></div>}
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

				{expandedCalls[callIdentifier] && (
					<div className="flex flex-col bg-sky-50 border-y border-blue-400">
						{code && cairoLocation && (
							<div className="h-80">
								<CodeViewer code={code} codeLocation={cairoLocation} />
							</div>
						)}
					</div>
				)}

				{notCollapsedInternalFnCalls[callIdentifier] === true ? (
					<InternalCallTrace
						calls={call.nestedCalls}
						nestingLevel={nestingLevel + 1}
						parentId={callIdentifier}
						executionFailed={executionFailed}
						errorMessage={errorMessage}
						classHash={classHash}
					/>
				) : null}
				{notCollapsedInternalFnCalls[callIdentifier] === true &&
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
