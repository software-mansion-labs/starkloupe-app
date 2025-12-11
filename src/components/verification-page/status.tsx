import { useEffect, useState, useCallback } from 'react';
import { fetchVerificationStatus } from '@/lib/verification';
import { InfoBox } from '../ui/info-box';
import {
	VerificationRequestRow,
	VerificationStatus,
	VerificationStatusRow
} from '@/lib/verification/types';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Error } from '../ui/error';
import { Loader } from '../ui/loader';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import { NetworkBadge } from '../ui/network-badge';
import { useSettings } from '@/lib/context/settings-context-provider';
import { shortenHash } from '@/lib/utils';
import AddressLink from '../address-link';

export function VerificationStatusPage({ verificationId }: { verificationId: string }) {
	const [verificationRows, setVerificationRows] = useState<VerificationStatusRow[]>([]);
	const [verificationRequest, setVerificationRequest] = useState<VerificationRequestRow | null>(
		null
	);
	const { parseChain } = useSettings();
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchStatus = useCallback(async () => {
		const response = await fetchVerificationStatus(verificationId);
		if (response.isError) {
			if (response.response.errorMessage) {
				setError(response.response.errorMessage);
			} else {
				setError('Error fetching verification status');
			}
			setIsLoading(false);
			return;
		}
		setVerificationRows(response.response.verificationStatuses);
		setVerificationRequest(response.response.verificationRequest ?? null);
		setIsPending(
			response.response.verificationRequest?.status === 'pending' ||
				response.response.verificationStatuses.some(
					(row) => row.status === VerificationStatus.pending
				)
		);
		setError(null);
		setIsLoading(false);
	}, [verificationId]);

	useEffect(() => {
		fetchStatus();
		const interval = setInterval(() => {
			if (isPending) {
				fetchStatus();
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [fetchStatus, isPending]);

	const formatOutput = (output: string): string => {
		try {
			const parsed = JSON.parse(output);
			// If the parsed result is still a string, it means the JSON might be double-encoded.
			if (typeof parsed === 'string') {
				try {
					const doubleParsed = JSON.parse(parsed);
					return JSON.stringify(doubleParsed, null, 2);
				} catch {
					// If second parse fails, fallback to unescaping newline sequences.
					return parsed.replace(/\\n/g, '\n');
				}
			}
			return JSON.stringify(parsed, null, 2);
		} catch (err) {
			// If initial parsing fails, simply replace literal "\n" escapes with line breaks.
			return output.replace(/\\n/g, '\n');
		}
	};

	const network = verificationRows[0]?.network ? parseChain(verificationRows[0].network) : null;

	return (
		<>
			<HeaderNav />
			<main className="h-full flex flex-col overflow-hidden short:overflow-scroll">
				<Container className="py-4 sm:py-6 lg:py-8 h-full flex flex-col short:min-h-[600px]">
					{isLoading ? (
						<>
							<div className="xl:flex flex-row items-baseline justify-between">
								<div className="flex flex-col gap-2 mt-4 mb-2 mr-2">
									<h1 className="text-base font-medium leading-6">
										<div className="flex flex-wrap items-center gap-1">
											<span>Verification</span>
											<CopyToClipboardElement
												value={verificationId}
												toastDescription="The ID has been copied."
												className="hidden lg:block p-0 mr-2 hover:bg-inherit"
											>
												<AddressLink address={verificationId}>{verificationId}</AddressLink>
											</CopyToClipboardElement>
											<CopyToClipboardElement
												value={verificationId}
												toastDescription="The ID has been copied."
												className="lg:hidden p-0 mr-2 hover:bg-inherit"
											>
												<AddressLink address={verificationId}>
													{shortenHash(verificationId)}
												</AddressLink>
											</CopyToClipboardElement>
											<div className="hidden md:block">
												{network && <NetworkBadge network={network} />}
											</div>
										</div>
									</h1>
								</div>
							</div>

							<div className="flex md:hidden gap-2 justify-between mb-4">
								{network && <NetworkBadge network={network} />}
							</div>
							<Loader randomQuote={false} />
						</>
					) : error ? (
						<>
							<div className="xl:flex flex-row items-baseline justify-between">
								<div className="flex flex-col gap-2 mt-4 mb-2 mr-2">
									<h1 className="text-base font-medium leading-6">
										<div className="flex flex-wrap items-center gap-1">
											<span>Verification</span>
											<CopyToClipboardElement
												value={verificationId}
												toastDescription="The ID has been copied."
												className="hidden lg:block p-0 mr-2 hover:bg-inherit"
											>
												<AddressLink address={verificationId}>{verificationId}</AddressLink>
											</CopyToClipboardElement>
											<CopyToClipboardElement
												value={verificationId}
												toastDescription="The ID has been copied."
												className="lg:hidden p-0 mr-2 hover:bg-inherit"
											>
												<AddressLink address={verificationId}>
													{shortenHash(verificationId)}
												</AddressLink>
											</CopyToClipboardElement>
										</div>
									</h1>
								</div>
							</div>
							<Error message={error} />
						</>
					) : (
						<>
							<div className="xl:flex flex-row items-baseline justify-between">
								<div className="flex flex-col gap-2 mt-4 mb-2 mr-2">
									<h1 className="text-base font-medium leading-6">
										<div className="flex flex-wrap items-center gap-1">
											<span>Verification</span>
											<CopyToClipboardElement
												value={verificationId}
												toastDescription="The ID has been copied."
												className="hidden lg:block p-0 mr-2 hover:bg-inherit"
											>
												<AddressLink address={verificationId}>{verificationId}</AddressLink>
											</CopyToClipboardElement>
											<CopyToClipboardElement
												value={verificationId}
												toastDescription="The ID has been copied."
												className="lg:hidden p-0 mr-2 hover:bg-inherit"
											>
												<AddressLink address={verificationId}>
													{shortenHash(verificationId)}
												</AddressLink>
											</CopyToClipboardElement>
											<div className="hidden md:block">
												{network && <NetworkBadge network={network} />}
											</div>
										</div>
									</h1>
								</div>
							</div>

							<div className="flex md:hidden gap-2 justify-between mb-4">
								{network && <NetworkBadge network={network} />}
							</div>

							{verificationRows.length === 0 &&
								verificationRequest &&
								verificationRequest.status === 'pending' && (
									<div className="mt-4">
										<InfoBox
											details={[
												{
													name: 'Status',
													value: (
														<span className="text-blue-500 font-medium">
															{verificationRequest.status}
														</span>
													)
												},
												{
													name: 'Message',
													value: 'Project is being processed. Please wait.'
												}
											]}
										/>
									</div>
								)}

							{verificationRequest && verificationRequest.status === 'failed' ? (
								<Error
									message={formatOutput(verificationRequest.message ?? 'Verification failed')}
								/>
							) : (
								verificationRows.length > 0 && (
									<div className="flex flex-col gap-3">
										{verificationRows.map((row) => (
											<div className="mt-4" key={row.id}>
												<InfoBox
													details={[
														{
															name: 'Status',
															value: (
																<span
																	className={`font-medium ${
																		row.status === VerificationStatus.success
																			? 'text-classGreen'
																			: row.status === VerificationStatus.failed
																			? 'text-red-500'
																			: 'text-blue-500'
																	}`}
																>
																	{row.status}
																</span>
															)
														},
														...(row.classHash
															? [
																	{
																		name: 'Class hash',
																		value: row.classHash,
																		isCopyable: true,
																		linkHref: `/classes/${row.classHash}`
																	}
															  ]
															: []),
														...(row.profiles && row.profiles.length > 0
															? [
																	{
																		name: 'Build profiles',
																		value: row.profiles.join(', ')
																	}
															  ]
															: []),
														...(row.message
															? [
																	{
																		name: 'Message',
																		value: row.message
																	}
															  ]
															: [])
													]}
												/>
											</div>
										))}
									</div>
								)
							)}
						</>
					)}
				</Container>
			</main>
			<div className="hidden md:block">
				<Footer />
			</div>
		</>
	);
}
