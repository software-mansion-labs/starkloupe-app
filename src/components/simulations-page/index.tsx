'use client';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { useEffect, useState } from 'react';
import { SimulationsResponse, fetchSimulations } from '@/lib/simulation';
import { ToggleButton } from '../ui/toggle-button';
import { useRouter } from 'next/navigation';
import { formatTimestamp, hexToText } from '@/lib/utils';
import { Loader } from '../ui/loader';
import { Stats } from '../stats';

export function SimulationsPage({
	projectSlug,
	walletAddress
}: {
	projectSlug?: string;
	walletAddress?: string;
}) {
	const router = useRouter();
	const [simulationsData, setSimulationsData] = useState<SimulationsResponse | null>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setSimulationsData(await fetchSimulations(projectSlug));
			} catch (error) {
				console.log('Error fetching data');
			}
		};

		fetchData();
	}, [projectSlug]);

	const [isAllVisible, setIsAllVisible] = useState<boolean>(true);

	useEffect(() => {
		if (!projectSlug && simulationsData?.project?.slug) {
			const newUrl = `/monitoring/project/${simulationsData.project.slug}`;
			window.history.pushState(null, '', newUrl);
		}
	}, [projectSlug, simulationsData]);

	return (
		<>
			<HeaderNav />
			<header>
				<Container>
					<div className="bg-white border-x shadow-sm border-neutral-200 p-4">
						<h1 className="text-xl font-medium leading-6 my-4">{simulationsData?.project.name}</h1>
						{simulationsData && simulationsData.simulations.length > 0 && (
							<>
								<h2 className="text-l font-medium leading-6 my-4">Recent 7-Day Overview</h2>
								<Stats stats={simulationsData.stats} />
							</>
						)}
						<h2 className="text-l font-medium leading-6 my-4">Latest simulations</h2>
						{simulationsData && simulationsData.simulations.length > 0 && (
							<div className="my-4">
								<ToggleButton
									enabled={isAllVisible}
									onToggleChange={() => {
										setIsAllVisible(!isAllVisible);
									}}
									onCopy={'All simulations visible'}
									offCopy={'Only failed simulations visible'}
								/>
							</div>
						)}
					</div>
				</Container>
			</header>
			<main>
				<Container>
					<div className="bg-white border-x border-b shadow-sm border-neutral-200 rounded-b-sm p-4">
						{simulationsData?.simulations ? (
							simulationsData.simulations.length <= 0 ? (
								<>No simulations found</>
							) : (
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
													key={simulation.id}
													className="cursor-pointer"
													onClick={() => router.push(`/simulation/${simulation.id}`)}
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
							)
						) : simulationsData === null ? (
							<>Your account is not associated with any project</>
						) : (
							<Loader />
						)}
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}
