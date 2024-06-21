import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { cn } from '@/lib/utils';
import { registerCairoLanguageSupport } from './cairoLangConfig';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CodeLocation } from '@/lib/simulation';

export function CodeViewer({
	code,
	codeLocation,
	highlightClass
}: {
	code: string;
	codeLocation: CodeLocation;
	highlightClass?: string;
}) {
	if (!highlightClass) highlightClass = 'bg-neutral-300 bg-opacity-40';

	const editorRef = useRef<editor.IStandaloneCodeEditor>();
	const [editorDecorations, setEditorDecorations] =
		useState<editor.IEditorDecorationsCollection | null>(null);
	const monaco = useMonaco();

	const handleEditorDidMount = async (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
		editorRef.current = editor;
		registerCairoLanguageSupport(monaco as any);
		highlightCodeLocation(codeLocation, editor, monaco);
	};

	const highlightCodeLocation = useCallback(
		(codeLocation: CodeLocation, editor: editor.IStandaloneCodeEditor, _monaco: Monaco) => {
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

			const editor_decorations = editor.createDecorationsCollection([
				{
					range: range,
					options: { inlineClassName: highlightClass }
				}
			]);

			setEditorDecorations(editor_decorations);
		},
		[editorDecorations, highlightClass]
	);

	useEffect(() => {
		if (editorRef.current && monaco) {
			highlightCodeLocation(codeLocation, editorRef.current, monaco);
		}
	}, [codeLocation]);

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
