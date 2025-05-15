import { useSettings } from '@/lib/context/settings-context-provider';
import { formatTimestampToUTC } from '@/lib/utils';
import { InfoBox, InfoBoxItem } from '../ui/info-box';

export function TransactionDetails({
	transactionData,
	rpcUrl
}: {
	transactionData: L2TransactionData;
	rpcUrl?: string;
}) {
	const { getNetworkByRpcUrl } = useSettings();
	let details: InfoBoxItem[] = [];

	// 1. Transaction Type (always first)
	if (transactionData.transactionType) {
		details.push({
			name: 'Transaction Type',
			value: <span className="text-blue-600">{transactionData.transactionType}</span>,
			isCopyable: true
		});
	}

	// 2. Execution Status
	if (transactionData.simulationResult) {
		const { executionStatus, revertReason } = transactionData.simulationResult.executionResult;
		details.push({
			name: 'Execution status',
			value: (
				<span className={executionStatus === 'SUCCEEDED' ? 'text-green-600' : 'text-red-600'}>
					{executionStatus === 'SUCCEEDED'
						? executionStatus
						: `${executionStatus}: "${revertReason}"`}
				</span>
			)
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
		details.push({
			name: 'Chain',
			value: transactionData.chainId
		});
	}

	if (transactionData.blockNumber) {
		const isSimulatedRevert =
			transactionData.simulationResult &&
			transactionData.simulationResult.executionResult.executionStatus === 'REVERTED' &&
			transactionData.l1TxHash;

		details.push({
			name: isSimulatedRevert ? 'Simulated at block' : 'Block',
			value: transactionData.blockNumber.toString(),
			isCopyable: true
		});
	}

	// 5. Position in block
	if (transactionData.totalTransactionsInBlock) {
		const index = transactionData.transactionIndexInBlock + 1;
		const suffix =
			index % 100 >= 11 && index % 100 <= 13
				? 'th'
				: index % 10 === 1
				? 'st'
				: index % 10 === 2
				? 'nd'
				: index % 10 === 3
				? 'rd'
				: 'th';

		details.push({
			name: 'Position in block',
			value: `${index}${suffix} out of ${transactionData.totalTransactionsInBlock}`
		});
	}

	// 6. Timestamp
	if (transactionData.blockTimestamp) {
		details.push({
			name: 'Timestamp',
			value: formatTimestampToUTC(transactionData.blockTimestamp)
		});
	}

	// 7. Addresses
	if (transactionData.senderAddress) {
		details.push({
			name: 'Sender',
			value: transactionData.senderAddress,
			isCopyable: true
		});
	}

	// 8. Transaction details
	if (transactionData.nonce) {
		details.push({
			name: 'Nonce',
			value: transactionData.nonce.toString()
		});
	}

	// 9. Transaction version
	if (transactionData.transactionVersion) {
		details.push({
			name: 'Transaction Version',
			value: transactionData.transactionVersion.toString()
		});
	}
	return (
		<div className="mt-4">
			<InfoBox details={details} />
		</div>
	);
}
