import { Footer } from '@/components/footer';
import { HeaderNav } from '@/components/header';
import { Container } from '@/components/ui/container';

export const runtime = 'edge';

export default async function Page() {
	return (
		<>
			<HeaderNav />
			<main>
				<Container>
					<div className={`bg-white border-x border-b shadow-sm border-neutral-200 p-4 pb-0`}>
						<h1 className="text-xl font-medium leading-6 mb-4">Transactions</h1>
						<p>Use search bar at the top right to get details about a transaction.</p>
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}
