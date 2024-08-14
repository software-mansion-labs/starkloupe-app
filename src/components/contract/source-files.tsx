import { useState } from 'react';
import { CodeLocation } from '@/lib/simulation';
import { FilesExplorer } from '../code-viewer/file-explorer';
import { CodeViewer } from '../code-viewer/code-viewer';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function SourceFiles({
	isClassVerified,
	sourceCode
}: {
	isClassVerified: boolean;
	sourceCode: { [key: string]: string } | undefined;
}) {
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
			{isClassVerified ? (
				sourceCode ? (
					<div className="w-full h-[500px] flex flex-row ">
						<FilesExplorer
							showTitle={false}
							classSourceCode={sourceCode}
							activeFile={activeFile}
							handleFileClick={handleFileClick}
						/>
						<div className="flex flex-col flex-grow">
							{activeFile && (
								<CodeViewer code={sourceCode[activeFile]} codeLocation={initialCodeLocation} />
							)}
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center w-full h-full">
						<Loader />
					</div>
				)
			) : (
				<Alert className="mx-4 w-fit">
					<ExclamationTriangleIcon className="h-5 w-5" />
					<AlertTitle>No source code for this contract</AlertTitle>
					<AlertDescription>
						<p>
							<span>Follow </span>
							<a
								href={'https://foundry-rs.github.io/starknet-foundry/starknet/verify.html'}
								className="text-blue-500 cursor-pointer"
								target="_blank"
								rel="noopener noreferrer"
							>
								this guide
							</a>
							<span> to verify the source code.</span>
						</p>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
