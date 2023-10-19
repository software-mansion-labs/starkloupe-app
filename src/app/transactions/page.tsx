import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SideNav } from '@/components/side-nav'
import { Container } from '@/components/ui/container'

export default async function Page() {
	return (
		<>
			<Header />
			<Container className="flex-auto flex flex-row gap-10 w-full">
				<SideNav></SideNav>
				<main className="overflow-hidden">
					<div>Transactions page</div>
				</main>
			</Container>
			<Footer />
		</>
	)
}
