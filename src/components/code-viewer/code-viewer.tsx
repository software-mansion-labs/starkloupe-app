import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { cn } from '@/lib/utils';
import { registerCairoLanguageSupport } from './cairoLangConfig';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CodeLocation, InternalFnCallIO } from '@/lib/simulation';

export function CodeViewer({
	code,
	codeLocation,
	highlightClass,
	args,
	results
}: {
	code: string;
	codeLocation: CodeLocation;
	highlightClass?: string;
	args?: InternalFnCallIO[];
	results?: InternalFnCallIO[];
}) {
	if (!highlightClass) highlightClass = 'bg-neutral-300 bg-opacity-40';

	const editorRef = useRef<editor.IStandaloneCodeEditor>();
	const [editorDecorations, setEditorDecorations] =
		useState<editor.IEditorDecorationsCollection | null>(null);
	const monaco = useMonaco();

	const handleEditorDidMount = async (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
		editorRef.current = editor;
		registerCairoLanguageSupport(monaco as any);
		highlightCodeLocation(codeLocation, args ?? [], results ?? [], editor, monaco);
	};

	const highlightCodeLocation = useCallback(
		(
			codeLocation: CodeLocation,
			args: InternalFnCallIO[],
			results: InternalFnCallIO[],
			editor: editor.IStandaloneCodeEditor,
			_monaco: Monaco
		) => {
			if (!_monaco || !editor) return;
			const range = new _monaco.Range(
				codeLocation.start.line + 1,
				codeLocation.start.col + 1,
				codeLocation.end.line + 1,
				codeLocation.end.col + 1
			);

			editor.revealRangeInCenter(
				range.plusRange(
					new _monaco.Range(
						range.startLineNumber - 2,
						range.startColumn,
						range.endLineNumber,
						range.endColumn
					)
				)
			);

			editorDecorations?.clear();

			const ioToSkip = ['RangeCheck', 'GasBuiltin'];

			const filteredArgs = args.filter((arg) => arg.typeName && !ioToSkip.includes(arg.typeName));
			const filteredResults = results.filter(
				(result) => result.typeName && !ioToSkip.includes(result.typeName)
			);

			const isDisplayIoValues = filteredArgs.length > 0 || filteredResults.length > 0;

			let ioValuesText = '';

			if (filteredArgs.length > 0) {
				ioValuesText += 'arguments: ';
				filteredArgs.forEach((io, i) => {
					if (i !== 0) ioValuesText += ', ';
					ioValuesText += io.value.length === 1 ? io.value[0] : io.value.join(', ');
				});
			}
			if (filteredResults.length > 0) {
				if (filteredArgs.length > 0) ioValuesText += ' | ';
				ioValuesText += 'results: ';
				filteredResults.forEach((io, i) => {
					if (i !== 0) ioValuesText += ', ';
					ioValuesText += io.value.length === 1 ? io.value[0] : io.value.join(', ');
				});
			}

			if (isDisplayIoValues) setIoValuesText(ioValuesText);

			setTimeout(() => {
				const decorations = [
					{
						range: range,
						options: { inlineClassName: highlightClass }
					}
				];
				if (isDisplayIoValues) {
					decorations.push({
						range: new _monaco.Range(
							codeLocation.end.line + 1,
							codeLocation.end.col + 1,
							codeLocation.end.line + 1,
							codeLocation.end.col + 2
						),
						options: { inlineClassName: 'io-values' }
					});
				}
				const editorDecorations = editor.createDecorationsCollection(decorations);

				setEditorDecorations(editorDecorations);
			});
		},
		[editorDecorations, highlightClass]
	);

	useEffect(() => {
		if (editorRef.current && monaco) {
			highlightCodeLocation(codeLocation, args ?? [], results ?? [], editorRef.current, monaco);
		}
	}, [codeLocation, args, results]);

	function setIoValuesText(text: string) {
		const styleTagId = 'io-values-content-style';
		let styleTag = document.getElementById(styleTagId);

		if (!styleTag) {
			styleTag = document.createElement('style');
			styleTag.id = styleTagId;
			document.head.appendChild(styleTag);
		}

		styleTag.innerHTML = `
			.io-values::after {
				content: '${text}';
				color: rgb(70, 70, 70);
				font-weight: 300;
				background: rgb(240,240,240);
				border-radius: 2px;
				padding: 0 4px;
			}
    	`;
	}

	return (
		<MonacoEditor
			// @ts-ignore: SCEditor is not TS-friendly
			onMount={handleEditorDidMount}
			options={{
				minimap: { enabled: false },
				wordBreak: 'keepAll',
				wordWrap: 'on',
				readOnly: true
			}}
			value={code}
			language={'cairo'}
			className={cn(
				'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
			)}
		/>
	);
}
