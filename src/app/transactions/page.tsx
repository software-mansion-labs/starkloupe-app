'use client';

import { TransactionPage } from '@/components/transaction-page';
import { extractChainId } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

export const runtime = 'edge';

export default function Page() {
	const searchParams = useSearchParams();

	const txHash = searchParams.get('txHash');
	const chainIdStr = searchParams.get('chainId');
	const rpcUrl = searchParams.get('rpcUrl');

	if (txHash && chainIdStr) {
		const chainId = extractChainId(chainIdStr);
		return <TransactionPage txHash={txHash} chainId={chainId} />;
	} else if (txHash && rpcUrl) {
		return <TransactionPage txHash={txHash} rpcUrl={rpcUrl} />;
	} else {
		return <div>Page not found</div>;
	}
}
