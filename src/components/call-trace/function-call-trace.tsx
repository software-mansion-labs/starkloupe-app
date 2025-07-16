import React, { memo, useMemo } from 'react';
import { ContractCall, InternalFnCallIO, FunctionCall } from '@/lib/simulation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { ErrorTraceLine } from './error-trace-line';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import { DebugButton } from './debug-btn';
import { CommonCallTrace } from './common-call-trace';
import { InfoBox } from '@/components/ui/info-box';
import { FnName } from '../ui/function-name';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import { Copy } from 'lucide-react';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import FunctionCallViewer from '../ui/function-call-viewer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import AddressLink from '../address-link';

interface DataItem {
	name: string | null;
	typeName: string;
	value: any;
}

export const FunctionCallTrace = memo(function FunctionCallTrace({
	previewMode,
	functionCallId,
	nestingLevel
}: {
	previewMode?: boolean;
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
	const debuggerContext: ReturnType<typeof useDebugger> = useDebugger();

	const functionCall = functionCallsMap[functionCallId];
	const contractCall = contractCallsMap[functionCall.contractCallId];

	const isDebuggable = functionCall.debuggerDataAvailable;
	const isParentContractCallDebuggable = contractCall.callDebuggerDataAvailable;

	const noCodeLocationAvaliable = isParentContractCallDebuggable && !isDebuggable;
	if (!traceLineElementRefs.current[functionCallId]) {
		traceLineElementRefs.current[functionCallId] = React.createRef<HTMLDivElement>();
	}

	if (!debuggerContext) return null;
	const { debugContractCall, currentStep } = debuggerContext;
	return (
		<React.Fragment key={functionCallId}>
			<TraceLine
				previewMod={previewMode}
				className={`py-0.5 ${
					previewMode
						? isDebuggable
							? currentStep?.withLocation?.functionCallId === functionCallId ||
							  currentStep?.withContractCall?.contractCallId
								? 'bg-accent hover:bg-accent'
								: 'hover:!bg-accent'
							: ''
						: ''
				}`}
				isActive={!previewMode && expandedCalls[functionCallId]}
				onClick={() => {
					if (previewMode) {
						debugContractCall(functionCall.contractCallId);
					} else {
						toggleCallExpand(functionCallId);
					}
				}}
				ref={traceLineElementRefs.current[functionCallId]}
			>
				{!previewMode && CallTypeChip('Function')}

				{isExecutionFailed && <div className="w-5 mr-0.5"></div>}
				{!previewMode && (
					<DebugButton
						onDebugClick={() => {
							debugContractCall(functionCall.contractCallId);
							setActiveTab('debugger');
						}}
						isDebuggable={isDebuggable}
						noCodeLocationAvaliable={noCodeLocationAvaliable}
					/>
				)}

				<div
					style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
					className="flex flex-row items-center trace-line_content"
				>
					<div
						className={`w-5 h-5 p-1 mr-1  rounded-sm  ${
							functionCall.childrenCallIds.length > 0 || functionCall.isDeepestPanicResult
								? 'cursor-pointer hover:!bg-accent_2'
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
					{!previewMode && <CallIO ios={functionCall.argumentsDecoded} />}
					{!previewMode && <span className="text-variable">&nbsp;{'->'}&nbsp;</span>}
					{!previewMode && <CallIO ios={functionCall.resultsDecoded} />}
				</div>
			</TraceLine>
			{expandedCalls[functionCallId] && !previewMode && (
				<FunctionCallDetails call={functionCall} contractCall={contractCall} />
			)}{' '}
			{collapsedCalls[functionCallId] != true && (
				<>
					{functionCall.childrenCallIds.map((nestedCallId) => (
						<CommonCallTrace
							previewMode={previewMode}
							key={nestedCallId}
							callId={nestedCallId}
							nestingLevel={nestingLevel + 1}
						/>
					))}
					{functionCall.isDeepestPanicResult && errorMessage && !previewMode && (
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
});
const ioToSkip = ['RangeCheck', 'GasBuiltin'];

const CallIO = memo(function CallIO({ ios }: { ios: DataItem[] }) {
	const truncateValue = (value: string): { text: string; isTruncated: boolean } => {
		if (value.length <= 13) {
			return { text: value, isTruncated: false };
		}
		return {
			text: `${value.substring(0, 6)}...${value.substring(value.length - 6)}`,
			isTruncated: true
		};
	};

	const renderValue = (value: any): { text: string; isTruncated: boolean } => {
		if (Array.isArray(value)) {
			if (value.length === 0) {
				return { text: 'None', isTruncated: false };
			}
			const rendered = value.map((item) => extractPureValue(item));
			const fullValue = `[${rendered.join(', ')}]`;
			return truncateValue(fullValue);
		}

		const pureValue = extractPureValue(value);
		return truncateValue(pureValue);
	};

	const extractPureValue = (item: any): string => {
		if (typeof item === 'string' || typeof item === 'number') {
			return item.toString();
		}

		if (item === null || item === undefined) {
			return 'null';
		}
		if (typeof item === 'object') {
			if ('value' in item && item.value !== undefined) {
				return extractPureValue(item.value);
			}

			const keys = Object.keys(item);
			if (keys.every((key) => /^\d+$/.test(key))) {
				const parts = keys
					.sort((a, b) => parseInt(a) - parseInt(b))
					.map((key) => extractPureValue(item[key]));
				return `[${parts.join(', ')}]`;
			}

			const firstKey = Object.keys(item)[0];
			if (firstKey && item[firstKey] && typeof item[firstKey] === 'object') {
				if (!/^\d+$/.test(firstKey)) {
					return extractPureValue(item[firstKey]);
				}
			}
			return JSON.stringify(item);
		}

		return item.toString();
	};

	const iosList = useMemo(() => {
		if (!ios || !Array.isArray(ios)) {
			return null;
		}

		return ios.map((io, i) => {
			const valueInfo = renderValue(io.value);
			return (
				<React.Fragment key={i}>
					<span className="text-typeColor">{io.typeName}</span>&nbsp;=&nbsp;
					<DropdownMenu>
						<TooltipProvider delayDuration={100}>
							<Tooltip>
								<TooltipTrigger asChild>
									<DropdownMenuTrigger asChild>
										<span
											className={`py-1 hover:bg-accent_2 h-full ${
												valueInfo.isTruncated
													? 'text-variable border-variable border-b '
													: 'text-result border-result'
											}  transition-colors duration-200 focus:outline-none rounded-sm`}
										>
											{valueInfo.isTruncated ? (
												valueInfo.text.startsWith('0x') ? (
													<AddressLink address={io.value} addressClassName="!text-variable">
														{valueInfo.text}
													</AddressLink>
												) : (
													valueInfo.text
												)
											) : (
												<CopyToClipboardElement
													value={valueInfo.text}
													toastDescription={'Value has been copied'}
												>
													{valueInfo.text}
												</CopyToClipboardElement>
											)}
										</span>
									</DropdownMenuTrigger>
								</TooltipTrigger>
								{valueInfo.isTruncated && (
									<TooltipContent className="bg-background border-border text-black dark:text-white border">
										Click to show full value
									</TooltipContent>
								)}
							</Tooltip>
						</TooltipProvider>
						{valueInfo.isTruncated && (
							<DropdownMenuContent
								className="bg-card shadow-xl border rounded-lg text-xs max-w-[90vw] w-fit min-w-[16rem] p-0"
								onClick={(e) => {
									e.stopPropagation();
								}}
								onMouseDown={(e) => {
									e.stopPropagation();
								}}
								onWheel={(e) => {
									e.stopPropagation();
								}}
								onScroll={(e) => {
									e.stopPropagation();
								}}
							>
								<div className="relative">
									<CopyToClipboardElement
										value={JSON.stringify(io)}
										toastDescription={`Value has been copied`}
										className="absolute top-2 right-3 z-10 bg-accent p-1.5 rounded transition-colors duration-200 focus:outline-none focus:ring-2"
										aria-label="Copy"
									>
										<Copy size={14} />
									</CopyToClipboardElement>

									<ScrollArea
										className="w-full h-40 px-3 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-accent [&::-webkit-scrollbar-thumb]:rounded-full"
										onScroll={(e) => e.stopPropagation()}
									>
										<div className="pt-2">
											{io.value !== undefined && (
												<FunctionCallViewer
													data={{
														function: io.name ? io.name : undefined,
														//@ts-ignore
														args:
															typeof io.value === 'object' && !Array.isArray(io.value)
																? [io.value]
																: io.value,
														typeName: io.typeName
													}}
												/>
											)}
										</div>
										<ScrollBar
											orientation="horizontal"
											className="sticky bottom-0 left-0 right-0 h-2"
										/>
									</ScrollArea>
								</div>
							</DropdownMenuContent>
						)}
					</DropdownMenu>
					{i < ios.length - 1 ? <>,&nbsp;</> : ''}
				</React.Fragment>
			);
		});
	}, [ios]);

	return (
		<>
			<span className="text-highlight_yellow">{'('}</span>
			{iosList}
			<span className="text-highlight_yellow">{')'}</span>
		</>
	);
});

const FunctionCallDetails = memo(function FunctionCallDetails({
	call,
	contractCall
}: {
	call: FunctionCall;
	contractCall: ContractCall;
}) {
	const details: { name: string; value: string; isCopyable?: boolean; valueToCopy?: string }[] = [];
	if (call.fnName) {
		const splittedFnName = call.fnName.split('::');

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

	return (
		<div className="flex flex-col bg-sky-50 dark:bg-background border-y border-blue-400 py-1 px-4">
			<div className="w-[calc(100vw-4rem)] sm:w-[calc(100vw-7rem)]">
				<div className="">
					<InfoBox details={details} />
				</div>
			</div>
		</div>
	);
});
