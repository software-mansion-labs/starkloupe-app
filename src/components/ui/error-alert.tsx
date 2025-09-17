import { ContractCall, FunctionCall } from '@/lib/simulation';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ContractCallSignature } from './signature';
import { useSettings } from '@/lib/context/settings-context-provider';
import { FnName } from './function-name';
import { CommandDialog } from './command';
import { useState } from 'react';
import CopyToClipboardElement from './copy-to-clipboard';

const ErrorAlert = ({ callError }: { callError: ContractCall | FunctionCall | undefined }) => {
	const errorDescription = callError?.errorMessage;
	const [isOpen, setIsOpen] = useState(false);
	const { customSettings, updateContractColor, updateContractName, updateContractSettings } =
		useSettings();

	const MAX_ERROR_LENGTH = 150;
	const isLongError = errorDescription && errorDescription.length > MAX_ERROR_LENGTH;

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
		<div className="!font-light">
			<span className="whitespace-pre-wrap">
				{errorDescription && parseErrorDescription(errorDescription)}
				<span className="inline-flex items-center my-1">
					<span> in </span>
					{callError && 'classHash' in callError ? (
						<ContractCallSignature
							contractCall={callError}
							customSettings={customSettings}
							updateContractColor={updateContractColor}
							updateContractName={updateContractName}
							updateContractSettings={updateContractSettings}
						/>
					) : (
						callError?.fnName && <FnName fnName={callError?.fnName} />
					)}
				</span>
			</span>
		</div>
	);

	const toggleAlert = () => {
		setIsOpen(!isOpen);
	};

	if (isLongError) {
		return (
			<>
				<div className="cursor-pointer w-full" onClick={toggleAlert}>
					<Alert
						variant="compact"
						className="border-red-600 dark:text-white my-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
					>
						<ExclamationTriangleIcon className="h-5 w-5 mt-1 !text-red-600" color="red" />
						<div className="flex-1">
							<AlertTitle className="!font-light mt-2 flex items-center justify-between">
								<span>
									Error message: click to see full message.
									<div className="mt-4">
										In{' '}
										{callError && 'classHash' in callError ? (
											<ContractCallSignature
												contractCall={callError}
												customSettings={customSettings}
												updateContractColor={updateContractColor}
												updateContractName={updateContractName}
												updateContractSettings={updateContractSettings}
											/>
										) : (
											callError?.fnName && <FnName fnName={callError?.fnName} />
										)}
									</div>
								</span>
							</AlertTitle>
						</div>
					</Alert>
				</div>
				<CommandDialog open={isOpen} onOpenChange={setIsOpen} shouldFilter={false}>
					<div className="flex items-center justify-between p-4 border-b">
						<div className="flex items-center gap-3">
							<ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white">Error Details</h2>
						</div>
					</div>
					<div className="p-4 space-y-4">
						<div className="w-full">
							<span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
								Error occurred in:{' '}
							</span>
							{callError && 'classHash' in callError ? (
								<ContractCallSignature
									contractCall={callError}
									customSettings={customSettings}
									updateContractColor={updateContractColor}
									updateContractName={updateContractName}
									updateContractSettings={updateContractSettings}
								/>
							) : (
								callError?.fnName && <FnName fnName={callError?.fnName} />
							)}
						</div>

						<div className="w-full">
							<span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
								Error message:
							</span>
							<div className="max-h-96 overflow-y-auto w-full border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800/50">
								<ErrorContent />
							</div>
						</div>
					</div>
					<div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
						<button
							onClick={toggleAlert}
							className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
						>
							Close
						</button>
					</div>
				</CommandDialog>
			</>
		);
	}

	return (
		<Alert variant="compact" className="border-red-600 dark:text-white my-2">
			<ExclamationTriangleIcon className="h-5 w-5 !text-red-600" color="red" />
			<div>
				<AlertTitle className="!font-light mt-2">Error message:</AlertTitle>
				<AlertDescription>
					<ErrorContent />
				</AlertDescription>
			</div>
		</Alert>
	);
};

export default ErrorAlert;
