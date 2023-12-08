import { Footer } from '@/components/footer';
import Image from 'next/image';
import logoWalnut from '@/assets/walnut.svg';
import { Search } from '@/components/ui/search';
import { UserAvatar } from '@/components/user-avatar';

export default function Page() {
	return (
		<div className="min-h-screen flex flex-col">
			<main className="overflow-hidden flex flex-col items-center justify-center gap-10 flex-auto relative">
				<div className="absolute top-4 right-4">
					<UserAvatar />
				</div>
				<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-10 w-auto" />
				<Search
					className="w-[38rem] max-w-[92%]"
					placeholder="Search for any starknet transaction"
					isTxSearch
				></Search>
			</main>
			{/* <div onClick={() => signIn()}>Login</div> */}
			<Footer />
		</div>
	);
}
