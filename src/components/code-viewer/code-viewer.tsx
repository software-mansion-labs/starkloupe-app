// eslint-disable-next-line import/named
import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { editor as Editor } from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js';
import { cn } from '@/lib/utils';
import { registerCairoLanguageSupport } from './cairo-lang-config';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CodeLocation, InternalFnCallIO } from '@/lib/simulation';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import { useTheme } from 'next-themes';

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
	const { resolvedTheme } = useTheme(); // 'light' | 'dark'
	const isDark = resolvedTheme === 'dark';
	const editorRef = useRef<Editor.IStandaloneCodeEditor>();
	const [editorDecorations, setEditorDecorations] =
		useState<Editor.IEditorDecorationsCollection | null>(null);
	const breakpointDecorationsRef = useRef<string[]>([]);
	const monaco = useMonaco();
	const [hoverLine, setHoverLine] = useState<number | null>(null);
	const activeFileRef = useRef<string | undefined>(undefined);
	const classHashRef = useRef<string | undefined>(undefined);
	const breakPointsLinesRef = useRef<number[] | undefined>(undefined);
	const codeLocationRef = useRef<CodeLocation | undefined>(codeLocation);

	const debuggerContext = useDebugger();
	const {
		activeFile,
		contractCall,
		availableBreakpoints = {},
		fileBreakpoints = {},
		disabledBreakpoints = {},
		toggleBreakpoint,
		isExpressionHover,
		scrollTarget,
		setScrollTarget
	} = debuggerContext ?? {};

	const classAvailableBreakpoints = contractCall
		? availableBreakpoints[contractCall.classHash]
		: undefined;
	const classFileBreakpoints = contractCall ? fileBreakpoints[contractCall.classHash] : undefined;
	const classDisabledBreakpoints = contractCall
		? disabledBreakpoints[contractCall.classHash]
		: undefined;
	const classHash = contractCall ? contractCall.classHash : undefined;

	if (!highlightClass) highlightClass = '';

	useEffect(() => {
		activeFileRef.current = activeFile;
	}, [activeFile]);

	useEffect(() => {
		codeLocationRef.current = codeLocation;
	}, [codeLocation]);

	useEffect(() => {
		classHashRef.current = classHash;
	}, [classHash]);

	useEffect(() => {
		if (classAvailableBreakpoints && activeFile && classAvailableBreakpoints[activeFile]) {
			breakPointsLinesRef.current = classAvailableBreakpoints[activeFile].map((bp) => bp + 1);
		}
	}, [activeFile, classAvailableBreakpoints]);

	const getCurrentFileBreakpoints = useCallback((): number[] => {
		if (!activeFileRef.current) return [];

		const fileEntry = classFileBreakpoints && classFileBreakpoints[activeFileRef.current];

		return fileEntry ? fileEntry.map((bp) => bp + 1) : [];
	}, [classFileBreakpoints]);

	const getCurrentDisabledLines = useCallback((): number[] => {
		if (!activeFileRef.current) return [];
		const fileEntry = classDisabledBreakpoints && classDisabledBreakpoints[activeFileRef.current];
		return fileEntry ? fileEntry.map((bp) => bp + 1) : [];
	}, [classDisabledBreakpoints]);

	const highlightCodeLocation = useCallback(
		(
			codeLocation: CodeLocation,
			editor: Editor.IStandaloneCodeEditor,
			_monaco: Monaco,
			smooth: boolean
		) => {
			if (!_monaco || !editor) return;
			const range = new _monaco.Range(
				codeLocation.start.line + 1,
				codeLocation.start.col + 1,
				codeLocation.end.line + 1,
				codeLocation.end.col + 1
			);

			const lineHeight = editor.getOption(_monaco.editor.EditorOption.lineHeight);
			const targetScrollTop = (range.startLineNumber - 1) * lineHeight;
			editor.setScrollTop(targetScrollTop, smooth ? 0 : 1);

			editorDecorations?.clear();
			setTimeout(() => {
				const decorations = [
					{
						range: range,
						options: {
							inlineClassName: highlightClass
						}
					}
				];
				const editorDecorations = editor.createDecorationsCollection(decorations);
				setEditorDecorations(editorDecorations);
			});
		},
		[editorDecorations, highlightClass]
	);

	useEffect(() => {
		if (editorRef.current && content) {
			editorRef.current.setScrollTop(0);
			editorRef.current.setScrollLeft(0);
			editorRef.current.setPosition({ lineNumber: 1, column: 1 });
		}
	}, [content]);

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
			const loc = codeLocationRef.current;
			if (loc && activeFileRef.current && loc.filePath === activeFileRef.current) {
				highlightCodeLocation(loc, editor, monaco, false);
			}
		},
		[hoverLine, toggleBreakpoint, highlightCodeLocation]
	);

	const updateBreakpointDecorations = useCallback(
		(currentHoverLine: number | null) => {
			if (!editorRef.current || !monaco || !activeFileRef.current) return;

			const currentFileBreakpoints = getCurrentFileBreakpoints();
			const currentDisabledLines = getCurrentDisabledLines();
			const decorations = [
				...currentFileBreakpoints.map((line) => {
					const isDisabled = currentDisabledLines.includes(line);
					return {
						range: new monaco.Range(line, 1, line, 1),
						options: {
							isWholeLine: false,
							glyphMarginClassName: isDisabled ? 'breakpoint-disabled' : 'breakpoint-active',
							glyphMarginHoverMessage: {
								value: isDisabled ? 'Disabled breakpoint' : 'Delete breakpoint'
							}
						}
					};
				}),
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
		[monaco, getCurrentFileBreakpoints, getCurrentDisabledLines]
	);

	useEffect(() => {
		updateBreakpointDecorations(hoverLine);
	}, [
		classFileBreakpoints,
		classDisabledBreakpoints,
		hoverLine,
		updateBreakpointDecorations,
		activeFile
	]);

	useEffect(() => {
		if (editorRef.current && monaco) {
			if (codeLocation && activeFile && codeLocation.filePath === activeFile) {
				highlightCodeLocation(codeLocation, editorRef.current, monaco, true);
			} else {
				editorRef.current.revealLineNearTop(0, 1);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [codeLocation, args, results, isExpressionHover]);

	useEffect(() => {
		if (!scrollTarget || !monaco || !editorRef.current) return;
		if (scrollTarget.filePath !== activeFile) return;
		if (!content) return;
		const targetLine = scrollTarget.line + 1;
		const t = setTimeout(() => {
			if (!editorRef.current) return;
			editorRef.current.revealLineInCenter(targetLine, 0);
			editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
			setScrollTarget?.(null);
		}, 50);
		return () => clearTimeout(t);
	}, [scrollTarget, activeFile, content, monaco, setScrollTarget]);

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
				.breakpoint-disabled {
					background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle fill='none' stroke='%23E51400' stroke-width='1.5' cx='8' cy='8' r='3.25'/%3E%3C/svg%3E") center center no-repeat;
					cursor: pointer;
					opacity: 0.7;
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

	return (
		<MonacoEditor
			onMount={handleEditorDidMount}
			theme={isDark ? 'vs-dark' : 'vs-light'}
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
			language="cairo"
			className={cn(
				'whitespace-pre-wrap overflow-x-scroll p-0 m-0 w-full h-full absolute top-0 left-0'
			)}
		/>
	);
}
