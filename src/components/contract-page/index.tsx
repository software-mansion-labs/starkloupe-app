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
import { ClassSourceCode } from '@/components/class-source-code';

export function ContractPage({
	chainId,
	rpcUrl,
	contractAddress
}: {
	chainId?: ChainId;
	rpcUrl?: string;
	contractAddress: string;
}) {
	const [contractData, setContractData] = useState<ContractResponseWithSourceCode>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setContractData(
					await fetchContractDataByAddress({
						chainId,
						rpcUrl,
						contractAddress,
						includeSourceCode: true
					})
				);
			} catch (error: any) {
				setError(error.toString());
			}
		};

		fetchData();
	}, [chainId, rpcUrl, contractAddress]);

	return (
		<>
			<HeaderNav />
			<main className="overflow-y-auto flex-grow flex-col flex justify-between">
				<Container className="py-6">
					<div className="flex flex-row items-baseline justify-between">
						<h1 className="text-xl font-medium leading-6 mt-4 mb-2 mr-2">
							Contract {contractAddress}
						</h1>
					</div>
					{contractData && <ContractDetails contractData={contractData} />}
					{contractData ? (
						<ClassSourceCode
							isClassVerified={contractData.isClassVerified}
							sourceCode={contractData.sourceCode ?? {}}
							isContract={true}
						/>
					) : error ? (
						<Error message={error} />
					) : (
						<Loader randomQuote={false} />
					)}
				</Container>
				<Footer />
			</main>
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
			name: 'Verified on Walnut',
			value: contractData.isClassVerified.toString()
		}
	];

	return (
		<div className="mt-4">
			<InfoBox details={details} />
		</div>
	);
}
