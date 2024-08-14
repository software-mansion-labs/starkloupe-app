'use client';

import { useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Loader } from '../ui/loader';
import { ChainId } from '@/lib/types';
import { InfoBoxItem, InfoBox } from '../ui/info-box';
import { Error } from '../ui/error';
import { fetchContractDataByAddress, ContractResponseWithSourceCode } from '@/lib/contracts';
import { ContractRoot } from '@/components/contract';

export function ContractPage({
	chainId,
	contractAddress
}: {
	chainId: string;
	contractAddress: string;
}) {
	const [contractData, setContractData] = useState<ContractResponseWithSourceCode>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setContractData(
					await fetchContractDataByAddress({
						chainId: chainId as ChainId,
						contractAddress,
						includeSourceCode: true
					})
				);
			} catch (error: any) {
				setError(error.toString());
			}
		};

		fetchData();
	}, [chainId, contractAddress]);

	return (
		<>
			<HeaderNav />
			<main>
				<Container>
					<div className="bg-white border-x border-b shadow-sm border-neutral-200 p-4 pb-0">
						<div className="flex flex-row items-baseline justify-between">
							<h1 className="text-l font-medium leading-6 mt-4 mb-2 mr-2">
								Contract {contractAddress}
							</h1>
						</div>
						{contractData && <ContractDetails contractData={contractData} />}
						{contractData ? (
							<ContractRoot contractData={contractData} />
						) : error ? (
							<Error message={error} />
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

function ContractDetails({ contractData }: { contractData: ContractResponseWithSourceCode }) {
	const details: InfoBoxItem[] = [
		{
			name: 'Class hash',
			value: contractData.classHash
		},
		{
			name: 'Verified',
			value: contractData.isClassVerified.toString()
		}
	];

	return (
		<div className="mt-4 py-1 px-2 bg-neutral-100 rounded-sm flex flex-col">
			<InfoBox details={details} />
		</div>
	);
}
