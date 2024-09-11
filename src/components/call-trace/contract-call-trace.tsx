import { Fragment, useContext } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CallTrace, CodeLocation, DataType, CallType, getContractCallId } from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { InfoBox } from '@/components/ui/info-box';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { CalldataTable } from '../calldata-table';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CodeViewer } from '../code-viewer/code-viewer';
import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import { DebugButton } from '@/components/call-trace/debug-btn';
import { ErrorTooltip } from '@/components/error-tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CommonCallTrace } from './common-call-trace';
import { Card } from '../ui/card';
import { ContractCallSignature } from '../ui/signature';

export function ContractCallTrace({
	call,
	nestingLevel,
	executionFailed
}: {
	call: CallTrace;
	nestingLevel: number;
	executionFailed: boolean;
}) {
	const {
		expandedCalls,
		collapsedCalls,
		toggleCallCollapse,
		toggleCallExpand,
		setActiveTab,
		simulationDebuggerData
	} = useCallTrace();
	const { debugCall, checkIfDebuggable } = useContext(DebuggerContext);

	let callType = call.entryPoint.callType;
	if (
		callType === CallType.CALL &&
		call.nestedCalls.length > 0 &&
		call.nestedCalls[0].entryPoint.callType === CallType.DELEGATE &&
		call.entryPoint.storageAddress === call.nestedCalls[0].entryPoint.storageAddress &&
		call.entryPoint.entryPointSelector === call.nestedCalls[0].entryPoint.entryPointSelector
	) {
		call = call.nestedCalls[0];
		callType = CallType.DCALL;
	}
	const hasNestedElements = call.nestedCalls.length > 0 || call.fnCalls.length > 0;

	let entryPointFunctionName = call.additionalInfo?.entryPointFunctionName;

	// The error column doesn't render in case the whole tx is successful
	// If the tx is reverted, the error column will render for all call lines
	// Only the error-ed call line will have the error icon
	let errorColumn = <></>;
	if (executionFailed) {
		errorColumn = (
			<div className="w-5 mr-0.5">
				{!!call.additionalInfo.errorMessage && (
					<ErrorTooltip errorMessage={call.additionalInfo.errorMessage} />
				)}
			</div>
		);
	}

	let contractName: string | undefined = undefined;
	if (call.additionalInfo.contractName) {
		contractName = call.additionalInfo.contractName;
	} else if (call.additionalInfo.erc20TokenName || call.additionalInfo.erc20TokenSymbol) {
		contractName = [
			call.additionalInfo.erc20TokenName,
			`(${call.additionalInfo.erc20TokenSymbol})`
		].join(' ');
	} else if (call.additionalInfo.entryPointInterfaceName) {
		contractName = call.additionalInfo.entryPointInterfaceName.split('::').pop();
	}

	if (!contractName) {
		contractName = shortenHash(call.entryPoint.storageAddress, 13);
	}

	const isDebuggable = checkIfDebuggable(call.contractCallId);

	return (
		<Fragment key={call.contractCallId}>
			<TraceLine
				isActive={expandedCalls[call.contractCallId]}
				onClick={() => toggleCallExpand(call.contractCallId)}
			>
				{CallTypeChip(callType)}

				{/* Error column
				 * Empty in most lines,
				 * or exclamation triangle icon in case of error on the line
				 */}
				{errorColumn}

				<DebugButton
					onDebugClick={() => {
						debugCall(call.contractCallId);
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
							hasNestedElements && toggleCallCollapse(call.contractCallId);
						}}
					>
						{hasNestedElements ? (
							collapsedCalls[call.contractCallId] == true ? (
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
					{call.additionalInfo?.functionResult && call.additionalInfo?.functionReturnResultTypes ? (
						<>
							<span className="text-yellow-900">&nbsp;{'->'}&nbsp;</span>
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
			{expandedCalls[call.contractCallId] && <ContractCallDetails call={call} />}{' '}
			{collapsedCalls[call.contractCallId] != true && (
				<>
					{call.nestedCallsIds.map((nestedCallId) => (
						<CommonCallTrace
							key={nestedCallId}
							callId={nestedCallId}
							nestingLevel={nestingLevel + 1}
							executionFailed={executionFailed}
							parentContractCall={call}
							errorMessage={call.additionalInfo.errorMessage ?? undefined}
						/>
					))}
				</>
			)}
		</Fragment>
	);
}

function ContractCallDetails({ call }: { call: CallTrace }) {
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

	if (call.additionalInfo.cairoVersion) {
		details.push({
			name: 'Cairo Version',
			value: call.additionalInfo.cairoVersion
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

	const callDebuggerData = call.additionalInfo.callDebuggerData;
	const classDebuggerData =
		simulationDebuggerData.classesDebuggerData[call.additionalInfo.classHash];
	const hasDebuggableInfo =
		!!callDebuggerData && !!callDebuggerData.executionTrace && !!classDebuggerData;

	let code: string | undefined = undefined;

	let contractName: string | null = call.additionalInfo.contractName;
	let entryPointInterfaceName: string | null = call.additionalInfo.entryPointInterfaceName;

	const cairoLocation: CodeLocation | undefined = call.additionalInfo.cairoLocation;
	const sourceCodeFiles: { [key: string]: string } | undefined = classDebuggerData?.sourceCode;

	const findFilePath = (terms: string[], files: { [key: string]: string }): string | undefined => {
		for (const term of terms) {
			const filePath = Object.keys(files).find((path) => path.includes(`${term}.cairo`));
			if (filePath) return filePath;
		}
		return undefined;
	};

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
		<div className="flex flex-col bg-sky-50 border-y border-blue-400 py-2 px-4">
			{!hasDebuggableInfo && noSourceCodeAlert}
			<InfoBox details={details} />
			{call.additionalInfo?.calldataDecoded && (
				<CalldataTable calldata={call.additionalInfo.calldataDecoded} type={DataType.INPUT} />
			)}
			{call.additionalInfo?.functionResult && (
				<CalldataTable calldata={call.additionalInfo.functionResult} type={DataType.OUTPUT} />
			)}
			{code && (
				<Card>
					<div className="h-80">
						<CodeViewer content={code} codeLocation={cairoLocation} />
					</div>
				</Card>
			)}
		</div>
	);
}
