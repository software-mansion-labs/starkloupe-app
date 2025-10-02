import React, { useState } from 'react';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CommandDialog } from '../ui/command';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import { ContractCall, FunctionCall } from '@/lib/simulation';
import { ContractCallSignature } from '../ui/signature';
import { FnName } from '../ui/function-name';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useSettings } from '@/lib/context/settings-context-provider';
import { Button } from '../ui/button';
export function ErrorTraceLine({
	errorMessage,
	errorCall,
	nestingLevel,
	executionFailed
}: {
	errorMessage: string;
	nestingLevel: number;
	executionFailed: boolean;
	errorCall: ContractCall | FunctionCall;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const MAX_ERROR_LENGTH = 150;
	const isLongError = errorMessage && errorMessage.length > MAX_ERROR_LENGTH;
	const { customSettings, updateContractColor, updateContractName, updateContractSettings } =
		useSettings();

	const parseErrorDescription = (text: string) => {
		if (!text) return null;

		const addressRegex = /(0x[a-fA-F0-9]{1,64})\b/g;

		const parts = [];
		let lastIndex = 0;
		let match;

		while ((match = addressRegex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push(text.slice(lastIndex, match.index));
			}

			const originalAddress = match[1];

			parts.push(
				<CopyToClipboardElement
					key={`${originalAddress}-${match.index}`}
					value={originalAddress}
					className="cursor-pointer !text-red-600 p-0"
					toastDescription="Address has been copied."
				>
					{originalAddress}
				</CopyToClipboardElement>
			);

			lastIndex = match.index + match[0].length;
		}

		if (lastIndex < text.length) {
			parts.push(text.slice(lastIndex));
		}

		return parts.length > 0 ? parts : text;
	};

	const ErrorContent = () => (
		<span className="!font-light">
			<span className="whitespace-pre-wrap">
				{errorMessage && parseErrorDescription(errorMessage)}
			</span>
		</span>
	);

	const toggleDialog = () => {
		setIsOpen(!isOpen);
	};

	return (
		<React.Fragment>
			<TraceLine
				className={
					isLongError
						? 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors'
						: ''
				}
				isUnclickable={!isLongError}
				onClick={isLongError ? toggleDialog : undefined}
			>
				{CallTypeChip('Error')}
				{executionFailed && <div className="w-5 mr-0.5"></div>}

				{/* Debug button */}
				<div className="w-5"></div>

				<div
					style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
					className="flex flex-row items-center"
				>
					<div className={`w-5 h-5 p-1 mr-1`}></div>
					{isLongError ? (
						<span className="text-red-600">
							Error message: {errorMessage.slice(0, 10)}...{errorMessage.slice(-10)}
						</span>
					) : (
						<span className="text-red-600">
							Error message:{' '}
							<span>
								<ErrorContent />
							</span>
						</span>
					)}
				</div>
			</TraceLine>

			{isLongError && (
				<CommandDialog open={isOpen} onOpenChange={setIsOpen} shouldFilter={false}>
					<div className="flex items-center justify-between p-4 border-b">
						<div className="flex items-center gap-3">
							<ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
							<h2 className="text-lg font-semibold ">Error Details</h2>
						</div>
					</div>
					<div className="p-4 space-y-4">
						<div className="w-full">
							<span className="text-sm text-muted-foreground block mb-2">Error occurred in: </span>
							{errorCall && 'classHash' in errorCall ? (
								<ContractCallSignature
									contractCall={errorCall}
									customSettings={customSettings}
									updateContractColor={updateContractColor}
									updateContractName={updateContractName}
									updateContractSettings={updateContractSettings}
								/>
							) : (
								errorCall?.fnName && <FnName fnName={errorCall?.fnName} />
							)}
						</div>
						<div className="w-full">
							<span className="text-sm text-muted-foreground block mb-2">Error message:</span>
							<ScrollArea className="h-96 overflow-auto w-full border border-border rounded-md bg-card">
								<div className="m-4">
									<ErrorContent />
								</div>
								<ScrollBar orientation="horizontal" />
							</ScrollArea>
						</div>
					</div>
					<div className="flex justify-end gap-2 p-4 border-t border-border">
						<Button onClick={toggleDialog} variant="outline">
							Close
						</Button>
					</div>
				</CommandDialog>
			)}
		</React.Fragment>
	);
}
