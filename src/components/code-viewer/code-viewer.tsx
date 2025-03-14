// eslint-disable-next-line import/named
import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { editor as Editor } from 'monaco-editor';
import { cn } from '@/lib/utils';
import { registerCairoLanguageSupport } from './cairo-lang-config';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CodeLocation, InternalFnCallIO } from '@/lib/simulation';
import { DebuggerContext } from '@/lib/context/debugger-context-provider';

export function CodeViewer({
	content,
	highlightClass,
	args,
	results,
	codeLocation
}: {
	content: string;
	highlightClass?: string;
	args?: InternalFnCallIO[];
	results?: InternalFnCallIO[];
	codeLocation: CodeLocation | undefined;
}) {
	const { activeFile, contractCall, availableBreakpoints, fileBreakpoints, toggleBreakpoint } =
		useContext(DebuggerContext);

	const classAvailableBreakpoints = contractCall
		? availableBreakpoints[contractCall.classHash]
		: undefined;
	const classFileBreakpoints = contractCall ? fileBreakpoints[contractCall.classHash] : undefined;
	const classHash = contractCall ? contractCall.classHash : undefined;

	if (!highlightClass) highlightClass = 'bg-neutral-300 bg-opacity-40';

	const editorRef = useRef<Editor.IStandaloneCodeEditor>();
	const [editorDecorations, setEditorDecorations] =
		useState<Editor.IEditorDecorationsCollection | null>(null);
	const breakpointDecorationsRef = useRef<string[]>([]);
	const monaco = useMonaco();

	const activeFileRef = useRef<string | undefined>(activeFile);
	const classHashRef = useRef<string | undefined>(classHash);

	useEffect(() => {
		activeFileRef.current = activeFile;
	}, [activeFile]);

	useEffect(() => {
		classHashRef.current = classHash;
	}, [classHash]);

	const [hoverLine, setHoverLine] = useState<number | null>(null);

	const breakPointsLinesRef = useRef<number[] | undefined>(
		classAvailableBreakpoints && activeFile && classAvailableBreakpoints[activeFile]
			? classAvailableBreakpoints[activeFile].map((bp) => bp + 1)
			: undefined
	);

	const getCurrentFileBreakpoints = useCallback((): number[] => {
		if (!activeFileRef.current) return [];

		const fileEntry = classFileBreakpoints && classFileBreakpoints[activeFileRef.current];

		return fileEntry ? fileEntry.map((bp) => bp + 1) : [];
	}, [classFileBreakpoints]);

	useEffect(() => {
		if (classAvailableBreakpoints && activeFile && classAvailableBreakpoints[activeFile]) {
			breakPointsLinesRef.current = classAvailableBreakpoints[activeFile].map((bp) => bp + 1);
		}
	}, [activeFile, classAvailableBreakpoints]);

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
						options: {
							inlineClassName: highlightClass
						}
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
						options: {
							inlineClassName: 'io-values'
						}
					});
				}
				const editorDecorations = editor.createDecorationsCollection(decorations);
				setEditorDecorations(editorDecorations);
			});
		},
		[editorDecorations, highlightClass]
	);

	const handleEditorDidMount = useCallback(
		async (editor: Editor.IStandaloneCodeEditor, monaco: Monaco) => {
			editorRef.current = editor;
			registerCairoLanguageSupport(monaco as any);

			editor.onMouseMove((e) => {
				if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
					const lineNumber = e.target.position?.lineNumber;

					if (!lineNumber) return;

					const isBreakpointLine = breakPointsLinesRef.current
						? breakPointsLinesRef.current.some((bp: number) => bp === lineNumber)
						: null;

					if (isBreakpointLine && lineNumber !== hoverLine) {
						setHoverLine(lineNumber);
					} else if (!isBreakpointLine && hoverLine) {
						setHoverLine(null);
					}
				} else if (hoverLine) {
					setHoverLine(null);
				}
			});

			editor.onMouseLeave(() => {
				if (hoverLine) setHoverLine(null);
			});

			editor.onMouseDown((e) => {
				if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
					const lineNumber = e.target.position?.lineNumber;

					if (!lineNumber) return;

					const validBreakpointLine = breakPointsLinesRef.current
						? breakPointsLinesRef.current.some((bp: number) => bp === lineNumber)
						: null;

					if (
						validBreakpointLine &&
						toggleBreakpoint &&
						activeFileRef.current &&
						classHashRef.current
					) {
						toggleBreakpoint(lineNumber - 1, activeFileRef.current, classHashRef.current);
					} else {
						console.log(`Line ${lineNumber} is not a valid breakpoint line`);
					}
				}
			});

			if (codeLocation) {
				highlightCodeLocation(codeLocation, args ?? [], results ?? [], editor, monaco, false);
			}
		},
		[codeLocation, hoverLine, toggleBreakpoint, highlightCodeLocation, args, results]
	);

	const updateBreakpointDecorations = useCallback(
		(currentHoverLine: number | null) => {
			if (!editorRef.current || !monaco || !activeFileRef.current) return;

			const currentFileBreakpoints = getCurrentFileBreakpoints();
			const decorations = [
				...currentFileBreakpoints.map((line) => ({
					range: new monaco.Range(line, 1, line, 1),
					options: {
						isWholeLine: false,
						glyphMarginClassName: 'breakpoint-active',
						glyphMarginHoverMessage: { value: 'Delete breakpoint' }
					}
				})),
				...(currentHoverLine &&
				!currentFileBreakpoints.includes(currentHoverLine) &&
				breakPointsLinesRef.current &&
				breakPointsLinesRef.current.some((bp: number) => bp === currentHoverLine)
					? [
							{
								range: new monaco.Range(currentHoverLine, 1, currentHoverLine, 1),
								options: {
									isWholeLine: false,
									glyphMarginClassName: 'breakpoint-hover',
									glyphMarginHoverMessage: { value: 'Add breakpoint' }
								}
							}
					  ]
					: [])
			];

			breakpointDecorationsRef.current = editorRef.current.deltaDecorations(
				breakpointDecorationsRef.current,
				decorations
			);
		},
		[monaco, getCurrentFileBreakpoints]
	);

	useEffect(() => {
		updateBreakpointDecorations(hoverLine);
	}, [classFileBreakpoints, hoverLine, updateBreakpointDecorations, activeFile]);

	const [prevCodeValue, setPrevCodeValue] = useState<string | null>(null);

	useEffect(() => {
		if (editorRef.current && monaco) {
			if (codeLocation) {
				highlightCodeLocation(
					codeLocation,
					args ?? [],
					results ?? [],
					editorRef.current,
					monaco,
					content === prevCodeValue
				);
			} else {
				editorRef.current.revealLineNearTop(0, 1);
			}
			setPrevCodeValue(content);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [codeLocation, args, results]);

	useEffect(() => {
		const styleId = 'breakpoint-style';
		if (!document.getElementById(styleId)) {
			const style = document.createElement('style');
			style.id = styleId;
			style.innerHTML = `
				.breakpoint-active {
					background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle fill='%23E51400' cx='8' cy='8' r='4'/%3E%3C/svg%3E") center center no-repeat;
					cursor: pointer;
				}
				.breakpoint-hover:hover {
					background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle fill='%23888888' cx='8' cy='8' r='4'/%3E%3C/svg%3E") center center no-repeat;
					cursor: pointer;
					opacity: 0.5;
				}
				.monaco-editor .margin-view-overlays .cgmr {
					cursor: pointer;
				}
			`;
			document.head.appendChild(style);
		}
	}, []);

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
			onMount={handleEditorDidMount}
			options={{
				minimap: { enabled: false },
				wordBreak: 'keepAll',
				readOnly: true,
				glyphMargin: true,
				smoothScrolling: true,
				lineNumbers: 'on',
				lineNumbersMinChars: 3,
				lineDecorationsWidth: 15
			}}
			value={content}
			language={'cairo'}
			className={cn(
				'whitespace-pre-wrap overflow-x-scroll p-0 m-0 w-full h-full absolute top-0 left-0'
			)}
		/>
	);
}
