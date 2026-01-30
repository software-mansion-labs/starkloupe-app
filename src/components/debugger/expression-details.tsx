import { useDebugger } from '@/lib/context/debugger-context-provider';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { toast } from '@/components/hooks/use-toast';
import { TextPosition, ContractCall, InternalFnCallIO } from '@/lib/simulation';
import FunctionCallViewer from '../ui/function-call-viewer';

interface ExpressionDetailsProps {
	className?: string;
	toggleExpand: () => void;
	loading?: boolean;
	contractCallDetails?: ContractCall;
}

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

export function ExpressionDetails({
	className,
	toggleExpand,
	loading = false,
	contractCallDetails
}: ExpressionDetailsProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [expression, setExpression] = useState<string>('');
	const [results, setResults] = useState<InternalFnCallIO[] | undefined>(undefined);
	const [args, setArgs] = useState<InternalFnCallIO[] | undefined>(undefined);
	const debuggerContext = useDebugger();

	useEffect(() => {
		if (!debuggerContext) return;
		setResults(debuggerContext.currentStep?.withLocation?.resultsDecoded);
		setArgs(debuggerContext.currentStep?.withLocation?.argumentsDecoded);
	}, [debuggerContext]);

	useEffect(() => {
		if (
			!debuggerContext?.activeFile ||
			!debuggerContext?.codeLocation?.start ||
			!debuggerContext?.codeLocation?.end ||
			!debuggerContext?.codeLocation?.filePath
		)
			return;
		const sourceCode = debuggerContext.sourceCode[debuggerContext.codeLocation.filePath];
		if (!sourceCode) return;
		setExpression(
			truncateString(
				extractCodeFragment(
					sourceCode,
					debuggerContext.codeLocation.start,
					debuggerContext.codeLocation.end
				),
				50
			)
		);
	}, [debuggerContext]);

	const toggle = useCallback(() => {
		setIsExpanded((prev) => !prev);
	}, []);

	if (!debuggerContext) {
		return null;
	}

	const { codeLocation, setExpressionHover, setActiveFile, activeFile, setContractCall } =
		debuggerContext;

	if (!isExpanded) {
		return (
			<div className={cn('w-full h-full flex flex-col', className)}>
				<button
					onClick={() => {
						toggle();
						toggleExpand();
					}}
					className="w-full px-2 py-1 flex items-center justify-between hover:bg-accent h-full"
				>
					<span className="font-medium uppercase whitespace-nowrap">Expression</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		);
	}

	return (
		<div className={cn('w-full h-full flex flex-col', className)}>
			<button
				onClick={() => {
					toggle();
					toggleExpand();
				}}
				className="w-full px-2 py-1 flex items-center justify-between hover:bg-accent h-[32px]"
			>
				<span className="font-medium uppercase whitespace-nowrap">Expression</span>
				<ChevronDown className="w-4 h-4" />
			</button>
			<ScrollArea className="flex-1 bg-background">
				<div className="px-2 py-1">
					{loading ? (
						<ExpressionDetailsSkeleton />
					) : expression ? (
						<div>
							<div className=" backdrop-blur-sm rounded-md overflow-hidden transition-colors">
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<div
											className="inline-block bg-yellow-400/20 hover:bg-yellow-400/30 px-2 py-1 rounded cursor-pointer transition-colors"
											onMouseEnter={() => {
												setExpressionHover(true);
												if (
													debuggerContext?.codeLocation &&
													activeFile !== debuggerContext?.codeLocation?.filePath
												) {
													if (contractCallDetails) setContractCall(contractCallDetails);
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
																if (contractCallDetails) setContractCall(contractCallDetails);
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
									{(args && args.length > 0) || (results && results.length > 0) ? (
										<div className="py-2">
											<FunctionCallViewer
												data={{
													args: args || [],
													result: results
												}}
											/>
										</div>
									) : null}
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center h-40 text-muted-foreground m-2">
							<Code2 className="w-12 h-12 mb-2 opacity-20" />
							<p className="text-sm">No expression available</p>
						</div>
					)}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}

const ExpressionDetailsSkeleton = () => {
	return (
		<div className="bg-card/50 backdrop-blur-sm rounded-md border border-border/50 p-2">
			<div className="flex items-center gap-1.5 mb-1">
				<div className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
				<Skeleton className="h-2.5 w-12" />
			</div>
			<div className="ml-4 space-y-1">
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-3/4 ml-2" />
			</div>
		</div>
	);
};
