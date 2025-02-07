import React, { Fragment, memo, useCallback, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CodeLocation, DataType, CallType, ContractCall } from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { InfoBox } from '@/components/ui/info-box';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { DecodeDataTable } from '../decode-data-table';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CodeViewer } from '../code-viewer/code-viewer';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import { DebugButton } from '@/components/call-trace/debug-btn';
import { ErrorTooltip } from '@/components/error-tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CommonCallTrace } from './common-call-trace';
import { Card } from '../ui/card';
import { ContractCallSignature } from '../ui/signature';
import { ErrorTraceLine } from './error-trace-line';

export const ContractCallTrace = memo(function ContractCallTrace({
	contractCallId,
	nestingLevel
}: {
	contractCallId: number;
	nestingLevel: number;
}) {
	const {
		expandedCalls,
		collapsedCalls,
		toggleCallCollapse,
		toggleCallExpand,
		setActiveTab,
		contractCallsMap,
		isExecutionFailed,
		traceLineElementRefs
	} = useCallTrace();
	const { debugContractCall, isContractCallDebuggable } = useDebugger();

	let call = contractCallsMap[contractCallId];
	const firstChildCallId = call.childrenCallIds[0];
	const firstChildCall = contractCallsMap[firstChildCallId];

	let callType = call.entryPoint.callType;

	const hasNestedElements =
		call.childrenCallIds.length > 0 || call.functionCallId || call.isDeepestPanicResult;

	// The error column doesn't render in case the whole tx is successful
	// If the tx is reverted, the error column will render for all call lines
	// Only the error-ed call line will have the error icon
	let errorColumn = <></>;
	if (isExecutionFailed) {
		errorColumn = (
			<div className="w-5 mr-0.5">
				{!!call.errorMessage && <ErrorTooltip errorMessage={call.errorMessage} />}
			</div>
		);
	}

	let contractName: string | undefined = undefined;
	if (call.contractName) {
		contractName = call.contractName;
	} else if (call.erc20TokenName || call.erc20TokenSymbol) {
		contractName = [call.erc20TokenName, `(${call.erc20TokenSymbol})`].join(' ');
	} else if (call.entryPointInterfaceName) {
		contractName = call.entryPointInterfaceName.split('::').pop();
	}

	if (!contractName) {
		contractName = shortenHash(call.entryPoint.storageAddress, 13);
	}

	const isDebuggable = isContractCallDebuggable(call.callId);

	if (!traceLineElementRefs.current[contractCallId]) {
		traceLineElementRefs.current[contractCallId] = React.createRef<HTMLDivElement>();
	}

	const childrenCallIdsArray = useMemo(() => {
		return call.childrenCallIds.map((childCallId) => (
			<CommonCallTrace
				key={childCallId}
				callId={childCallId}
				nestingLevel={nestingLevel + 1}
				callType="contract"
			/>
		));
	}, [call.childrenCallIds, nestingLevel]);

	return (
		<Fragment key={call.callId}>
			<TraceLine
				isActive={expandedCalls[call.callId]}
				onClick={() => {
					toggleCallExpand(call.callId);
				}}
				ref={traceLineElementRefs.current[contractCallId]}
			>
				{CallTypeChip(callType)}

				{/* Error column
				 * Empty in most lines,
				 * or exclamation triangle icon in case of error on the line
				 */}
				{errorColumn}

				<DebugButton
					onDebugClick={() => {
						debugContractCall(call.callId);
						setActiveTab('debugger');
					}}
					isDebuggable={isDebuggable}
				/>

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
							hasNestedElements && toggleCallCollapse(call.callId);
						}}
					>
						{hasNestedElements ? (
							collapsedCalls[call.callId] == true ? (
								<ChevronRightIcon />
							) : (
								<ChevronDownIcon />
							)
						) : (
							''
						)}
					</div>

					<ContractCallSignature contractCall={call} />
					<span className="text-yellow-900">{'('}</span>
					{call.argumentsNames ? (
						<span className="text-green-600">{call.argumentsNames.join(', ')}</span>
					) : (
						<></>
					)}
					<span className="text-yellow-900">{')'}</span>
					{call.result && call.resultTypes ? (
						<>
							<span className="text-yellow-900">&nbsp;{'->'}&nbsp;</span>
							<span className="text-pink-500">{`(${call.resultTypes.join(', ')})`}</span>
						</>
					) : (
						<>
							<span className="text-yellow-900">{'->()'}</span>{' '}
						</>
					)}
				</div>
			</TraceLine>
			{expandedCalls[call.callId] && <ContractCallDetails call={call} />}{' '}
			{collapsedCalls[call.callId] != true && (
				<>
					{call.functionCallId ? (
						<CommonCallTrace
							callId={call.functionCallId}
							nestingLevel={nestingLevel + 1}
							callType="function"
						/>
					) : (
						<>
							{childrenCallIdsArray}
							{call.isDeepestPanicResult && call.errorMessage && (
								<ErrorTraceLine
									executionFailed
									errorMessage={call.errorMessage}
									nestingLevel={nestingLevel + 1}
								/>
							)}
						</>
					)}
				</>
			)}
		</Fragment>
	);
});

const ContractCallDetails = memo(function ContractCallDetails({ call }: { call: ContractCall }) {
	const { simulationDebuggerData } = useCallTrace();
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
			name: 'Contract Address',
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

	if (call.erc20TokenName) {
		details.push({
			name: 'Token Name',
			value: call.erc20TokenName
		});
	}

	if (call.erc20TokenSymbol) {
		details.push({
			name: 'Token Symbol',
			value: call.erc20TokenSymbol
		});
	}

	if (call.entryPointName) {
		details.push({
			name: 'Function Name',
			value: call.entryPointName
		});
	}

	if (call.entryPointInterfaceName) {
		details.push({
			name: 'Interface Name',
			value: call.entryPointInterfaceName
		});
	}

	if (call.errorMessage) {
		details.push({
			name: 'Error Message',
			value: call.errorMessage
		});
	}

	if (call.cairoVersion) {
		details.push({
			name: 'Cairo Version',
			value: call.cairoVersion
		});
	}

	if (call.result) {
		details.unshift({
			name: 'Raw Result',
			value: JSON.stringify(call.result)
		});
	}

	const callDebuggerData = call.callDebuggerData;
	const classDebuggerData = simulationDebuggerData.classesDebuggerData[call.classHash];
	const hasDebuggableInfo =
		!!callDebuggerData && !!callDebuggerData.executionTrace && !!classDebuggerData;

	let code: string | undefined = undefined;

	let contractName: string | null = call.contractName ?? null;
	let entryPointInterfaceName: string | null = call.entryPointInterfaceName ?? null;

	const cairoLocation: CodeLocation | undefined = call.codeLocation ?? undefined;
	const sourceCodeFiles: { [key: string]: string } | undefined = classDebuggerData?.sourceCode;

	const findFilePath = useCallback(
		(terms: string[], files: { [key: string]: string }): string | undefined => {
			for (const term of terms) {
				const filePath = Object.keys(files).find((path) => path.includes(`${term}.cairo`));
				if (filePath) return filePath;
			}
			return undefined;
		},
		[]
	);

	if (sourceCodeFiles) {
		if (cairoLocation) {
			code = sourceCodeFiles[cairoLocation.filePath];
		} else {
			let filePath: string | undefined;
			if (contractName) {
				const name = contractName.toLowerCase();
				filePath = Object.keys(sourceCodeFiles).find((path) =>
					path.toLowerCase().includes(`${name}.cairo`)
				);
			} else if (entryPointInterfaceName) {
				const terms = entryPointInterfaceName.split('::');
				filePath = findFilePath(terms, sourceCodeFiles);
			}
			code = filePath ? sourceCodeFiles[filePath] : undefined;
		}
	}

	const noSourceCodeAlert = (
		<Alert className="my-2 w-fit">
			<ExclamationTriangleIcon className="h-5 w-5" />
			<AlertTitle>No source code for this contract</AlertTitle>
			<AlertDescription>
				<a
					href={'https://docs.walnut.dev/verify-contract-classes'}
					className="text-blue-500 cursor-pointer"
					target="_blank"
					rel="noreferrer"
				>
					Verify the contract source code
				</a>{' '}
				to get internal call traces and enable the step-by-step debugger.
			</AlertDescription>
		</Alert>
	);

	return (
		<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-2 px-4 ">
			<div className="w-[calc(100vw-4rem)] sm:w-[calc(100vw-7rem)]">
				<div className="">
					{!hasDebuggableInfo && noSourceCodeAlert}
					<InfoBox details={details} />
					{call.calldataDecoded && (
						<DecodeDataTable decodeData={call.calldataDecoded} type={DataType.INPUT} />
					)}
					{call.decodedResult && (
						<DecodeDataTable decodeData={call.decodedResult} type={DataType.OUTPUT} />
					)}
				</div>

				{code && (
					<Card className="">
						<div className="h-80 ">
							<CodeViewer content={code} codeLocation={cairoLocation} />
						</div>
					</Card>
				)}
			</div>
		</div>
	);
});
