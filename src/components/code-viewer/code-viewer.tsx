import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { editor as Editor } from 'monaco-editor';
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

	const editorRef = useRef<Editor.IStandaloneCodeEditor>();
	const [editorDecorations, setEditorDecorations] =
		useState<Editor.IEditorDecorationsCollection | null>(null);
	const monaco = useMonaco();

	const handleEditorDidMount = async (editor: Editor.IStandaloneCodeEditor, monaco: Monaco) => {
		editorRef.current = editor;
		registerCairoLanguageSupport(monaco as any);
		highlightCodeLocation(codeLocation, args ?? [], results ?? [], editor, monaco, false);
	};

	const highlightCodeLocation = useCallback(
		(
			codeLocation: CodeLocation,
			args: InternalFnCallIO[],
			results: InternalFnCallIO[],
			editor: Editor.IStandaloneCodeEditor,
			_monaco: Monaco,
			isSmoothScroll: boolean
		) => {
			if (!_monaco || !editor) return;
			const range = new _monaco.Range(
				codeLocation.start.line + 1,
				codeLocation.start.col + 1,
				codeLocation.end.line + 1,
				codeLocation.end.col + 1
			);

			const isHighlightOnScreen = isRangeVisible(range.startLineNumber, range.endLineNumber);

			if (!isHighlightOnScreen) {
				editor.revealRangeInCenter(
					range.plusRange(
						new _monaco.Range(
							range.startLineNumber - 2,
							range.startColumn,
							range.endLineNumber,
							range.endColumn
						)
					),
					isSmoothScroll ? 0 : 1
				);
			}

			editorDecorations?.clear();

			const ioToSkip = ['RangeCheck', 'GasBuiltin', 'System'];

			const filteredArgs = args.filter(
				(arg) =>
					arg.typeName &&
					!ioToSkip.includes(arg.typeName) &&
					!arg.typeName.includes('ContractState')
			);
			const filteredResults = results.filter(
				(result) =>
					result.typeName &&
					!ioToSkip.includes(result.typeName) &&
					!result.typeName.includes('ContractState')
			);

			const isDisplayIoValues = filteredArgs.length > 0 || filteredResults.length > 0;

			let ioValuesText = '';

			if (filteredArgs.length > 0) {
				ioValuesText += 'arguments: ';
				filteredArgs.forEach((io, i) => {
					if (io.value.length === 0) return;
					if (i !== 0) ioValuesText += ', ';
					ioValuesText += io.value.length === 1 ? io.value[0] : io.value.join(', ');
				});
			}
			if (filteredResults.length > 0) {
				if (filteredArgs.length > 0) ioValuesText += ' | ';
				ioValuesText += 'results: ';
				filteredResults.forEach((io, i) => {
					if (io.value.length === 0) return;
					if (i !== 0) ioValuesText += ', ';
					let value = io.value;
					if (io.typeName?.includes('PanicResult')) value = value.slice(2);
					ioValuesText += value.length === 1 ? value[0] : value.join(', ');
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

	const [prevCodeValue, setPrevCodeValue] = useState<string | null>(null);

	useEffect(() => {
		if (editorRef.current && monaco) {
			highlightCodeLocation(
				codeLocation,
				args ?? [],
				results ?? [],
				editorRef.current,
				monaco,
				code === prevCodeValue
			);
			setPrevCodeValue(code);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [codeLocation, args, results]);

	const isRangeVisible = (startLine: number, endLine: number) => {
		const editor = editorRef.current;
		if (editor) {
			const visibleRanges = editor.getVisibleRanges();
			return visibleRanges.some(
				(visibleRange) =>
					visibleRange.startLineNumber <= endLine && visibleRange.endLineNumber >= startLine
			);
		}
		return false;
	};

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
				color: #ab008a;
				font-weight: 300;
				border-radius: 2px;
				padding: 0 4px;
				border: 1px dashed #ab008a;
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
				readOnly: true,
				smoothScrolling: true
			}}
			value={code}
			language={'cairo'}
			className={cn(
				'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
			)}
		/>
	);
}
