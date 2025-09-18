'use client';

import { useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Loader } from '../ui/loader';
import { InfoBoxItem, InfoBox } from '../ui/info-box';
import { Error } from '../ui/error';
import {
	ContractFunctions,
	fetchContractDataByAddress,
	fetchContractFunctions,
	GetContractResponse
} from '@/lib/contracts';
import { ClassSourceCode } from '@/components/class-source-code';
import { useSettings } from '@/lib/context/settings-context-provider';
import { shortenHash } from '@/lib/utils';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import AddressLink from '../address-link';
import { ContractRoot } from '../contract/root';
import { Network, NetworkBadge } from '../ui/network-badge';
import { VerifiedBadge } from '../ui/verified-badge';

export function ContractPage({ contractAddress }: { contractAddress: string }) {
	const { networks, parseChain, getNetworkByRpcUrl } = useSettings();
	const [contractData, setContractData] = useState<GetContractResponse>();
	const [entryPoints, setEntrypoints] = useState<ContractFunctions>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		if (!networks) return;
		const fetchData = async () => {
			try {
				setContractData(
					await fetchContractDataByAddress({
						contractAddress,
						includeSourceCode: true,
						rpcUrls: networks.map((n) => n.rpcUrl)
					})
				);
			} catch (error: any) {
				setError(error.toString());
			}
		};

		fetchData();
	}, [contractAddress, networks]);

	useEffect(() => {
		if (!contractData) return;
		const fetchEntrypoints = async () => {
			try {
				setEntrypoints(
					await fetchContractFunctions({
						contractAddress,
						network: contractData.deployedSources[0].chainId || ''
					})
				);
			} catch (error: any) {
				setError(error.toString());
			}
		};

		fetchEntrypoints();
	}, [contractData]);

	let networksArray = contractData?.deployedSources.map((item) => {
		const network = item?.rpcUrl ? getNetworkByRpcUrl(item?.rpcUrl) : null;
		const chainDetails = network?.networkName
			? parseChain(network?.networkName)
			: item?.chainId
			? parseChain(item?.chainId)
			: undefined;
		return chainDetails;
	});

	const networkBadge =
		networksArray && networksArray.length > 0 ? (
			<NetworkBadge networks={networksArray as Network[]} />
		) : null;

	let content = null;
	if (error) {
		content = <Error message={error} />;
	} else if (contractData) {
		content = (
			<>
				<ContractRoot
					isClassVerified={contractData.verified}
					sourceCode={contractData.sourceCode ?? {}}
					isContract={true}
					entryPoints={entryPoints}
				/>
			</>
		);
	} else {
		content = <Loader randomQuote={false} />;
	}
	return (
		<>
			<HeaderNav />
			<main className="h-full flex flex-col overflow-hidden  short:overflow-scroll">
				<Container className="py-4 sm:py-6 lg:py-8 h-full flex flex-col short:min-h-[600px]">
					<div className="flex flex-col md:flex-row gap-2 mt-4 mb-2 items-baseline justify-between flex-none">
						<h1 className="text-base font-medium leading-6">
							<div className="flex flex-wrap items-center gap-1">
								Contract{' '}
								<CopyToClipboardElement
									value={contractAddress}
									toastDescription="The address has been copied."
									className="hidden lg:block p-0"
								>
									<AddressLink address={contractAddress}>{contractAddress}</AddressLink>
								</CopyToClipboardElement>
								<CopyToClipboardElement
									value={contractAddress}
									toastDescription="The address has been copied."
									className="lg:hidden p-0 hover:bg-inherit"
								>
									<AddressLink address={contractAddress}>
										{shortenHash(contractAddress)}
									</AddressLink>
								</CopyToClipboardElement>
								{networkBadge}
								{contractData?.verified && <VerifiedBadge />}
							</div>
						</h1>
					</div>
					{contractData && <ContractDetails contractData={contractData} />}
					<div className="flex-1 flex flex-col overflow-hidden min-h-0 ">{content}</div>
					{/* {contractData ? (
						<ClassSourceCode
							isClassVerified={contractData.verified}
							sourceCode={contractData.sourceCode ?? {}}
							isContract={true}
						/>
					) : error ? (
						<Error message={error} />
					) : (
						<Loader randomQuote={false} />
					)} */}
				</Container>
			</main>
			<Footer />
		</>
	);
}

function ContractDetails({ contractData }: { contractData: GetContractResponse }) {
	const { networks, parseChain } = useSettings();

	const details: InfoBoxItem[] = [
		{
			name: 'Class hash',
			value: contractData.classHash
		},
		{
			name: 'Cairo version',
			value: contractData.cairoVersion
		},

		{
			name: 'Verified on Walnut',
			value: contractData.verified.toString()
		}
	];

	if (contractData.deployedSources.length > 0) {
		const deployedOnNetworks = [];
		for (const source of contractData.deployedSources) {
			if (source.chainId) {
				deployedOnNetworks.push(parseChain(source.chainId));
			} else {
				const networkInSettings = (networks ?? []).find(
					(network) => network.rpcUrl === source.rpcUrl
				);
				if (networkInSettings) {
					deployedOnNetworks.push(parseChain(networkInSettings.networkName));
				} else if (source.rpcUrl) {
					deployedOnNetworks.push(parseChain(source.rpcUrl));
				}
			}
		}

		details.push({
			name: 'Deployed on networks',
			value: deployedOnNetworks
				.map((network) => {
					if (!network?.customNetworkName) {
						const stack = network?.stack || '';
						const chain = network?.chain || '';

						return [stack, chain].filter(Boolean).join(' ');
					} else {
						return [network?.customNetworkName];
					}
				})
				.filter(Boolean)
				.join(', ')
		});
	}

	return (
		<div className="mt-4">
			<InfoBox details={details} />
		</div>
	);
}
