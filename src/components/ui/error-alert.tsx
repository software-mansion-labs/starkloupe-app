import { ContractCall, FunctionCall } from '@/lib/simulation';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ContractCallSignature } from './signature';
import { useSettings } from '@/lib/context/settings-context-provider';
import { FnName } from './function-name';
import { CommandDialog } from './command';
import { useMemo, useState } from 'react';
import CopyToClipboardElement from './copy-to-clipboard';
import { ScrollArea, ScrollBar } from './scroll-area';
import { Button } from './button';

const ErrorAlert = ({ callError }: { callError: ContractCall | FunctionCall | undefined }) => {
	const errorDescription = callError?.errorMessage ?? '';
	const [isOpen, setIsOpen] = useState(false);
	const { customSettings, updateContractColor, updateContractName, updateContractSettings } =
		useSettings();

	const MAX_ERROR_LENGTH = 150;
	const isLongError = errorDescription.length > MAX_ERROR_LENGTH;

	const MOBILE_SNIPPET_LEN = 80;
	const mobileSnippet = useMemo(() => {
		if (!errorDescription) return 'Error';
		const clean = errorDescription.replace(/\s+/g, ' ').trim();
		return clean.length > MOBILE_SNIPPET_LEN ? clean.slice(0, MOBILE_SNIPPET_LEN - 1) + '…' : clean;
	}, [errorDescription]);

	const parseErrorDescription = (text: string) => {
		if (!text) return null;
		const addressRegex = /(0x[a-fA-F0-9]{1,64})\b/g;
		const parts: (string | JSX.Element)[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = addressRegex.exec(text)) !== null) {
			if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
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
		if (lastIndex < text.length) parts.push(text.slice(lastIndex));
		return parts.length > 0 ? parts : text;
	};

	const ErrorContent = () => (
		<div className="!font-light">
			<span className="whitespace-pre-wrap">
				<span className={`${!isLongError ? 'text-red-600' : ''}`}>
					{errorDescription && parseErrorDescription(errorDescription)}
				</span>

				{!isLongError && (
					<span className="inline-flex items-center my-1">
						<span className="mx-1"> in </span>
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
				)}
			</span>
		</div>
	);

	const toggleAlert = () => setIsOpen((v) => !v);

	return (
		<>
			<div className="md:hidden">
				<Alert
					variant="compact"
					role="button"
					aria-label="Show error details"
					tabIndex={0}
					onClick={toggleAlert}
					className="my-2 cursor-pointer border-red-600 dark:text-white px-2 py-1.5 h-9 min-h-0 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
				>
					<div className="flex-1 min-w-0 leading-tight items-center">
						<div className="truncate text-xs text-red-600 font-bold items-center text-center flex gap-2 justify-center">
							<ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
							Error. Tap for more information
						</div>
					</div>
				</Alert>

				<CommandDialog open={isOpen} onOpenChange={setIsOpen} shouldFilter={false}>
					<div className="flex items-center justify-between p-3 border-b">
						<div className="flex items-center gap-2">
							<ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
							<h2 className="text-base font-medium text-gray-900 dark:text-white">Error Details</h2>
						</div>
					</div>
					<div className="p-3 space-y-3">
						<div className="w-full">
							<span className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">
								Error occurred in:
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
							<span className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">
								Error message:
							</span>
							<div className="max-h-80 overflow-y-auto w-full border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-800/50 text-sm">
								<ErrorContent />
							</div>
						</div>
					</div>
					<div className="flex justify-end p-3 border-t border-gray-200 dark:border-gray-700">
						<button
							onClick={toggleAlert}
							className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
						>
							Close
						</button>
					</div>
				</CommandDialog>
			</div>

			<div className="hidden md:block">
				{isLongError ? (
					<>
						<div className="cursor-pointer w-full" onClick={toggleAlert}>
							<Alert
								variant="compact"
								className="border-red-600 dark:text-white my-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
							>
								<ExclamationTriangleIcon className="h-5 w-5 mt-1 !text-red-600" />
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
									<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
										Error Details
									</h2>
								</div>
							</div>
							<div className="p-4 space-y-4">
								<div className="w-full">
									<span className="text-sm text-muted-foreground block mb-2">
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
								<Button onClick={toggleAlert} variant="outline">
									Close
								</Button>
							</div>
						</CommandDialog>
					</>
				) : (
					<Alert variant="compact" className="border-red-600 dark:text-white my-2">
						<ExclamationTriangleIcon className="h-5 w-5 !text-red-600" />
						<div>
							<AlertTitle className="!font-light mt-2">Error message:</AlertTitle>
							<AlertDescription>
								<ErrorContent />
							</AlertDescription>
						</div>
					</Alert>
				)}
			</div>
		</>
	);
};

export default ErrorAlert;
