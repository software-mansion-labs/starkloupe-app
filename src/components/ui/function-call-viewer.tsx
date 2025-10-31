import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Box, Code2, ArrowDownRight, ArrowUpLeft } from 'lucide-react';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import CopyToClipboardElement from './copy-to-clipboard';
import AddressLink from '../address-link';
import { ContractCall, DecodedItem, InternalFnCallIO, TextPosition } from '@/lib/simulation';
import { useSettings } from '@/lib/context/settings-context-provider';
import { toast } from '@/components/hooks/use-toast';
import { ScrollArea, ScrollBar } from './scroll-area';
import { shortenHash } from '@/lib/utils';

interface FilteredStepInfo {
	function?: string | undefined;
	args: InternalFnCallIO[] | string | string[] | DecodedItem[] | boolean;
	result?: InternalFnCallIO[];
	typeName?: string;
	contractCallDetails?: ContractCall | undefined;
}

const FunctionCallViewer = ({
	data,
	isContract = false,
	tooltipValue = false,
	isResult
}: {
	data: FilteredStepInfo;
	isContract?: boolean;
	tooltipValue?: boolean;
	isResult?: boolean;
}) => {
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [isParametersExpanded, setIsParametersExpanded] = useState<boolean>(true);
	const [isExpressionExpanded, setIsExpressionExpanded] = useState<boolean>(false);
	const [expression, setExpression] = useState<string>('');
	const [results, setResults] = useState<InternalFnCallIO[] | undefined>(undefined);
	const [args, setArgs] = useState<InternalFnCallIO[] | undefined>(undefined);
	const debuggerContext = useDebugger();
	const { customSettings, updateContractName, updateContractSettings, updateContractColor } =
		useSettings();

	useEffect(() => {
		if (!debuggerContext) return;
		setResults(debuggerContext.currentStep?.withLocation?.resultsDecoded);
		setArgs(debuggerContext.currentStep?.withLocation?.argumentsDecoded);
	}, [debuggerContext]);

	useEffect(() => {
		if (
			!debuggerContext?.activeFile ||
			!debuggerContext?.codeLocation?.start ||
			!debuggerContext?.codeLocation?.end
		)
			return;
		setExpression(
			truncateString(
				extractCodeFragment(
					debuggerContext.sourceCode[debuggerContext.codeLocation.filePath],
					debuggerContext.codeLocation.start,
					debuggerContext.codeLocation.end
				),
				50
			)
		);
	}, [debuggerContext]);

	function extractCodeFragment(sourceCode: string, start: TextPosition, end: TextPosition): string {
		const lines = sourceCode.split('\n');
		const startLine = start.line;
		const endLine = end.line;
		if (startLine === endLine) {
			return lines[startLine]?.substring(start.col, end.col);
		}

		let fragment = [];
		fragment.push(lines[startLine]?.substring(start.col));
		for (let i = startLine + 1; i < endLine; i++) {
			fragment.push(lines[i]);
		}
		fragment.push(lines[endLine]?.substring(0, end.col));
		return fragment.join('\n');
	}

	function truncateString(str: string | undefined, maxLength: number): string {
		if (!str) return '';
		const cleanedStr = str.replace(/\s+/g, ' ').trim();
		if (cleanedStr.length <= maxLength) return cleanedStr;
		return cleanedStr.substring(0, maxLength) + '...';
	}

	const toggleExpand = (key: string): void => {
		setExpanded((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(key)) newSet.delete(key);
			else newSet.add(key);
			return newSet;
		});
	};

	const formatObject = (obj: any): any => {
		if (Array.isArray(obj)) {
			return obj.map((item: any) => formatObject(item));
		}
		if (
			typeof obj === 'object' &&
			obj !== null &&
			('name' in obj || 'typeName' in obj) &&
			'value' in obj
		) {
			const key = obj.name || obj.typeName;
			return { [key]: formatObject(obj.value) };
		}
		if (typeof obj === 'object' && obj !== null) {
			const keys = Object.keys(obj);
			if (keys.every((key: string) => !isNaN(Number(key)))) {
				return keys.reduce((acc: Record<string, any>, key: string) => {
					const formatted = formatObject(obj[key]);
					if (typeof formatted === 'object' && !Array.isArray(formatted)) {
						Object.keys(formatted).forEach((formattedKey: string) => {
							acc[`${formattedKey}_${key}`] = formatted[formattedKey];
						});
					} else {
						acc[key] = formatted;
					}
					return acc;
				}, {});
			}
			return Object.fromEntries(keys.map((key: string) => [key, formatObject(obj[key])]));
		}
		return obj;
	};

	const renderValue = (item: any, depth: number = 0) => {
		const isAddress = typeof item === 'string' && item.startsWith('0x');

		if (isAddress) {
			return (
				<CopyToClipboardElement
					value={item}
					toastDescription="Copied!"
					className="px-0 py-0 hover:bg-inherit inline-flex"
				>
					<AddressLink address={item} customSettings={customSettings}>
						<span className="font-mono text-[11px]">{item}</span>
					</AddressLink>
				</CopyToClipboardElement>
			);
		}

		return <span className="font-mono text-[11px]">{item?.toString() || 'null'}</span>;
	};

	const renderData = (
		item: any,
		name: string | number,
		path: string,
		skipName = false,
		depth = 0
	) => {
		const key = path;
		const isExpandable = item && typeof item === 'object';
		const isArray = Array.isArray(item);

		if (isExpandable) {
			const entries = isArray ? item : Object.entries(item);

			if (isArray && entries.length === 1) {
				const singleItem = entries[0];
				if (typeof singleItem === 'object' && singleItem !== null) {
					return (
						<div className={depth > 0 ? 'ml-3' : ''}>
							{!skipName && (
								<div className="flex items-center gap-1 mb-0.5">
									<span className="font-mono text-[11px] text-pink-900 dark:text-keys font-medium">
										{name}:
									</span>
								</div>
							)}
							<div className="space-y-0.5">
								{Object.entries(singleItem).map(([childKey, childVal]) => (
									<div key={childKey}>
										{renderData(childVal, childKey, `${key}.0.${childKey}`, false, depth + 1)}
									</div>
								))}
							</div>
						</div>
					);
				}
			}

			const shouldAutoExpand = skipName && depth === 0;
			const isExpanded = shouldAutoExpand || expanded.has(key);

			return (
				<div className={depth > 0 ? 'ml-3' : ''}>
					{!shouldAutoExpand && (
						<div
							className="flex items-center gap-1 cursor-pointer hover:bg-accent/40 -mx-1 px-1 py-0.5 rounded transition-colors group"
							onClick={() => toggleExpand(key)}
						>
							{isExpanded ? (
								<ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
							) : (
								<ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
							)}
							{!skipName && (
								<span className="font-mono text-[11px] text-pink-900 dark:text-keys font-medium">
									{typeof name === 'string' &&
									name.includes('_') &&
									/\d$/.test(name.split('_').pop() || '')
										? name.split('_').slice(0, -1).join('_')
										: name}
								</span>
							)}
							{!isExpanded && (
								<span className="font-mono text-[11px] text-muted-foreground/60 italic ml-1 whitespace-nowrap">
									{isArray
										? `(${entries.length}) [${
												entries.length > 0
													? entries.length === 1 && typeof entries[0] === 'string'
														? entries[0]
														: '...'
													: ''
										  }]`
										: `(${entries.length}) {...}`}
								</span>
							)}
						</div>
					)}

					{isExpanded && (
						<div className="space-y-0.5 mt-0.5">
							{isArray
								? entries.map((child, idx) => (
										<div key={idx}>{renderData(child, idx, `${key}.${idx}`, false, depth + 1)}</div>
								  ))
								: entries.map(([childKey, childVal]) => (
										<div key={childKey}>
											{renderData(
												childVal,
												typeof childKey === 'string' &&
													childKey.includes('_') &&
													/\d$/.test(childKey.split('_').pop() || '')
													? childKey.split('_').slice(0, -1).join('_')
													: childKey,
												`${key}.${childKey}`,
												false,
												depth + 1
											)}
										</div>
								  ))}
						</div>
					)}
				</div>
			);
		}

		return (
			<div className={`flex items-baseline gap-1 ${depth > 0 ? 'ml-3' : ''}`}>
				{!skipName && (
					<span className="font-mono text-[11px] text-pink-900 dark:text-keys font-medium flex-shrink-0">
						{typeof name === 'string' &&
						name.includes('_') &&
						/\d$/.test(name.split('_').pop() || '')
							? name.split('_').slice(0, -1).join('_')
							: name}
						:
					</span>
				)}
				<div className="flex-1 min-w-0">{renderValue(item, depth)}</div>
			</div>
		);
	};

	const formattedArgs = formatObject(data.args);
	const formattedResult = data.result ? formatObject(data.result) : null;

	if (!debuggerContext) {
		return null;
	}

	const { codeLocation, setExpressionHover, setActiveFile, activeFile, setContractCall } =
		debuggerContext;

	const hasArgs =
		typeof data.args === 'boolean' ||
		(Array.isArray(data.args)
			? data.args.length > 0
			: typeof data.args === 'object' && data.args !== null && Object.keys(data.args).length > 0) ||
		typeof data.args === 'string';

	const hasResults = data.result && data.result.length > 0;

	return (
		<div className="px-2 py-1 min-w-[16rem]">
			<div className="space-y-2">
				{(data.contractCallDetails || data.function) && (
					<div className="flex gap-1.5">
						{data.function && isContract && (
							<div className="flex-1 flex bg-card/50 backdrop-blur-sm rounded-md border border-border/50 p-2 hover:border-border transition-colors">
								<div>
									<div className="flex items-center gap-1.5 mb-1">
										{isContract && <ArrowDownRight className="w-3 h-3 text-green-500" />}
										{isContract && (
											<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
												{isContract && 'Argument'}
											</span>
										)}
									</div>
									<div className="ml-4">
										{isContract && (
											<span
												className={`${
													!isContract ? 'text-function_purple' : ''
												} font-mono text-[11px] font-semibold`}
											>
												{data.function}
											</span>
										)}
									</div>
								</div>
							</div>
						)}
						{data.typeName && tooltipValue && (
							<div className="flex-1 bg-card/50 backdrop-blur-sm rounded-md border border-border/50 p-2 hover:border-border transition-colors">
								<div className="flex items-center gap-1.5 mb-1">
									<Box className="w-3 h-3 text-cyan-500" />
									<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
										Type
									</span>
								</div>
								<div className="ml-4">
									<span className="text-typeColor font-mono text-[11px]">{data.typeName}</span>
								</div>
							</div>
						)}
					</div>
				)}

				{data.typeName && tooltipValue && !data.function && (
					<div className="flex-1 bg-card/50 backdrop-blur-sm rounded-md border border-border/50 p-2 hover:border-border transition-colors">
						<div className="flex items-center gap-1.5 mb-1">
							<Box className="w-3 h-3 text-cyan-500" />
							<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
								Type
							</span>
						</div>
						<div className="ml-4">
							<span className="text-typeColor font-mono text-[11px]">{data.typeName}</span>
						</div>
					</div>
				)}
				{tooltipValue ? (
					<div className="space-y-1.5">
						{(() => {
							const hasParamsOrResults = hasArgs || (!isContract && hasResults);
							const hasType = !!data.typeName;
							const blockCount = (hasParamsOrResults ? 1 : 0) + (hasType ? 1 : 0);

							if (blockCount === 2) {
								return (
									<>
										<div className="flex gap-1.5">
											<div className="flex-1 bg-card/50 backdrop-blur-sm rounded-md border border-border/50 overflow-hidden hover:border-border transition-colors">
												<div
													className="flex items-center gap-1.5 p-2 cursor-pointer hover:bg-accent/20 transition-colors"
													onClick={() => setIsParametersExpanded(!isParametersExpanded)}
												>
													{isParametersExpanded ? (
														<ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
													) : (
														<ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
													)}
													<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
														{isResult ? 'Results' : 'Parameters'}
													</span>
												</div>

												{isParametersExpanded && (
													<ScrollArea className="overflow-auto">
														<div className="w-full px-2 pb-2">
															{hasArgs && (
																<div className="space-y-0.5">
																	{renderData(formattedArgs, 'params', 'Parameters', true, 0)}
																</div>
															)}
															{!isContract && hasResults && (
																<>
																	{hasArgs && <div className="border-t border-border/30 my-2" />}
																	<div className="space-y-0.5">
																		{renderData(formattedResult, 'results', 'Results', true, 0)}
																	</div>
																</>
															)}
														</div>
														<ScrollBar orientation="horizontal" />
													</ScrollArea>
												)}
											</div>
										</div>
									</>
								);
							}
							return (
								<>
									{hasParamsOrResults && (
										<div className="bg-card/50 backdrop-blur-sm rounded-md border border-border/50 overflow-hidden hover:border-border transition-colors">
											<div
												className="flex items-center gap-1.5 p-2 cursor-pointer hover:bg-accent/20 transition-colors"
												onClick={() => setIsParametersExpanded(!isParametersExpanded)}
											>
												{isParametersExpanded ? (
													<ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
												) : (
													<ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
												)}
												<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
													{hasType ? 'Parameters' : 'Value'}
												</span>
											</div>

											{isParametersExpanded && (
												<ScrollArea className="overflow-auto">
													<div className="w-full px-2 pb-2">
														{hasArgs && (
															<div className="space-y-0.5">
																{renderData(
																	formattedArgs,
																	'params',
																	hasType ? 'Parameters' : 'Value',
																	true,
																	0
																)}
															</div>
														)}
														{!isContract && hasResults && (
															<>
																{hasArgs && <div className="border-t border-border/30 my-2" />}
																<div className="space-y-0.5">
																	{renderData(
																		formattedResult,
																		'results',
																		hasType ? 'Results' : 'Value',
																		true,
																		0
																	)}
																</div>
															</>
														)}
													</div>
													<ScrollBar orientation="horizontal" />
												</ScrollArea>
											)}
										</div>
									)}

									{hasType && (
										<>
											<div className="bg-card/50 backdrop-blur-sm rounded-md border border-border/50 p-2 hover:border-border transition-colors">
												<div className="flex items-center gap-1.5 mb-1">
													<Box className="w-3 h-3 text-cyan-500" />
													<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
														Type
													</span>
												</div>
												<div className="ml-4">
													<span className="text-typeColor font-mono text-[11px]">
														{data.typeName}
													</span>
												</div>
											</div>
											{hasParamsOrResults && (
												<div className="bg-card/50 backdrop-blur-sm rounded-md border border-border/50 overflow-hidden hover:border-border transition-colors">
													<div
														className="flex items-center gap-1.5 p-2 cursor-pointer hover:bg-accent/20 transition-colors"
														onClick={() => setIsParametersExpanded(!isParametersExpanded)}
													>
														{isParametersExpanded ? (
															<ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
														) : (
															<ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
														)}
														<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
															Value
														</span>
													</div>

													{isParametersExpanded && (
														<ScrollArea className="overflow-auto">
															<div className="w-full px-2 pb-2">
																{hasArgs && (
																	<div className="space-y-0.5">
																		{renderData(formattedArgs, 'params', 'Value', true, 0)}
																	</div>
																)}
																{!isContract && hasResults && (
																	<>
																		{hasArgs && <div className="border-t border-border/30 my-2" />}
																		<div className="space-y-0.5">
																			{renderData(formattedResult, 'results', 'Value', true, 0)}
																		</div>
																	</>
																)}
															</div>
															<ScrollBar orientation="horizontal" />
														</ScrollArea>
													)}
												</div>
											)}
										</>
									)}
								</>
							);
						})()}
					</div>
				) : (
					(hasArgs || (!isContract && hasResults) || data.typeName) && (
						<div className="flex gap-1.5 min-w-[12rem]">
							{(hasArgs || (!isContract && hasResults)) && (
								<div className="flex-1 bg-card/50 backdrop-blur-sm rounded-md border border-border/50 overflow-hidden hover:border-border transition-colors">
									<div
										className="flex items-center gap-1.5 p-2 cursor-pointer hover:bg-accent transition-colors"
										onClick={() => setIsParametersExpanded(!isParametersExpanded)}
									>
										{isParametersExpanded ? (
											<ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
										) : (
											<ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
										)}
										<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
											{hasArgs && !isContract && hasResults
												? 'Parameters & Results'
												: hasArgs
												? 'Parameters & Results'
												: 'Results'}
										</span>
									</div>

									{isParametersExpanded && (
										<ScrollArea className="overflow-auto">
											<div className="w-full px-2 pb-2">
												{hasArgs && (
													<div className="space-y-1">
														{!tooltipValue && (
															<div className="flex items-center gap-1.5">
																<ArrowDownRight className="w-3 h-3 text-green-500" />
																<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
																	Parameters
																</span>
															</div>
														)}
														<div className="space-y-0.5">
															{renderData(formattedArgs, 'params', 'Parameters', true, 0)}
														</div>
													</div>
												)}

												{!isContract && hasResults && (
													<>
														{hasArgs && <div className="border-t border-border/30 my-2" />}
														<div className="space-y-1">
															<div className="flex items-center gap-1.5">
																<ArrowUpLeft className="w-3 h-3 text-blue-500" />
																<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
																	Results
																</span>
															</div>
															<div className="space-y-0.5">
																{renderData(formattedResult, 'results', 'Results', true, 0)}
															</div>
														</div>
													</>
												)}
											</div>
											<ScrollBar orientation="horizontal" />
										</ScrollArea>
									)}
								</div>
							)}
							{data.typeName && (
								<div className="flex-1 bg-card/50 backdrop-blur-sm rounded-md border border-border/50 p-2 hover:border-border transition-colors">
									<div className="flex items-center gap-1.5 mb-1">
										<Box className="w-3 h-3 text-cyan-500" />
										<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
											Type
										</span>
									</div>
									<div className="ml-4">
										<span className="text-typeColor font-mono text-[11px]">{data.typeName}</span>
									</div>
								</div>
							)}
						</div>
					)
				)}
				{!tooltipValue && expression && (
					<div className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 backdrop-blur-sm rounded-md border border-yellow-500/20 overflow-hidden hover:border-yellow-500/30 transition-colors">
						<div
							className="flex items-center gap-1.5 p-2 cursor-pointer hover:bg-yellow-500/10 transition-colors"
							onClick={() => setIsExpressionExpanded(!isExpressionExpanded)}
						>
							{isExpressionExpanded ? (
								<ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
							) : (
								<ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
							)}
							<Code2 className="w-3 h-3 text-yellow-600 dark:text-yellow-500" />
							<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
								Expression
							</span>
						</div>

						{isExpressionExpanded && (
							<ScrollArea className="overflow-auto">
								<div className="w-full px-3 py-3">
									<div className="flex flex-wrap items-center gap-2">
										<div
											className="inline-block bg-yellow-400/20 hover:bg-yellow-400/30 px-2 py-1 rounded border border-yellow-400/30 cursor-pointer transition-colors"
											onMouseEnter={() => {
												setExpressionHover(true);
												if (
													debuggerContext?.codeLocation &&
													activeFile !== debuggerContext?.codeLocation?.filePath
												) {
													if (data.contractCallDetails) setContractCall(data.contractCallDetails);
													setActiveFile(debuggerContext?.codeLocation?.filePath);
													toast({
														title: 'Active file changed',
														description: `Opened ${debuggerContext?.codeLocation?.filePath}`
													});
												}
											}}
											onMouseLeave={() => setExpressionHover(false)}
										>
											<code className="font-mono text-[11px] text-yellow-900 dark:text-yellow-100 whitespace-nowrap">
												{expression}
											</code>
										</div>
										<div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
											<span className="flex items-center gap-1 whitespace-nowrap">
												Line{' '}
												{codeLocation?.start.line &&
													(codeLocation?.start.line === codeLocation?.end.line
														? `${codeLocation?.start.line + 1}`
														: `${codeLocation?.start.line + 1}-${codeLocation?.end.line + 1}`)}
											</span>
											{debuggerContext?.codeLocation?.filePath && (
												<>
													<span className="text-muted-foreground/50">•</span>
													<span
														onClick={() => {
															if (
																debuggerContext?.codeLocation &&
																activeFile !== debuggerContext?.codeLocation?.filePath
															) {
																if (data.contractCallDetails)
																	setContractCall(data.contractCallDetails);
																setActiveFile(debuggerContext?.codeLocation?.filePath);
																toast({
																	title: 'Active file changed',
																	description: `Opened ${debuggerContext?.codeLocation?.filePath}`
																});
															}
														}}
														className="hover:underline cursor-pointer hover:text-foreground transition-colors truncate max-w-[200px]"
													>
														{debuggerContext?.codeLocation?.filePath}
													</span>
												</>
											)}
										</div>
									</div>
									{args && args.length > 0 && (
										<div className="pt-2 border-t border-yellow-500/20">
											<div className="flex items-center gap-1.5 mb-1.5">
												<ArrowDownRight className="w-3 h-3 text-green-500" />
												<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
													Parameters
												</span>
											</div>
											{renderData(formatObject(args), 'params', 'expr_args', true, 0)}
										</div>
									)}

									{results && results.length > 0 && (
										<div className="pt-2 border-t border-yellow-500/20">
											<div className="flex items-center gap-1.5 mb-1.5">
												<ArrowUpLeft className="w-3 h-3 text-blue-500" />
												<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
													Results
												</span>
											</div>
											{renderData(formatObject(results), 'results', 'expr_result', true, 0)}
										</div>
									)}
								</div>
								<ScrollBar orientation="horizontal" />
							</ScrollArea>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default FunctionCallViewer;
