import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCallback, useState } from 'react';
import { ClassSourceCode } from '../class-source-code';
import { EntrypointsList } from './entrypoints-list';
import { ContractFunctions, GetContractResponse } from '@/lib/contracts';
import EntryPointsSearch from '../ui/entrypoints-search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InfoBox, InfoBoxItem } from '../ui/info-box';
import { useSettings } from '@/lib/context/settings-context-provider';

export function ContractRoot({
	isClassVerified,
	sourceCode,
	isContract,
	entryPoints,
	contractData,
	contractAddress
}: {
	isClassVerified: boolean;
	sourceCode: any;
	isContract: boolean;
	entryPoints: ContractFunctions | undefined;
	contractData: GetContractResponse;
	contractAddress: string;
}) {
	return (
		<ContractRootContent
			isClassVerified={isClassVerified}
			sourceCode={sourceCode}
			isContract={true}
			entryPoints={entryPoints}
			contractData={contractData}
			contractAddress={contractAddress}
		/>
	);
}

function ContractRootContent({
	isClassVerified,
	sourceCode,
	isContract,
	entryPoints,
	contractData,
	contractAddress
}: {
	isClassVerified: boolean;
	sourceCode: any;
	isContract: boolean;
	entryPoints: ContractFunctions | undefined;
	contractData: GetContractResponse;
	contractAddress: string;
}) {
	const [activeTab, setActiveTab] = useState('source-code');

	const onValueChange = (tab: string) => {
		setActiveTab(tab);
	};

	return (
		<>
			<div className={`md:mt-12 mt-4  h-full flex flex-col overflow-hidden`}>
				<Tabs
					value={activeTab}
					onValueChange={onValueChange}
					className="flex flex-col flex-1 overflow-hidden min-h-0"
				>
					<TabsList className="hidden sm:inline-flex md:w-fit dark:bg-card justify-center">
						<TabsTrigger value="source-code">Source Code</TabsTrigger>
						<TabsTrigger value="contract-details" className="md:hidden">
							Contract Details
						</TabsTrigger>
						<TabsTrigger value="entrypoints">Entrypoints</TabsTrigger>
					</TabsList>
					<div className="sm:hidden">
						<Select value={activeTab} onValueChange={setActiveTab}>
							<SelectTrigger className="w-full focus:outline-none focus:ring-0 focus:ring-offset-0">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="source-code">Source Code</SelectItem>
								<SelectItem value="contract-details">Contract Details</SelectItem>
								<SelectItem value="entrypoints">Entrypoints</SelectItem>
							</SelectContent>
						</Select>
					</div>
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
						value="contract-details"
						className={`h-fit flex flex-col  overflow-hidden min-h-0 ${
							activeTab !== 'contract-details' ? 'hidden' : ''
						}`}
					>
						<ContractDetails contractData={contractData} />
					</TabsContent>
					<TabsContent
						value="entrypoints"
						className={`h-full flex flex-col flex-1 overflow-hidden min-h-0 ${
							activeTab !== 'entrypoints' ? 'hidden' : ''
						}`}
					>
						<div className="rounded-xl border flex flex-col flex-1 overflow-hidden min-h-0 text-xs dark:bg-card">
							<div className="border-b shadow-sm flex-none">
								<div className="flex justify-between w-full items-center px-4">
									<EntryPointsSearch entryPoints={entryPoints} />
								</div>
							</div>
							<ScrollArea className="flex-1 overflow-auto">
								<div className="p-0 md:py-2">
									<EntrypointsList
										entryPoints={entryPoints}
										contractAddress={contractAddress}
										chainId={contractData.deployedSources[0].chainId}
									/>
								</div>
								<ScrollBar orientation="horizontal" />
							</ScrollArea>
						</div>
					</TabsContent>
				</Tabs>
			</div>
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

	return <InfoBox details={details} />;
}
