import { Footer } from '@/components/footer';
import Image from 'next/image';
import logoWalnut from '@/assets/walnut.svg';
import { Search } from '@/components/ui/search';

export default async function Page() {
	return (
		<div className="min-h-screen flex flex-col">
			<main className="overflow-hidden flex flex-col items-center justify-center gap-10 flex-auto">
				<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-10 w-auto" />
				<Search
					className="w-[38rem] max-w-[92%]"
					placeholder="Search for any starknet transaction"
					isTxSearch
				></Search>
			</main>
			<Footer />
		</div>
	);
}
