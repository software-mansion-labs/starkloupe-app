import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SideNav } from '@/components/side-nav'
import Transaction from '@/components/transaction'
import { Container } from '@/components/ui/container'

export const runtime = 'edge'

export default async function Page({ params }: { params: { chain_id: number; tx_hash: string } }) {
	return (
		<>
			<Header />
			<Container className="flex-auto flex flex-row gap-10 w-full pb-10">
				<SideNav></SideNav>
				<main className="overflow-hidden">
					<Transaction chainId={params.chain_id} txHash={params.tx_hash}></Transaction>
				</main>
			</Container>
			<Footer />
		</>
	)
}
