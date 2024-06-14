import { Editor as MonacoEditor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { cn } from '@/lib/utils';
import { registerCairoLanguageSupport } from './cairoLangConfig';
import { useRef, useState } from 'react';
import { CodeLocation } from '@/lib/simulation';

export function CodeViewer({ code, codeLocation }: { code: string; codeLocation: CodeLocation }) {
	const editorRef = useRef<editor.IStandaloneCodeEditor>();
	const [editorDecorations, setEditorDecorations] =
		useState<editor.IEditorDecorationsCollection | null>(null);

	const handleEditorDidMount = async (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
		editorRef.current = editor;
		registerCairoLanguageSupport(monaco as any);

		const range = new monaco.Range(
			codeLocation.start.line + 1,
			codeLocation.start.col + 1,
			codeLocation.end.line + 1,
			codeLocation.end.col + 1
		);

		editorRef.current.revealRangeInCenter(
			range.plusRange(
				new monaco.Range(
					range.startLineNumber - 2,
					range.startColumn,
					range.endLineNumber,
					range.endColumn
				)
			)
		);

		// add editor decorations
		const editor_decorations = editor.createDecorationsCollection([
			{
				range: range,
				options: { inlineClassName: 'bg-neutral-300 bg-opacity-40' }
			}
		]);
		// update new decorations
		setEditorDecorations(editor_decorations);
	};

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
