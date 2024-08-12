export function FilesExplorer({
	classSourceCode,
	activeFile,
	handleFileClick
}: {
	classSourceCode: {
		[key: string]: string;
	};
	activeFile?: string;
	handleFileClick: Function;
}) {
	const files = Object.keys(classSourceCode);
	return (
		<div className="w-[200px] border-r border-neutral-200">
			<div className="uppercase py-2 px-4 h-7">Source files</div>
			<div className="flex flex-col mt-4 max-h-[400px] overflow-y-auto">
				{files.map((file) => (
					<div
						key={file}
						className={`py-1 px-4 ${
							activeFile === file ? 'bg-neutral-200' : 'cursor-pointer hover:bg-neutral-100'
						}`}
						onClick={() => handleFileClick(file)}
					>
						{file}
					</div>
				))}
			</div>
		</div>
	);
}
