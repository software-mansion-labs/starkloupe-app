'use client';

import { ContractPage } from '@/components/contract-page';
import { extractChainId } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

export const runtime = 'edge';

export default function Page({ params }: { params: { contract_address: string } }) {
	const searchParams = useSearchParams();

	const rpcUrl = searchParams.get('rpcUrl') ?? undefined;
	const chainIdStr = searchParams.get('chainId');
	const chainId = chainIdStr ? extractChainId(chainIdStr) : undefined;

	if (!rpcUrl && !chainId) {
		return <div>Page not found</div>;
	}

	return (
		<ContractPage chainId={chainId} rpcUrl={rpcUrl} contractAddress={params.contract_address} />
	);
}
