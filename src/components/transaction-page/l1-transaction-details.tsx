import { useSettings } from '@/lib/context/settings-context-provider';
import { InfoBox, InfoBoxItem } from '../ui/info-box';
import { L1TransactionData } from '@/lib/simulation';

export function L1TransactionDetails({
	transactionData,
	rpcUrl,
	chainDetails
}: {
	transactionData: L1TransactionData;
	rpcUrl?: string;
	chainDetails?:
		| {
				stack?: string | undefined;
				chain?: string | undefined;
		  }
		| null
		| undefined;
}) {
	const { getNetworkByRpcUrl, parseChain } = useSettings();
	let details: InfoBoxItem[] = [];

	// 1. Transaction Type (always first)
	if (transactionData.transactionType) {
		details.push({
			name: 'Transaction Type',
			value: <span className="text-variable">{transactionData.transactionType}</span>,
			isCopyable: true
		});
	}

	// 2. Execution Status
	if (transactionData.status && transactionData.status === 'SUCCEEDED') {
		details.push({
			name: 'Execution status',
			value: <span className={'text-classGreen '}>{transactionData.status}</span>
		});
	} else if (transactionData.status && transactionData.status === 'REVERTED') {
		details.push({
			name: 'Execution status',
			value: <span className={'text-red-600 '}>REVERTED</span>
		});
	}

	// 3. Network details
	if (rpcUrl) {
		const network = getNetworkByRpcUrl(rpcUrl);
		if (network) {
			details.push({
				name: 'Custom Network',
				value: network.networkName
			});
		}
		details.push({
			name: 'RPC URL',
			value: rpcUrl
		});
	}

	// 4. Chain and Block info
	if (transactionData.chainId) {
		if (chainDetails) {
			details.push({
				name: 'Stack',
				value: chainDetails?.stack
			});
			details.push({
				name: 'Chain',
				value: chainDetails?.chain
			});
		} else {
			details.push({
				name: 'Chain',
				value: transactionData.chainId
			});
		}
	}

	if (transactionData.blockNumber) {
		details.push({
			name: 'Block',
			value: transactionData.blockNumber.toString(),
			isCopyable: true
		});
	}

	// 5. Addresses
	if (transactionData.senderAddress) {
		details.push({
			name: 'Sender',
			value: transactionData.senderAddress,
			isCopyable: true
		});
	}

	if (transactionData.receiverAddress) {
		details.push({
			name: 'Receiver',
			value: transactionData.receiverAddress,
			isCopyable: true
		});
	}

	return (
		<div className="mt-4">
			<InfoBox details={details} />
		</div>
	);
}
