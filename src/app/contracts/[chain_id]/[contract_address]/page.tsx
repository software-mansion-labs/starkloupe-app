import { ContractPage } from '@/components/contract-page';

export const runtime = 'edge';

export default async function Page({
	params
}: {
	params: { chain_id: string; contract_address: string };
}) {
	return <ContractPage chainId={params.chain_id} contractAddress={params.contract_address} />;
}
