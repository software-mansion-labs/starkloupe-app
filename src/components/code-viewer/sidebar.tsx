import { useEffect, useRef, useState } from 'react';
import { ResizablePanelGroup, ResizableHandle, ResizablePanel } from '../ui/resizable-panel';
import { StepDetails } from '../debugger/step-details';
import { ExpressionDetails } from '../debugger/expression-details';
import CallTracePreview from './call-trace-preview';
import { useDebugger } from '@/lib/context/debugger-context-provider';
import { DebuggerFilesExplorer } from './debugger-file-explorer';
import { ContractCall } from '@/lib/simulation';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';

interface PanelHandle {
	collapse: () => void;
	expand: () => void;
	getId: () => string;
	getSize: () => number;
	isCollapsed: () => boolean;
	isExpanded: () => boolean;
	resize: (size: number) => void;
}
export default function Sidebar({
	handleFileClick
}: {
	handleFileClick: (filePath: string) => void;
}) {
	const debuggerContext = useDebugger();
	const { contractCallsMap } = useCallTrace();
	const inspectorFilePanelRef = useRef<PanelHandle>(null);
	const inspectorCallTracePanelRef = useRef<PanelHandle>(null);
	const inspectorStepDetailsPanelRef = useRef<PanelHandle>(null);
	const inspectorExpressionPanelRef = useRef<PanelHandle>(null);
	const [isFilesExpanded, setFilesExpanded] = useState(false);
	const [isCallTraceExpanded, setCallTraceExpanded] = useState(true);
	const [isStepDetailsExpanded, setStepDetailsExpanded] = useState(true);
	const [isExpressionExpanded, setExpressionExpanded] = useState(true);

	useEffect(() => {
		if (!debuggerContext) return;

		const expandedPanels = [isFilesExpanded, isCallTraceExpanded, isStepDetailsExpanded, isExpressionExpanded].filter(
			Boolean
		).length;

		let sizes = [5, 5, 45, 45];
		if (expandedPanels === 0) sizes = [5, 5, 5, 85];
		else if (expandedPanels === 1) {
			sizes = [
				isStepDetailsExpanded ? 85 : 5,
				isExpressionExpanded ? 85 : 5,
				isCallTraceExpanded ? 85 : 5,
				isFilesExpanded ? 85 : 5
			];
		} else if (expandedPanels === 2) {
			const expandedSize = 45;
			sizes = [
				isStepDetailsExpanded ? expandedSize : 5,
				isExpressionExpanded ? expandedSize : 5,
				isCallTraceExpanded ? expandedSize : 5,
				isFilesExpanded ? expandedSize : 5
			];
		} else if (expandedPanels === 3) {
			const expandedSize = 30;
			sizes = [
				isStepDetailsExpanded ? expandedSize : 5,
				isExpressionExpanded ? expandedSize : 5,
				isCallTraceExpanded ? expandedSize : 5,
				isFilesExpanded ? expandedSize : 5
			];
		} else {
			sizes = [25, 25, 25, 25];
		}

		inspectorStepDetailsPanelRef.current?.resize(sizes[0]);
		inspectorExpressionPanelRef.current?.resize(sizes[1]);
		inspectorCallTracePanelRef.current?.resize(sizes[2]);
		inspectorFilePanelRef.current?.resize(sizes[3]);
	}, [isFilesExpanded, isCallTraceExpanded, isStepDetailsExpanded, isExpressionExpanded, debuggerContext]);

	if (!debuggerContext) {
		return null;
	}

	const {
		currentStep,
		activeFile,
		sourceCode,
		currentStepIndex,
		functionCallsMap,
		classesDebuggerData,
		loading
	} = debuggerContext;

	const toggleExpand = (setState: React.Dispatch<React.SetStateAction<boolean>>) => {
		setState((prev: boolean) => !prev);
	};

	const stepWithLocation = currentStep?.withLocation;
	const contractCallDetails = stepWithLocation?.contractCallId
		? contractCallsMap[stepWithLocation?.contractCallId]
		: undefined;

	return (
		<ResizablePanelGroup direction="vertical" className="h-full w-full">
			<ResizablePanel
				ref={inspectorStepDetailsPanelRef}
				defaultSize={30}
				minSize={5}
				collapsedSize={5}
				className="min-h-[32px]"
				maxSize={isStepDetailsExpanded ? 90 : 5}
			>
				<StepDetails
					step={currentStep}
					loading={loading}
					functionCallsMap={functionCallsMap}
					toggleExpand={() => toggleExpand(setStepDetailsExpanded)}
				/>
			</ResizablePanel>
			<ResizableHandle
				disabled={!(isExpressionExpanded && isStepDetailsExpanded)}
				className="w-[1px]"
			/>

			<ResizablePanel
				ref={inspectorExpressionPanelRef}
				defaultSize={30}
				minSize={5}
				collapsedSize={5}
				className="min-h-[32px]"
				maxSize={isExpressionExpanded ? 90 : 5}
			>
				<ExpressionDetails
					loading={loading}
					toggleExpand={() => toggleExpand(setExpressionExpanded)}
					contractCallDetails={contractCallDetails}
				/>
			</ResizablePanel>
			<ResizableHandle
				disabled={!(isCallTraceExpanded && isExpressionExpanded)}
				className="w-[1px]"
			/>

			<ResizablePanel
				ref={inspectorCallTracePanelRef}
				defaultSize={30}
				minSize={5}
				collapsedSize={5}
				className="min-h-[32px]"
				maxSize={isCallTraceExpanded ? 90 : 5}
			>
				<CallTracePreview toggleExpand={() => toggleExpand(setCallTraceExpanded)} />
			</ResizablePanel>
			<ResizableHandle
				disabled={!(isFilesExpanded && (isCallTraceExpanded || isExpressionExpanded || isStepDetailsExpanded))}
			/>
			<ResizablePanel
				className="min-h-[32px]"
				ref={inspectorFilePanelRef}
				defaultSize={5}
				minSize={5}
				collapsedSize={5}
			>
				<DebuggerFilesExplorer
					loading={loading}
					currentStepIndex={currentStepIndex}
					className="flex h-full"
					classesDebuggerData={classesDebuggerData}
					classSourceCode={sourceCode}
					activeFile={activeFile}
					handleFileClick={handleFileClick}
					toggleExpand={() => toggleExpand(setFilesExpanded)}
				/>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
