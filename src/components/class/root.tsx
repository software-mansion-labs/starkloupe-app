import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { ClassSourceCode } from '../class-source-code';
import { GetClassResponse, ContractItem } from '@/lib/classes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InfoBox, InfoBoxItem } from '../ui/info-box';
import { useSettings } from '@/lib/context/settings-context-provider';
import { ContractsTable } from './contracts-table';
import { fetchClassContracts } from '@/lib/api';
import { normalizeUrl } from '@/lib/utils';

export function ClassRoot({
	isClassVerified,
	sourceCode,
	isContract,
	classData,
	classHash
}: {
	isClassVerified: boolean;
	sourceCode: any;
	isContract: boolean;
	classData: GetClassResponse;
	classHash: string;
}) {
	const [activeTab, setActiveTab] = useState('source-code');
	const [contracts, setContracts] = useState<ContractItem[]>([]);
	const [isLoadingContracts, setIsLoadingContracts] = useState(true);

	const onValueChange = (tab: string) => {
		setActiveTab(tab);
	};

	useEffect(() => {
		const fetchContracts = async () => {
			setIsLoadingContracts(true);
			try {
				const response = await fetchClassContracts(classHash);
				setContracts(response);
			} catch (error) {
				console.error('Error fetching contracts:', error);
			} finally {
				setIsLoadingContracts(false);
			}
		};

		fetchContracts();
	}, [classHash]);

	return (
		<>
			<div className={`md:mt-12 mt-4  h-full flex flex-col overflow-hidden`}>
				<Tabs
					value={activeTab}
					onValueChange={onValueChange}
					className="flex flex-col flex-1 overflow-hidden min-h-0"
				>
					<TabsList className="inline-flex w-full sm:w-fit dark:bg-card justify-start sm:justify-center overflow-x-scroll sm:overflow-x-hidden">
						<TabsTrigger value="source-code">Source Code</TabsTrigger>
						<TabsTrigger value="contracts">Contracts</TabsTrigger>
						<TabsTrigger value="class-details" className="md:hidden">
							Class Details
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value="source-code"
						className={`h-full flex flex-col flex-1 overflow-hidden min-h-0 ${
							activeTab !== 'source-code' ? 'hidden' : ''
						}`}
					>
						<div className="whitespace-nowrap rounded-xl border flex flex-col flex-1 overflow-hidden min-h-0 dark:bg-card">
							<ClassSourceCode
								isClassVerified={isClassVerified}
								sourceCode={sourceCode}
								isContract={isContract}
							/>
						</div>
					</TabsContent>
					<TabsContent
						value="contracts"
						className={`h-full flex flex-col flex-1 overflow-hidden min-h-0 ${
							activeTab !== 'contracts' ? 'hidden' : ''
						}`}
					>
						<ContractsTable contracts={contracts} isLoading={isLoadingContracts} />
					</TabsContent>
					<TabsContent
						value="class-details"
						className={`h-fit flex flex-col  overflow-hidden min-h-0 ${
							activeTab !== 'class-details' ? 'hidden' : ''
						}`}
					>
						<ClassDetails classData={classData} />
					</TabsContent>
				</Tabs>
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
					(network) => normalizeUrl(network.rpcUrl) === normalizeUrl(source.rpcUrl ?? '')
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

	return <InfoBox details={details} />;
}
