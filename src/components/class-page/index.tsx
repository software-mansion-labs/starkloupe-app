'use client';

import { useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Loader } from '../ui/loader';
import { InfoBoxItem, InfoBox } from '../ui/info-box';
import { Error } from '../ui/error';
import { fetchClassDataByHash, GetClassResponse } from '@/lib/classes';
import { useSettings } from '@/lib/context/settings-context-provider';
import { shortenHash } from '@/lib/utils';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import AddressLink from '../address-link';
import { NetworkBadge } from '../ui/network-badge';
import { VerifiedBadge } from '../ui/verified-badge';
import { ClassRoot } from '../class/root';
import { ServerError } from '../ui/server-error';

interface Network {
	stack?: string;
	chain?: string;
	customNetworkName?: string;
}
export function ClassPage({ classHash }: { classHash: string }) {
	const { networks, getNetworkByRpcUrl, parseChain } = useSettings();
	const [classData, setClassData] = useState<GetClassResponse>();
	const [error, setError] = useState<{ message: string; status: number } | undefined>();

	useEffect(() => {
		if (!networks) return;
		const fetchData = async () => {
			try {
				setClassData(
					await fetchClassDataByHash({
						classHash,
						includeSourceCode: true,
						rpcUrls: networks.map((n) => n.rpcUrl)
					})
				);
			} catch (error: any) {
				setError(error);
			}
		};

		fetchData();
	}, [classHash, networks]);

	let networksArray = classData?.declaredSources.map((item) => {
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
			<NetworkBadge
				title="This class was found on the following networks"
				networks={networksArray as Network[]}
			/>
		) : null;

	let content = null;
	if (error) {
		content =
			error.status === 500 ? (
				<ServerError message={error.message} />
			) : (
				<Error message={error.message} />
			);
	} else if (classData) {
		content = (
			<>
				<ClassRoot
					isClassVerified={classData.verified}
					sourceCode={classData.sourceCode ?? {}}
					isContract={false}
					classData={classData}
					classHash={classHash}
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
									<span>Class</span>
									<CopyToClipboardElement
										value={classHash}
										toastDescription="The address has been copied."
										className="hidden lg:block p-0 mr-2 hover:bg-inherit"
									>
										<AddressLink address={classHash}>{classHash}</AddressLink>
									</CopyToClipboardElement>
									<CopyToClipboardElement
										value={classHash}
										toastDescription="The address has been copied."
										className="lg:hidden p-0 mr-2 hover:bg-inherit"
									>
										<AddressLink address={classHash}>{shortenHash(classHash)}</AddressLink>
									</CopyToClipboardElement>

									<div className="hidden md:flex  gap-2 ">
										{networkBadge}
										{classData?.verified && <VerifiedBadge />}
									</div>
								</div>
							</h1>
						</div>
						<div className="flex md:hidden gap-2 justify-between">
							{networkBadge}
							{classData?.verified && <VerifiedBadge />}
						</div>
					</div>
					<div className="hidden md:block">
						{classData && <ClassDetails classData={classData} />}
					</div>
					<div className="flex-1 flex flex-col overflow-hidden min-h-0 ">{content}</div>
				</Container>
			</main>
			<div className="hidden md:block">
				<Footer />
			</div>
		</>
	);
}

function ClassDetails({ classData }: { classData: GetClassResponse }) {
	const { networks, parseChain } = useSettings();

	const details: InfoBoxItem[] = [
		{
			name: 'Verified on Walnut',
			value: classData.verified.toString()
		}
	];

	if (classData.declaredSources.length > 0) {
		const declaredOnNetworks = [];
		for (const source of classData.declaredSources) {
			if (source.chainId) {
				declaredOnNetworks.push(parseChain(source.chainId));
			} else {
				const networkInSettings = (networks ?? []).find(
					(network) => network.rpcUrl === source.rpcUrl
				);
				if (networkInSettings) {
					declaredOnNetworks.push(parseChain(networkInSettings.networkName));
				} else if (source.rpcUrl) {
					declaredOnNetworks.push(parseChain(source.rpcUrl));
				}
			}
		}

		details.push({
			name: 'Declared on networks',
			value: declaredOnNetworks
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
