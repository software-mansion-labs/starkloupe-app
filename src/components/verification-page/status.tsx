import { useEffect, useState, useCallback } from 'react';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { fetchVerificationStatus } from '@/lib/verification';
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

export function VerificationStatusPage({ verificationId }: { verificationId: string }) {
	const [verificationRows, setVerificationRows] = useState<VerificationStatusRow[]>([]);
	const [verificationRequest, setVerificationRequest] = useState<VerificationRequestRow | null>(
		null
	);
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

	return (
		<>
			<HeaderNav />
			<main className="overflow-y-auto flex-grow">
				<Container className="py-6">
					{isLoading ? (
						<Loader randomQuote={false} />
					) : (
						<>
							{error ? (
								<Error message={error} />
							) : (
								<div className="flex flex-col gap-4">
									<div className="font-mono text-sm">Verification ID: {verificationId}</div>
									{verificationRequest && verificationRequest.status === 'pending' && (
										<Loader randomQuote={false} text="verifying..." />
									)}
									{verificationRequest && verificationRequest.status === 'failed' && (
										<Error
											errorTitle="Verification failed"
											title={false}
											message={verificationRequest.message ?? 'Verification failed'}
										/>
									)}
									{verificationRows.length > 0 && (
										<div className="rounded border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Status</TableHead>
														<TableHead>Class hash</TableHead>
														<TableHead>Message</TableHead>
														<TableHead className="text-right">Updated At</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{verificationRows.map((row) => (
														<TableRow key={row.id}>
															<TableCell
																className={
																	row.status === VerificationStatus.success
																		? 'text-green-500'
																		: row.status === VerificationStatus.failed
																		? 'text-red-500'
																		: 'text-blue-500'
																}
															>
																{row.status}
															</TableCell>
															<TableCell className="font-mono">{row.classHash}</TableCell>
															<TableCell>{row.message}</TableCell>
															<TableCell className="text-right font-mono">
																{new Date(row.updatedAt).toLocaleString()}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									)}
								</div>
							)}
						</>
					)}
				</Container>
			</main>
			<Footer />
		</>
	);
}
