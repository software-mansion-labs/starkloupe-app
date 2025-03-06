import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup
} from '@/components/ui/resizable-panel';
import { useContext, useEffect, useState, memo } from 'react';
import { CodeViewer } from '../code-viewer/code-viewer';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ContractCallSignature } from '../ui/signature';
import { ContractCall } from '@/lib/simulation';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import Sidebar from '../code-viewer/sidebar';

export const Debugger = memo(function Debugger({}: {}) {
	const {
		currentStep,
		classesDebuggerData,
		activeFile,
		setActiveFile,
		nextStep,
		prevStep,
		stepOver,
		currentStepIndex,
		totalSteps,
		contractCall,
		codeLocation,
		sourceCode
	} = useContext(DebuggerContext);

	if (!currentStep) return <></>; // unreachable

	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="w-full h-[calc(100vh-400px)] min-h-[500px] flex flex-row"
		>
			<ResizablePanel
				defaultSize={30}
				minSize={20}
				className="flex flex-col justify-between gap-4 border-neutral-200"
			>
				<Sidebar handleFileClick={setActiveFile} />
			</ResizablePanel>
			<ResizableHandle withHandle className="w-[1px]" />
			<ResizablePanel defaultSize={70} minSize={20} className="flex flex-col flex-grow">
				<Controls
					nextStep={nextStep}
					previousStep={prevStep}
					stepIndex={currentStepIndex}
					totalSteps={totalSteps}
					contractCall={contractCall}
					stepOver={stepOver}
				/>
				<div className="flex-grow">
					{currentStep.withLocation ? (
						<CodeViewer
							content={activeFile ? sourceCode[activeFile] : ''}
							codeLocation={codeLocation}
							highlightClass="bg-yellow-300 bg-opacity-40"
							args={codeLocation ? currentStep.withLocation.arguments : undefined}
							results={codeLocation ? currentStep.withLocation.results : undefined}
						/>
					) : (
						<Alert className="m-4 w-fit">
							<ExclamationTriangleIcon className="h-5 w-5" />
							<AlertTitle>No Source Code Available</AlertTitle>
							<AlertDescription>
								<p className="mt-2 mb-1">
									Contract Address:{' '}
									<span className="font-mono">{contractCall?.entryPoint.storageAddress}</span>
								</p>
								<p>
									The source code for this contract is missing. To enable the step-by-step debugger,
									verify the contract on Walnut by following{' '}
									<Link
										className="underline-offset-4 hover:underline text-pink-500"
										href={'https://docs.walnut.dev/verify-starknet-contracts-in-walnut'}
									>
										this guide
									</Link>
									.
								</p>
							</AlertDescription>
						</Alert>
					)}
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
});

function Controls({
	nextStep,
	previousStep,
	stepOver,
	stepIndex,
	totalSteps,
	contractCall
}: {
	nextStep: () => void;
	previousStep: () => void;
	stepOver: () => void;
	stepIndex: number;
	totalSteps: number;
	contractCall?: ContractCall;
}) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return;
			}
			if (event.key.toLowerCase() === 'b') {
				previousStep();
			} else if (event.key.toLowerCase() === 'n') {
				nextStep();
			} else if (event.key.toLowerCase() === 'o') {
				stepOver();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [previousStep, nextStep, stepOver]);

	return (
		<div className="flex flex-row border-b border-neutral-200 py-1 px-3 justify-between items-center">
			<div>{contractCall && <ContractCallSignature contractCall={contractCall} />}</div>
			<div className="flex flex-row gap-3 items-center">
				<div>
					Step {stepIndex + 1}/{totalSteps}
				</div>
				<TooltipProvider>
					<div className="flex flex-row gap-1">
						<Tooltip delayDuration={100}>
							<TooltipTrigger>
								<div
									onClick={() => previousStep()}
									className={`w-5 h-5 p-0.5 rounded-sm select-none ${
										stepIndex <= 0
											? 'cursor-not-allowed opacity-60'
											: 'cursor-pointer hover:bg-neutral-100'
									}`}
								>
									<div className="icon">
										<i className="codicon codicon-debug-step-out w-4 h-4 text-blue-500"></i>
									</div>
								</div>
							</TooltipTrigger>
							<TooltipContent>Step back (b)</TooltipContent>
						</Tooltip>
						<Tooltip delayDuration={100}>
							<TooltipTrigger>
								<div
									onClick={() => nextStep()}
									className={`w-5 h-5 p-0.5 rounded-sm select-none ${
										stepIndex >= totalSteps - 1
											? 'cursor-not-allowed opacity-60'
											: 'cursor-pointer hover:bg-neutral-100'
									}`}
								>
									<div className="icon">
										<i className="codicon codicon-debug-step-into w-4 h-4 text-blue-500"></i>
									</div>
								</div>
							</TooltipTrigger>
							<TooltipContent>Step (n)</TooltipContent>
						</Tooltip>
						<Tooltip delayDuration={100}>
							<TooltipTrigger>
								{' '}
								<div
									onClick={() => stepOver()}
									className={`w-5 h-5 p-0.5 rounded-sm select-none ${
										stepIndex >= totalSteps - 1
											? 'cursor-not-allowed opacity-60'
											: 'cursor-pointer hover:bg-neutral-100'
									}`}
								>
									<div className="icon">
										<i className="codicon codicon-debug-step-over w-4 h-4 text-blue-500"></i>
									</div>
								</div>
							</TooltipTrigger>
							<TooltipContent>Step over (o)</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
			</div>
		</div>
	);
}
