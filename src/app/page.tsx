'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/footer';
import Image from 'next/image';
import logoWalnut from '@/assets/walnut.svg';
import { Search } from '@/components/ui/search';
import { IndexNav } from '@/components/index-page/index-nav';
import { useSession } from 'next-auth/react';

export default function Page() {
	const { status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'authenticated') {
			router.push('/monitoring');
		}
	}, [status, router]);

	return (
		<div className="min-h-screen flex flex-col">
			<main className="overflow-hidden flex flex-col items-center justify-center gap-10 flex-auto relative">
				<IndexNav />
				<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-10 w-auto" />
				<Search
					className="w-[38rem] max-w-[92%]"
					placeholder="Search for any starknet transaction"
					isTxSearch
					isSearchButton
				></Search>
			</main>
			{/* <div onClick={() => signIn()}>Login</div> */}
			<Footer />
		</div>
	);
}
