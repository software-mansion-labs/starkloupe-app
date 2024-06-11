import { SimulationPage } from '@/components/simulation-page';

export const runtime = 'edge';

export default async function Page({ params }: { params: { chain_id: string } }) {
	return <SimulationPage chainId={params.chain_id} />;
}
