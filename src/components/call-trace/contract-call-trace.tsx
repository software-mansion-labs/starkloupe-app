import React, { Fragment, memo, useCallback, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CodeLocation, DataType, CallType, ContractCall, FlameNode } from '@/lib/simulation';
import { getContractName, shortenHash } from '@/lib/utils';
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
import { WALNUT_VERIFY_DOCS_URL } from '@/lib/config';

export const ContractCallTrace = memo(function ContractCallTrace({
	contractCallId,
	nestingLevel,
	previewMode,
	flamegraph
}: {
	contractCallId: number;
	nestingLevel: number;
	previewMode?: boolean;
	flamegraph?: FlameNode | undefined;
}) {
	const {
		expandedCalls,
		collapsedCalls,
		toggleCallCollapse,
		toggleCallExpand,
		setActiveTab,
		contractCallsMap,
		isExecutionFailed,
		traceLineElementRefs,
		setChosenCallName
	} = useCallTrace();
	const { debugContractCall, isContractCallDebuggable, currentStep } = useDebugger();

	let call = contractCallsMap[contractCallId];
	const firstChildCallId = call.childrenCallIds[0];
	const firstChildCall = contractCallsMap[firstChildCallId];
	const formatter = new Intl.NumberFormat(navigator.language);
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
				previewMode={previewMode}
				key={childCallId}
				callId={childCallId}
				nestingLevel={nestingLevel + 1}
				callType="contract"
			/>
		));
	}, [call.childrenCallIds, nestingLevel, previewMode]);

	return (
		<Fragment key={call.callId}>
			<TraceLine
				previewMod={previewMode}
				className={`${
					previewMode
						? isDebuggable
							? currentStep?.withLocation?.contractCallId === call.callId
								? 'bg-neutral-100'
								: 'hover:!bg-neutral-50'
							: 'hover:!bg-neutral-50'
						: ''
				}`}
				isActive={!previewMode && expandedCalls[call.callId]}
				onClick={() => {
					if (previewMode) {
						debugContractCall(call.callId);
					} else {
						toggleCallExpand(call.callId);
					}
				}}
				ref={traceLineElementRefs.current[contractCallId]}
			>
				{!previewMode && CallTypeChip(callType)}

				{/* Error column
				 * Empty in most lines,
				 * or exclamation triangle icon in case of error on the line
				 */}
				{errorColumn}
				{!previewMode && (
					<DebugButton
						onDebugClick={() => {
							debugContractCall(call.callId);
							setActiveTab('debugger');
						}}
						isDebuggable={isDebuggable}
					/>
				)}

				<div
					style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
					className="flex flex-row items-center trace-line_content"
				>
					<div
						className={`w-5 h-5 p-1 mr-1  rounded-sm  ${
							hasNestedElements ? 'cursor-pointer hover:!bg-neutral-50' : ''
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
					{!previewMode && <span className="text-yellow-900">{'('}</span>}
					{!previewMode && call.argumentsNames ? (
						<span className="text-green-600">{call.argumentsNames.join(', ')}</span>
					) : (
						<></>
					)}
					{!previewMode && <span className="text-yellow-900">{')'}</span>}
					{!previewMode && call.result && call.resultTypes ? (
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
				{typeof call.sierraGas === 'number' && call.sierraGas > 0 && flamegraph && (
					<div className="ml-auto ">
						<span
							onClick={(e) => {
								e.stopPropagation();
								setChosenCallName(
									`${getContractName({ contractCall: call })}.${
										call?.entryPointName ?? shortenHash(call.entryPoint.entryPointSelector, 13)
									}`
								);
								setActiveTab('gas-profiler');
							}}
							className="text-center rounded-sm border inline-block min-w-[5rem] px-1.5 py-0.5 bg-blue-100 border-blue-400 text-blue-900 ml-2"
						>
							{formatter.format(call.sierraGas)}
						</span>
					</div>
				)}
			</TraceLine>
			{expandedCalls[call.callId] && !previewMode && <ContractCallDetails call={call} />}{' '}
			{collapsedCalls[call.callId] != true && (
				<>
					{call.functionCallId ? (
						<CommonCallTrace
							previewMode={previewMode}
							callId={call.functionCallId}
							nestingLevel={nestingLevel + 1}
							callType="function"
						/>
					) : (
						<>
							{childrenCallIdsArray}
							{call.isDeepestPanicResult && call.errorMessage && !previewMode && (
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
					href={WALNUT_VERIFY_DOCS_URL}
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
					{call.entryPoint.calldata && (
						<DecodeDataTable
							rawData={call.entryPoint.calldata}
							decodeData={call.calldataDecoded}
							type={DataType.CALLDATA}
						/>
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
