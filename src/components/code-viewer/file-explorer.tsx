import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function FilesExplorer({
	showTitle = true,
	classSourceCode,
	activeFile,
	handleFileClick,
	className
}: {
	showTitle?: boolean;
	classSourceCode: {
		[key: string]: string;
	};
	activeFile?: string;
	handleFileClick: (filePath: string) => void;
	className?: string;
}) {
	const files = Object.keys(classSourceCode);
	return (
		<div className={cn('w-full flex flex-col', className)}>
			{showTitle && <div className="uppercase px-2 my-2 font-medium">Source files</div>}
			<ScrollArea className="flex-1">
				{files.map((file) => (
					<div
						key={file}
						className={`py-1 px-2 ${
							activeFile === file ? 'bg-neutral-200' : 'cursor-pointer hover:bg-neutral-100'
						}`}
						onClick={() => handleFileClick(file)}
					>
						{file}
					</div>
				))}
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}
