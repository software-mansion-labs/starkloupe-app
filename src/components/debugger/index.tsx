import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import { useContext } from 'react';
import { CodeViewer } from '../code-viewer/code-viewer';
import {
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CallTrace } from '@/lib/simulation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { FilesExplorer } from '../code-viewer/file-explorer';
import { ContractCallSignature } from '../ui/signature';
import Link from 'next/link';

export function Debugger({}: {}) {
	const {
		currentStep,
		classesDebuggerData,
		activeFile,
		setActiveFile,
		nextStep,
		prevStep,
		currentStepIndex,
		totalSteps,
		contractCall,
		codeLocation,
		sourceCode
	} = useContext(DebuggerContext);

	if (!currentStep) return <></>; // unreachable

	const classSourceCode = contractCall
		? classesDebuggerData[contractCall.additionalInfo.classHash]?.sourceCode ?? {}
		: {};

	return (
		<div className="w-full h-[500px] flex flex-row">
			<FilesExplorer
				classSourceCode={sourceCode}
				activeFile={activeFile}
				handleFileClick={setActiveFile}
			/>
			<div className="flex flex-col flex-grow">
				<Controls
					nextStep={nextStep}
					previousStep={prevStep}
					stepIndex={currentStepIndex}
					totalSteps={totalSteps}
					contractCall={contractCall}
				/>
				<div className="flex-grow">
					{currentStep.withCodeLocation ? (
						<CodeViewer
							content={activeFile ? classSourceCode[activeFile] : ''}
							codeLocation={codeLocation}
							highlightClass="bg-yellow-300 bg-opacity-40"
							args={codeLocation ? currentStep.withCodeLocation.arguments : undefined}
							results={codeLocation ? currentStep.withCodeLocation.results : undefined}
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
										href="https://docs.walnut.dev/verify-contract-classes"
									>
										this guide
									</Link>
									.
								</p>
							</AlertDescription>
						</Alert>
					)}
				</div>
			</div>
		</div>
	);
}

function Controls({
	nextStep,
	previousStep,
	stepIndex,
	totalSteps,
	contractCall
}: {
	nextStep: () => void;
	previousStep: () => void;
	stepIndex: number;
	totalSteps: number;
	contractCall?: CallTrace;
}) {
	return (
		<div className="flex flex-row border-b border-neutral-200 py-1 px-3 justify-between items-center">
			<div>{contractCall && <ContractCallSignature contractCall={contractCall} />}</div>
			<div className="flex flex-row gap-3 items-center">
				<div>
					Step {stepIndex + 1}/{totalSteps}
				</div>
				<div className="flex flex-row gap-1">
					<div
						onClick={() => previousStep()}
						className={`w-5 h-5 p-0.5 rounded-sm select-none ${
							stepIndex <= 0
								? 'cursor-not-allowed opacity-60'
								: 'cursor-pointer hover:bg-neutral-100'
						}`}
					>
						<ArrowUturnLeftIcon className="w-4 h-4" />
					</div>
					<div
						onClick={() => nextStep()}
						className={`w-5 h-5 p-0.5 rounded-sm select-none ${
							stepIndex >= totalSteps - 1
								? 'cursor-not-allowed opacity-60'
								: 'cursor-pointer hover:bg-neutral-100'
						}`}
					>
						<ArrowUturnRightIcon className="w-4 h-4" />
					</div>
				</div>
			</div>
		</div>
	);
}
