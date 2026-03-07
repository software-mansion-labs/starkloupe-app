'use client';

export const runtime = 'edge';

import { Suspense } from 'react';
import { TransactionPage } from '@/components/transaction-page';
import { extractChainId } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

function TransactionsContent() {
	const searchParams = useSearchParams();

	const txHash = searchParams.get('txHash');
	const chainIdStr = searchParams.get('chainId');
	let rpcUrl = searchParams.get('rpcUrl');

	// TODO: Fix this on Dojo side and remove this
	if (rpcUrl && !isValidUrl(rpcUrl)) {
		rpcUrl = decodeURIComponent(rpcUrl);
	}

	if (txHash && chainIdStr) {
		const chainId = extractChainId(chainIdStr);
		return <TransactionPage txHash={txHash} chainId={chainId} />;
	} else if (txHash && rpcUrl) {
		return <TransactionPage txHash={txHash} rpcUrl={rpcUrl} />;
	} else {
		return <div>Page not found</div>;
	}
}

export default function Page() {
	return (
		<Suspense>
			<TransactionsContent />
		</Suspense>
	);
}

const isValidUrl = (urlString: string) => {
	try {
		new URL(urlString);
		return true;
	} catch (e) {
		return false;
	}
};
