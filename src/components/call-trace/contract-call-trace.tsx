import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CodeLocation, DataType, ContractCall, FlameNode } from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { InfoBox, InfoBoxItem } from '@/components/ui/info-box';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { DecodeDataTable } from '../decode-data-table';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import { DebugButton } from '@/components/call-trace/debug-btn';
import { ErrorTooltip } from '@/components/error-tooltip';
import { CommonCallTrace } from './common-call-trace';
import { ContractCallSignature } from '../ui/signature';
import { ErrorTraceLine } from './error-trace-line';
import ValueWithTooltip from '../ui/value-with-tooltip';
import { useSettings } from '@/lib/context/settings-context-provider';

export const ContractCallTrace = memo(function ContractCallTrace({
	contractCallId,
	nestingLevel,
	previewMode,
	l2Flamegraph
}: {
	contractCallId: number;
	nestingLevel: number;
	previewMode?: boolean;
	l2Flamegraph?: FlameNode | undefined;
}) {
	const {
		expandedCalls,
		collapsedCalls,
		toggleCallCollapse,
		toggleCallExpand,
		setActiveTab,
		contractCallsMap,
		functionCallsMap,
		isExecutionFailed,
		traceLineElementRefs
	} = useCallTrace();
	const { customSettings, updateContractName, updateContractColor, updateContractSettings } =
		useSettings();
	const debuggerContext: ReturnType<typeof useDebugger> = useDebugger();

	let call = contractCallsMap[contractCallId];
	const firstChildCallId = call.childrenCallIds[0];
	const firstChildCall = contractCallsMap[firstChildCallId];
	const formatter = new Intl.NumberFormat(navigator.language);
	let callType = call.entryPoint.callType;

	const hasNestedElements =
		call.childrenCallIds.length > 0 || call.functionCallId || call.isDeepestPanicResult;

	// Check if there are actually visible nested elements (not hidden)
	const hasVisibleNestedElements = useMemo(() => {
		// Check contract call children
		const hasVisibleContractChildren = call.childrenCallIds.some((childId) => {
			const childCall = contractCallsMap[childId];
			return childCall && !childCall.isHidden;
		});

		// Check function call
		const hasVisibleFunctionCall =
			call.functionCallId &&
			functionCallsMap[call.functionCallId] &&
			!functionCallsMap[call.functionCallId].isHidden;

		return hasVisibleContractChildren || hasVisibleFunctionCall || call.isDeepestPanicResult;
	}, [
		call.childrenCallIds,
		call.functionCallId,
		call.isDeepestPanicResult,
		contractCallsMap,
		functionCallsMap
	]);

	// Check if call can be collapsed/expanded (for functionality)
	const canBeCollapsed = useMemo(() => {
		return call.childrenCallIds.length > 0 || call.functionCallId || call.isDeepestPanicResult;
	}, [call.childrenCallIds, call.functionCallId, call.isDeepestPanicResult]);

	// Check if we should show the icon (visible children OR special cases like __validate__)
	const shouldShowIcon = useMemo(() => {
		// Show icon if there are visible children
		if (hasVisibleNestedElements) return true;

		// Show icon for special cases that should always be collapsible (like __validate__)
		// even if all children are hidden
		const isSpecialCase =
			call.entryPointName === '__validate__' || call.entryPointName === '__execute__';

		return isSpecialCase && canBeCollapsed;
	}, [hasVisibleNestedElements, call.entryPointName, canBeCollapsed]);

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

	if (!debuggerContext) return null;
	const { debugContractCall, currentStep } = debuggerContext;

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

	const isDebuggable = call.callDebuggerDataAvailable;

	if (!traceLineElementRefs.current[contractCallId]) {
		traceLineElementRefs.current[contractCallId] = React.createRef<HTMLDivElement>();
	}

	function ArgsWithTooltips() {
		if (call.calldataDecoded) {
			return (
				<>
					{call.calldataDecoded?.map((decoded, i) => {
						const name = call.argumentsNames ? call.argumentsNames[i] : '';
						if (decoded == null) return <React.Fragment key={i}>{name},&nbsp;</React.Fragment>;

						return (
							<React.Fragment key={i}>
								<span className="relative inline-block">
									<span>{name}: </span>
									<span className="text-typeColor">{call.argumentsTypes?.[i] ?? 'unknown'}</span>
									<span> = </span>
									<ValueWithTooltip
										value={decoded}
										fullObject={decoded}
										typeName={decoded.typeName}
										functionName={name}
										isContract
									/>
									{i < (call.argumentsNames?.length ?? 0) - 1 && ',\u00A0'}
								</span>
							</React.Fragment>
						);
					})}
				</>
			);
		} else if (call.entryPoint.calldata) {
			return (
				<>
					<span className="relative inline-block">
						<ValueWithTooltip
							value={call.entryPoint.calldata}
							fullObject={call.entryPoint.calldata}
							isContract
						/>
					</span>
				</>
			);
		}
	}

	function ResultsWithTooltips() {
		return (
			<>
				{call.decodedResult?.map((val, i) => {
					const resultType = call.resultTypes?.[i];
					return (
						<span key={i}>
							<span>{resultType}</span>
							{val != null && (
								<>
									<span> = </span>
									<ValueWithTooltip
										value={val}
										isResult
										fullObject={call.result}
										typeName={val.typeName}
										isContract
									/>
								</>
							)}
						</span>
					);
				})}
			</>
		);
	}

	return (
		<Fragment key={call.callId}>
			<TraceLine
				previewMod={previewMode}
				className={`py-0.5 ${
					previewMode
						? isDebuggable
							? currentStep?.withLocation?.contractCallId === call.callId
								? 'bg-accent hover:bg-accent'
								: 'hover:!bg-accent'
							: ''
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
							shouldShowIcon ? 'cursor-pointer hover:bg-accent_2' : ''
						}`}
						onClick={(event) => {
							event.stopPropagation();
							shouldShowIcon && toggleCallCollapse(call.callId);
						}}
					>
						{shouldShowIcon ? (
							collapsedCalls[call.callId] == true ? (
								<ChevronRightIcon />
							) : (
								<ChevronDownIcon />
							)
						) : (
							''
						)}
					</div>

					<ContractCallSignature
						contractCall={call}
						updateContractName={updateContractName}
						updateContractColor={updateContractColor}
						updateContractSettings={updateContractSettings}
						customSettings={customSettings}
					/>
					{!previewMode && <span className="text-highlight_yellow">{'('}</span>}
					{!previewMode && (call.calldataDecoded || call.entryPoint.calldata) ? (
						<ArgsWithTooltips />
					) : (
						<></>
					)}
					{!previewMode && <span className="text-highlight_yellow">{')'}</span>}
					{!previewMode &&
						(call.decodedResult && call.resultTypes ? (
							<>
								<span className="text-variable">&nbsp;{'->'}&nbsp;</span>
								<span className="text-highlight_yellow">{`(`}</span>
								<span className="text-typeColor">
									<ResultsWithTooltips />
								</span>
								<span className="text-highlight_yellow">{`)`}</span>
							</>
						) : (
							<>
								<span className="text-highlight_yellow">{'->()'}</span>{' '}
							</>
						))}
				</div>
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
						<>{childrenCallIdsArray}</>
					)}
					{call.isDeepestPanicResult && call.errorMessage && !previewMode && (
						<>
							<ErrorTraceLine
								errorCall={call}
								executionFailed
								errorMessage={call.errorMessage}
								nestingLevel={nestingLevel + 1}
							/>
						</>
					)}
				</>
			)}
		</Fragment>
	);
});

const ContractCallDetails = memo(function ContractCallDetails({ call }: { call: ContractCall }) {
	const details: InfoBoxItem[] = [
		{
			name: 'Entry Point Type',
			value: call.entryPoint.entryPointType
		},
		{
			name: 'Caller Address',
			value: call.entryPoint.callerAddress,
			linkHref: `/contracts/${call.entryPoint.callerAddress}`,
			isCopyable: true
		},
		{
			name: 'Initial Gas',
			value: call.entryPoint.initialGas.toString()
		},
		{
			name: 'Contract Address',
			value: call.entryPoint.storageAddress,
			linkHref: `/contracts/${call.entryPoint.storageAddress}`,
			isCopyable: true
		},
		{
			name: 'Class Hash',
			value: call.entryPoint.classHash,
			linkHref: `/classes/${call.entryPoint.classHash}`,
			isCopyable: true
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
	let contractName: string | null = call.contractName ?? null;
	let entryPointInterfaceName: string | null = call.entryPointInterfaceName ?? null;

	const cairoLocation: CodeLocation | undefined = call.codeLocation ?? undefined;

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

	return (
		<div className="flex flex-col bg-sky-50 dark:bg-background border-y border-blue-400 py-1 px-4 ">
			<div className="w-[calc(100vw-4rem)] sm:w-[calc(100vw-7rem)]">
				<div className="">
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
			</div>
		</div>
	);
});
