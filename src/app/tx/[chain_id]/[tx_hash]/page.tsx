import { TransactionPage } from '@/components/transaction-page';

export const runtime = 'edge';

export default async function Page({ params }: { params: { chain_id: number; tx_hash: string } }) {
	return <TransactionPage chainId={params.chain_id} txHash={params.tx_hash} />;
}
