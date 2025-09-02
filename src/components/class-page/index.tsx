'use client';

import { useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Loader } from '../ui/loader';
import { InfoBoxItem, InfoBox } from '../ui/info-box';
import { Error } from '../ui/error';
import { ClassSourceCode } from '@/components/class-source-code';
import { fetchClassDataByHash, GetClassResponse } from '@/lib/classes';
import { useSettings } from '@/lib/context/settings-context-provider';
import { shortenHash } from '@/lib/utils';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import AddressLink from '../address-link';
import { NetworkBadge } from '../ui/network-badge';

export function ClassPage({ classHash }: { classHash: string }) {
	const { networks, getNetworkByRpcUrl, parseChain } = useSettings();
	const [classData, setClassData] = useState<GetClassResponse>();
	const [error, setError] = useState<string | undefined>();

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
				setError(error.toString());
			}
		};

		fetchData();
	}, [classHash, networks]);

	let networkBadges = classData?.declaredSources.map((item) => {
		const network = item?.rpcUrl ? getNetworkByRpcUrl(item?.rpcUrl) : null;
		const chainDetails = network?.networkName
			? parseChain(network?.networkName)
			: item?.chainId
			? parseChain(item?.chainId)
			: undefined;
		return chainDetails && <NetworkBadge network={chainDetails} />;
	});

	return (
		<>
			<HeaderNav />
			<main className="h-full flex flex-col overflow-hidden  short:overflow-scroll">
				<Container className="py-4 sm:py-6 lg:py-8 h-full flex flex-col short:min-h-[600px]">
					<div className="flex flex-col md:flex-row gap-2 mt-4 mb-2 items-baseline justify-between flex-none">
						<h1 className="text-base font-medium leading-6">
							<div className="flex flex-wrap items-center gap-1">
								Class{' '}
								<CopyToClipboardElement
									value={classHash}
									toastDescription="The address has been copied."
									className="hidden lg:block p-0"
								>
									<AddressLink address={classHash}>{classHash}</AddressLink>
								</CopyToClipboardElement>
								<CopyToClipboardElement
									value={classHash}
									toastDescription="The address has been copied."
									className="lg:hidden p-0"
								>
									<AddressLink address={classHash}>{shortenHash(classHash)}</AddressLink>
								</CopyToClipboardElement>
								{networkBadges}
							</div>
						</h1>
					</div>
					{classData && <ClassDetails classData={classData} />}
					{classData ? (
						<div className="flex-1 flex flex-col overflow-hidden min-h-0 mt-12">
							<div className="whitespace-nowrap rounded-xl border flex flex-col flex-1 overflow-hidden min-h-0 dark:bg-card">
								{' '}
								<ClassSourceCode
									isClassVerified={classData.verified}
									sourceCode={classData.sourceCode ?? {}}
									isContract={false}
								/>
							</div>
						</div>
					) : error ? (
						<Error message={error} />
					) : (
						<Loader randomQuote={false} />
					)}
				</Container>
			</main>
			<Footer />
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
