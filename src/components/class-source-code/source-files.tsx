import { useState } from 'react';
import { CodeLocation } from '@/lib/simulation';
import { FilesExplorer } from '../code-viewer/file-explorer';
import { CodeViewer } from '../code-viewer/code-viewer';
import { Loader } from '@/components/ui/loader';

export function SourceFiles({ sourceCode }: { sourceCode: { [key: string]: string } | undefined }) {
	const [activeFile, setActiveFile] = useState<string | undefined>('Scarb.toml');

	const initialCodeLocation: CodeLocation = {
		start: { line: 0, col: 0 },
		end: { line: 0, col: 0 },
		filePath: activeFile ? activeFile : ''
	};

	const handleFileClick = (file: string) => {
		setActiveFile(file);
	};

	return (
		<div className="flex text-xs">
			{sourceCode ? (
				<div className="w-full h-[500px] flex">
					<FilesExplorer
						className="border-r w-1/3"
						showTitle={false}
						classSourceCode={sourceCode}
						activeFile={activeFile}
						handleFileClick={handleFileClick}
					/>
					{activeFile && (
						<CodeViewer content={sourceCode[activeFile]} codeLocation={initialCodeLocation} />
					)}
				</div>
			) : (
				<div className="flex items-center justify-center w-full h-full">
					<Loader />
				</div>
			)}
		</div>
	);
}
