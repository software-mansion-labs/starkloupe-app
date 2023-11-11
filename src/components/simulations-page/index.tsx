'use client';

import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Header } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { useEffect, useState } from 'react';
import { SimulationsResponse, fetchSimulations } from '@/lib/simulation';
import { Button } from '../ui/button';
import { ToggleButton } from '../ui/toggle-button';
import { useRouter } from 'next/navigation';

export function SimulationsPage({
	teamId,
	walletAddress
}: {
	teamId?: number;
	walletAddress?: string;
}) {
	const router = useRouter();
	const [simulationsData, setSimulationsData] = useState<SimulationsResponse>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setSimulationsData(await fetchSimulations(teamId, walletAddress));
			} catch (error) {
				console.log('Error fetching data');
			}
		};

		fetchData();
	}, [teamId, walletAddress]);

	const [isAllVisible, setIsAllVisible] = useState<boolean>(true);

	return (
		<>
			<Header hideCopyLink />
			<main className="flex-auto flex w-full pt-5 pb-10">
				<Container className="overflow-hidden flex-auto">
					<div className="text-xl font-medium my-4">
						{teamId === 2 ? (
							<>
								Latest transactions from Briq —{' '}
								<a href="https://test.sltech.company">test.sltech.company</a>
							</>
						) : teamId === 1 ? (
							<>
								Latest transactions from Wido — <a href="https://joinwido.com">joinwido.com</a>
							</>
						) : (
							''
						)}
					</div>
					<div className="my-4">
						<ToggleButton
							enabled={isAllVisible}
							onToggleChange={() => {
								setIsAllVisible(!isAllVisible);
							}}
							onCopy={'All transactions visible'}
							offCopy={'Only failed transactions visible'}
						/>
					</div>
					{simulationsData?.simulations ? (
						<div className="border border-neutral-200 rounded-sm">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[100px]">Timestamp</TableHead>
										<TableHead>Wallet address</TableHead>
										<TableHead>Chain</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="font-mono">
									{simulationsData?.simulations
										.filter((s) => isAllVisible || s.status === 'failure')
										.map((simulation) => (
											<TableRow
												key={simulation.created_at}
												className="cursor-pointer"
												onClick={() => {
													writeCookie('status', simulation.status, 1);
													router.push(`/simulation/${simulation.id}`);
												}}
											>
												<TableCell className="whitespace-nowrap">
													{formatTimestamp(simulation.created_at)}
												</TableCell>
												<TableCell className="flex flex-row items-center">
													{simulation.wallet_address}{' '}
													{/* <DocumentDuplicateIcon className="w-3 h-3 ml-2 cursor-pointer" /> */}
												</TableCell>
												<TableCell>{hexToText(simulation.chain_id)}</TableCell>
												<TableCell
													className={`${
														simulation.status === 'success'
															? 'text-lime-600'
															: simulation.status === 'simulating'
															? 'text-blue-600'
															: 'text-red-600'
													}`}
												>
													{simulation.status}
												</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</div>
					) : (
						'Loading...'
					)}
				</Container>
			</main>
			<Footer />
		</>
	);
}

function formatTimestamp(timestamp: number): string {
	let dateObject = new Date(timestamp * 1000);

	let formatDate =
		dateObject.getFullYear() +
		'-' +
		('0' + (dateObject.getMonth() + 1)).slice(-2) +
		'-' +
		('0' + dateObject.getDate()).slice(-2) +
		' ' +
		('0' + dateObject.getHours()).slice(-2) +
		':' +
		('0' + dateObject.getMinutes()).slice(-2);

	return formatDate;
}

function hexToText(hex: string): string {
	let text = '';
	for (let i = 0; i < hex.length; i += 2) {
		text += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}
	return text;
}
function writeCookie(name: string, value: string, days: number): void {
	let expires = '';

	if (days) {
		let date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = '; expires=' + date.toUTCString();
	}
	document.cookie = name + '=' + (value || '') + expires + '; path=/';
}
