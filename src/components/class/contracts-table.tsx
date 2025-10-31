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

interface ContractsTableProps {
	contracts: ContractItem[];
}

export function ContractsTable({ contracts }: ContractsTableProps) {
	const { parseChain } = useSettings();

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

	if (contracts.length === 0) {
		return (
			<div className="rounded-xl border dark:bg-card p-8">
				<div className="text-center text-muted-foreground">
					<p>No contracts found for this class</p>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-xl border flex h-full flex-col flex-1 min-h-0 text-xs dark:bg-card">
			<ScrollArea className="h-full w-full">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="font-semibold pl-3">Address</TableHead>
							<TableHead className="font-semibold">Creation Date</TableHead>
							<TableHead className="font-semibold">Network</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{contracts &&
							contracts?.map((contract, index) => {
								const networks = parseNetworks(contract.networks);
								return (
									<TableRow key={index}>
										<TableCell>
											<CopyToClipboardElement
												value={contract.address}
												toastDescription="The address has been copied."
												className="p-0 hover:bg-inherit"
											>
												<AddressLink address={contract.address} addressClassName="md:hidden w-fit">
													{shortenHash(contract.address)}
												</AddressLink>
												<AddressLink
													address={contract.address}
													addressClassName="md:block hidden w-fit"
												>
													{contract.address}
												</AddressLink>
											</CopyToClipboardElement>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(contract.deployment_time)}
										</TableCell>
										<TableCell>
											{networks.length > 0 ? (
												<NetworkBadge networks={networks} type="contract" />
											) : (
												<span className="text-muted-foreground text-xs">Unknown</span>
											)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
			</ScrollArea>
		</div>
	);
}
