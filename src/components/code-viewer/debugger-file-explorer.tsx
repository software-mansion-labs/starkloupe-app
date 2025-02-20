import { memo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CommonCallTrace } from '../call-trace/common-call-trace';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable-panel';

export const DebuggerFilesExplorer = memo(function FilesExplorer({
	showTitle = true,
	classSourceCode,
	activeFile,
	handleFileClick,
	className,
	toggleExpand
}: {
	showTitle?: boolean;
	classSourceCode: {
		[key: string]: string;
	};
	activeFile?: string;
	handleFileClick: (filePath: string) => void;
	className?: string;
	toggleExpand?: () => void;
}) {
	const [isCallTraceExpanded, setIsCallTraceExpanded] = useState(false);
	const files = Object.keys(classSourceCode);

	const toggleCallTrace = useCallback(() => {
		setIsCallTraceExpanded((prev) => !prev);
	}, []);

	if (!isCallTraceExpanded) {
		return (
			<div className={cn('w-full h-full flex flex-col', className)}>
				<button
					onClick={() => {
						toggleCallTrace();
						if (toggleExpand) {
							toggleExpand();
						}
					}}
					className="w-full px-2 py-1 flex items-center justify-between h-[32px]  hover:bg-neutral-50"
				>
					<span className="font-medium uppercase">File explorer</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		);
	}

	return (
		<div className={cn('w-full h-full', className)}>
			<div className="h-full w-full flex flex-col">
				<button
					onClick={() => {
						toggleCallTrace();
						if (toggleExpand) {
							toggleExpand();
						}
					}}
					className="w-full px-2 py-1 flex items-center justify-between h-[32px] hover:bg-neutral-50"
				>
					<span className="font-medium uppercase">File Explorer</span>
					<ChevronDown className="w-4 h-4" />
				</button>

				<ScrollArea className="flex-1">
					<div className="min-w-full">
						<div className="flex flex-col">
							{files.map((file) => (
								<div
									key={file}
									className={cn(
										'py-1 px-4 transition-colors',
										activeFile === file ? 'bg-neutral-100' : 'cursor-pointer hover:bg-neutral-50'
									)}
									onClick={() => handleFileClick(file)}
								>
									{file}
								</div>
							))}
						</div>
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
		</div>
	);
});
