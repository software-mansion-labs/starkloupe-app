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
import { normalizeUrl, shortenHash } from '@/lib/utils';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import AddressLink from '../address-link';
import { ContractRoot } from '../contract/root';
import { Network, NetworkBadge } from '../ui/network-badge';
import { VerifiedBadge } from '../ui/verified-badge';
import { ServerError } from '../ui/server-error';
import { NonVerifiedBadge } from '../ui/non-verified-badge';

export function ContractPage({ contractAddress }: { contractAddress: string }) {
	const { networks, parseChain, getNetworkByRpcUrl } = useSettings();
	const [contractData, setContractData] = useState<GetContractResponse>();
	const [entryPoints, setEntrypoints] = useState<ContractFunctions>();
	const [error, setError] = useState<{ message: string; status: number } | undefined>();

	useEffect(() => {
		if (!networks) return;
		const fetchData = async () => {
			try {
				setContractData(
					await fetchContractDataByAddress({
						contractAddress,
						includeSourceCode: true,
						rpcUrls: networks.map((n) => n.rpcUrl),
						includeAbi: true
					})
				);
			} catch (error) {
				setError({
					message:
						(error as { message: string; status: number })?.message || 'Unknown error occurred',
					status: (error as { message: string; status: number })?.status || 500
				});
			}
		};

		fetchData();
	}, [contractAddress, networks]);

	useEffect(() => {
		if (!contractData) return;
		const chainId = contractData.deployedSources[0].chainId;
		if (!chainId) return;
		const fetchEntrypoints = async () => {
			try {
				setEntrypoints(
					await fetchContractFunctions({
						contractAddress,
						network: chainId
					})
				);
			} catch (error) {
				setError({
					message:
						(error as { message: string; status: number })?.message || 'Unknown error occurred',
					status: (error as { message: string; status: number })?.status || 500
				});
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
			<NetworkBadge type="contract" networks={networksArray as Network[]} />
		) : null;

	let content = null;
	if (error) {
		content =
			error.status >= 500 && error.status < 600 ? (
				<ServerError message={error.message} />
			) : (
				<Error message={error.message} />
			);
	} else if (contractData) {
		content = (
			<>
				<ContractRoot
					isClassVerified={contractData.verified}
					sourceCode={contractData.sourceCode ?? {}}
					isContract={true}
					entryPoints={entryPoints}
					contractData={contractData}
					contractAddress={contractAddress}
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
					<div className="xl:flex flex-row items-baseline justify-between">
						<div className="flex flex-col gap-2 mt-4 mb-2 mr-2">
							<h1 className="text-base font-medium leading-6">
								<div className="flex flex-wrap items-center gap-1">
									<span>Contract</span>
									<CopyToClipboardElement
										value={contractAddress}
										toastDescription="The address has been copied."
										className="hidden lg:block p-0 mr-2 hover:bg-inherit"
									>
										<AddressLink address={contractAddress}>{contractAddress}</AddressLink>
									</CopyToClipboardElement>
									<CopyToClipboardElement
										value={contractAddress}
										toastDescription="The address has been copied."
										className="lg:hidden p-0 mr-2 hover:bg-inherit"
									>
										<AddressLink address={contractAddress}>
											{shortenHash(contractAddress)}
										</AddressLink>
									</CopyToClipboardElement>

									<div className="hidden md:flex  gap-2 ">
										{networkBadge}
										{contractData &&
											(contractData?.verified ? <VerifiedBadge /> : <NonVerifiedBadge />)}
									</div>
								</div>
							</h1>
						</div>
						<div className="flex md:hidden gap-2 justify-between">
							{networkBadge}
							{contractData && (contractData?.verified ? <VerifiedBadge /> : <NonVerifiedBadge />)}
						</div>
					</div>
					<div className="hidden md:block">
						{contractData && <ContractDetails contractData={contractData} />}
					</div>
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
			<div className="hidden md:block">
				<Footer />
			</div>
		</>
	);
}

function ContractDetails({ contractData }: { contractData: GetContractResponse }) {
	const { networks, parseChain } = useSettings();

	const details: InfoBoxItem[] = [
		{
			name: 'Class hash',
			value: contractData.classHash,
			linkHref: `/classes/${contractData.classHash}`
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
					(network) => normalizeUrl(network.rpcUrl) === normalizeUrl(source.rpcUrl ?? '')
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
