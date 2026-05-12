import { useState } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { getContractName } from '@/lib/utils';

const RedDot = ({ size = 10, hollow = false }: { size?: number; hollow?: boolean }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 16 16"
		xmlns="http://www.w3.org/2000/svg"
		className="flex-none"
	>
		{hollow ? (
			<circle cx="8" cy="8" r="3.25" fill="none" stroke="#E51400" strokeWidth="1.5" />
		) : (
			<circle cx="8" cy="8" r="4" fill="#E51400" />
		)}
	</svg>
);

export function BreakpointsList({
	handleFileClick
}: {
	handleFileClick: (filePath: string) => void;
}) {
	const debuggerContext = useDebugger();
	const { contractCallsMap } = useCallTrace();
	const [open, setOpen] = useState(false);

	if (!debuggerContext) return null;

	const {
		fileBreakpoints,
		toggleBreakpoint,
		disabledBreakpoints,
		toggleBreakpointEnabled,
		clearAllBreakpoints,
		classesDebuggerData,
		debugContractCall,
		setScrollTarget
	} = debuggerContext;

	const groups = Object.entries(fileBreakpoints)
		.map(([classHash, files]) => {
			const contractCall = Object.values(contractCallsMap).find(
				(call) => call.classHash === classHash
			);
			const contractName = contractCall
				? getContractName({ contractCall })
				: `${classHash.slice(0, 8)}…`;
			const fileEntries = Object.entries(files)
				.map(([filePath, lines]) => ({
					filePath,
					lines: [...lines].sort((a, b) => a - b)
				}))
				.filter((f) => f.lines.length > 0)
				.sort((a, b) => a.filePath.localeCompare(b.filePath));
			return { classHash, contractCall, contractName, files: fileEntries };
		})
		.filter((g) => g.files.length > 0)
		.sort((a, b) =>
			a.contractName.localeCompare(b.contractName, undefined, { sensitivity: 'base' })
		);

	const totalCount = groups.reduce(
		(sum, g) => sum + g.files.reduce((s, f) => s + f.lines.length, 0),
		0
	);

	const onLineClick = (filePath: string, line: number, contractCallId: number | undefined) => {
		if (contractCallId != null) {
			debugContractCall(contractCallId);
		}
		setTimeout(() => {
			handleFileClick(filePath);
			setScrollTarget({ filePath, line });
		});
		setOpen(false);
	};

	return (
		<Popover
			open={open}
			onOpenChange={(o) => {
				if (!o || totalCount > 0) setOpen(o);
			}}
		>
			<Tooltip delayDuration={100}>
				<TooltipTrigger asChild>
					<PopoverTrigger
						type="button"
						aria-label="Breakpoints"
						disabled={totalCount === 0}
						className="flex items-center gap-1 h-5 px-1 rounded-sm select-none cursor-pointer hover:bg-accent border-0 bg-transparent disabled:cursor-default disabled:hover:bg-transparent"
					>
						<RedDot size={11} />
						<span
							className={` leading-none tabular-nums ${
								totalCount > 0 ? 'text-foreground' : 'text-muted-foreground'
							}`}
						>
							{totalCount}
						</span>
					</PopoverTrigger>
				</TooltipTrigger>
				<TooltipContent className="bg-background border-border text-black dark:text-white border">
					Breakpoints
				</TooltipContent>
			</Tooltip>
			<PopoverContent
				align="end"
				sideOffset={8}
				onCloseAutoFocus={(e) => e.preventDefault()}
				className="w-80 p-0 overflow-hidden bg-background border-border"
			>
				<div className="flex items-center justify-between px-3 h-9 border-b">
					<div className="text-sm tracking-tight">
						BREAKPOINTS
						{totalCount > 0 && (
							<span className="ml-1.5 font-normal text-muted-foreground">{totalCount}</span>
						)}
					</div>
					{totalCount > 0 && (
						<button
							type="button"
							onClick={() => clearAllBreakpoints()}
							className="text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline"
						>
							Clear all
						</button>
					)}
				</div>
				{totalCount === 0 ? (
					<div className="px-3 py-6 text-center">
						<div className="text-xs font-medium text-muted-foreground">No breakpoints set</div>
						<div className="mt-1 text-[11px] text-muted-foreground/70">
							Click in the editor gutter to add one
						</div>
					</div>
				) : (
					<div className="max-h-72 overflow-y-auto overscroll-contain">
						{groups.map((g, gi) => (
							<div key={g.classHash} className={gi > 0 ? 'border-t' : ''}>
								<div className="px-3 h-6 flex items-center bg-muted/40">
									<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
										{g.contractName}
									</span>
								</div>
								{g.files.map((f) => {
									const fileSource = classesDebuggerData[g.classHash]?.sourceCode?.[f.filePath];
									const sourceLines = fileSource ? fileSource.split('\n') : undefined;
									const fileName = f.filePath.split('/').pop() || f.filePath;
									return (
										<div key={f.filePath} className="py-1">
											<div
												className="px-3 py-0.5 text-[11px] font-medium text-muted-foreground truncate"
												title={f.filePath}
											>
												{fileName}
											</div>
											{f.lines.map((line) => {
												const lineDisplay = line + 1;
												const lineContent = sourceLines?.[line]?.trim().slice(0, 60) ?? '';
												const isDisabled =
													disabledBreakpoints[g.classHash]?.[f.filePath]?.includes(line) ?? false;
												return (
													<div
														key={`${f.filePath}:${line}`}
														className="group flex items-center gap-2 pl-3 pr-2 h-7 text-xs hover:bg-accent cursor-pointer"
														onClick={() => onLineClick(f.filePath, line, g.contractCall?.callId)}
													>
														<Checkbox
															checked={!isDisabled}
															onCheckedChange={() =>
																toggleBreakpointEnabled(line, f.filePath, g.classHash)
															}
															onClick={(e) => e.stopPropagation()}
															className="border-muted-foreground/50 data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground data-[state=checked]:text-background"
															aria-label={
																isDisabled
																	? `Enable breakpoint at line ${lineDisplay}`
																	: `Disable breakpoint at line ${lineDisplay}`
															}
														/>
														<RedDot size={9} hollow={isDisabled} />
														<span
															className={`font-mono tabular-nums w-7 text-right ${
																isDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground'
															}`}
														>
															{lineDisplay}
														</span>
														<span
															className={`truncate font-mono flex-1 ${
																isDisabled ? 'text-foreground/40' : 'text-foreground/80'
															}`}
														>
															{lineContent}
														</span>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																toggleBreakpoint(line, f.filePath, g.classHash);
															}}
															className="opacity-0 group-hover:opacity-100 hover:bg-background rounded p-0.5 flex-none"
															aria-label={`Remove breakpoint at line ${lineDisplay}`}
														>
															<X className="w-3 h-3" />
														</button>
													</div>
												);
											})}
										</div>
									);
								})}
							</div>
						))}
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
