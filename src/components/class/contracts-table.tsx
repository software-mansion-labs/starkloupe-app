import { useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { ContractItem } from '@/lib/classes/types';
import { shortenHash } from '@/lib/utils';
import AddressLink from '@/components/address-link';
import CopyToClipboardElement from '@/components/ui/copy-to-clipboard';
import { NetworkBadge, Network } from '@/components/ui/network-badge';
import { useSettings } from '@/lib/context/settings-context-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface ContractsTableProps {
	contracts: ContractItem[];
}

export function ContractsTable({ contracts }: ContractsTableProps) {
	const { parseChain } = useSettings();
	const [expandedNetworks, setExpandedNetworks] = useState<Set<string>>(new Set());

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const parseNetworks = (contractNetworks: { ChainId?: string; RpcUrl?: string }[]): Network[] => {
		return contractNetworks
			.map((network) => {
				if (network.ChainId) {
					return parseChain(network.ChainId);
				}
				if (network.RpcUrl) {
					return parseChain(network.RpcUrl);
				}
				return null;
			})
			.filter((network): network is Network => network !== null);
	};

	const getNetworkName = (network: Network): string => {
		return network.customNetworkName || network.chain || network.stack || 'Unknown';
	};

	const getNetworkKey = (network: Network): string => {
		return network.customNetworkName || network.chain || network.stack || 'unknown';
	};

	const groupContractsByNetwork = () => {
		const grouped = new Map<string, { network: Network; contracts: ContractItem[] }>();

		contracts.forEach((contract) => {
			const networks = parseNetworks(contract.networks);

			if (networks.length === 0) {
				if (!grouped.has('unknown')) {
					grouped.set('unknown', {
						network: { customNetworkName: 'Unknown' },
						contracts: []
					});
				}
				grouped.get('unknown')!.contracts.push(contract);
			} else {
				networks.forEach((network) => {
					const key = getNetworkKey(network);
					if (!grouped.has(key)) {
						grouped.set(key, { network, contracts: [] });
					}
					grouped.get(key)!.contracts.push(contract);
				});
			}
		});

		return Array.from(grouped.values());
	};

	const toggleNetwork = (networkKey: string) => {
		setExpandedNetworks((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(networkKey)) {
				newSet.delete(networkKey);
			} else {
				newSet.add(networkKey);
			}
			return newSet;
		});
	};

	if (contracts.length === 0) {
		return (
			<div className="rounded-xl border dark:bg-card p-8">
				<div className="text-center text-muted-foreground">
					<p>No contracts found for this class</p>
				</div>
			</div>
		);
	}

	const groupedContracts = groupContractsByNetwork();

	return (
		<div className="rounded-xl border flex h-full flex-col flex-1 min-h-0 text-xs dark:bg-card">
			<ScrollArea className="h-full w-full">
				<div className="p-4 space-y-2">
					{groupedContracts.map((group) => {
						const networkKey = getNetworkKey(group.network);
						const networkName = getNetworkName(group.network);
						const isExpanded = expandedNetworks.has(networkKey);

						return (
							<div key={networkKey} className="border rounded-lg overflow-hidden">
								<button
									onClick={() => toggleNetwork(networkKey)}
									className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
								>
									<div className="flex items-center gap-3">
										{isExpanded ? (
											<ChevronDown className="h-4 w-4 text-muted-foreground" />
										) : (
											<ChevronRight className="h-4 w-4 text-muted-foreground" />
										)}
										<NetworkBadge networks={[group.network]} type="contract" />
									</div>
									<span className="text-xs text-muted-foreground">
										{group.contracts.length}{' '}
										{group.contracts.length === 1 ? 'contract' : 'contracts'}
									</span>
								</button>

								{isExpanded && (
									<div className="border-t">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="font-semibold px-4">Address</TableHead>
													<TableHead className="font-semibold">Creation Date</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{group.contracts.map((contract, index) => (
													<TableRow key={index}>
														<TableCell className="!px-4 flex items-center gap-1">
															<CopyToClipboardElement
																value={contract.address}
																toastDescription={`Contract address has been copied.`}
																className={`rounded-sm font-mono leading-normal  px-0  hover:bg-inherit
																cursor-pointer`}
															>
																<AddressLink
																	address={contract.address}
																	addressClassName="md:hidden w-fit"
																>
																	{shortenHash(contract.address)}
																</AddressLink>

																<AddressLink
																	address={contract.address}
																	addressClassName="md:block hidden w-fit"
																>
																	{contract.address}
																</AddressLink>
															</CopyToClipboardElement>
															<Link
																target="_blank"
																href={`/contracts/${contract.address}`}
																className="z-10 bg-accent focus:outline-none hover:bg-accent_2 cursor-pointer p-1 rounded-sm"
															>
																{' '}
																<ArrowTopRightOnSquareIcon className="w-3 h-3" />
															</Link>
														</TableCell>
														<TableCell className="text-muted-foreground">
															{formatDate(contract.deployment_time)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}
