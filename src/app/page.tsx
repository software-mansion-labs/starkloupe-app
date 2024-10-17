'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/footer';
import Image from 'next/image';
import logoWalnut from '@/assets/wlnt-logo-beta-bw.svg';
import { Search } from '@/components/ui/search';
import { IndexNav } from '@/components/index-page/index-nav';
// import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SimulateDialog } from '@/components/simulate-dialog';
import { Button } from '@/components/ui/button';
import { PlayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Container } from '@/components/ui/container';

export default function Page() {
	// const { status } = useSession();
	// const router = useRouter();

	// useEffect(() => {
	// 	if (status === 'authenticated') {
	// 		router.push('/monitoring');
	// 	}
	// }, [status, router]);

	return (
		<div className="min-h-screen flex flex-col">
			<Container>
				<div className="flex h-16 items-center justify-between">
					<div className="flex flex-1 justify-end space-x-2 lg:space-x-4 mx-4 md:mr-0">
						<div className="hidden md:block">
							<SimulateDialog
								dialogTrigger={
									<Button variant="outline">
										<PlayIcon className="mr-2 h-4 w-4" /> Simulate transaction
									</Button>
								}
							/>
						</div>
					</div>
					<div className="hidden md:block -mr-2">
						<div className="flex items-center">
							<div className="flex flex-row items-center ml-3">
								<a href="/settings">
									<Button variant="ghost" className="px-2">
										<Cog6ToothIcon className="h-6 w-6" />
									</Button>
								</a>
							</div>
						</div>
					</div>
				</div>
			</Container>
			<main className="overflow-hidden flex flex-col items-center justify-center gap-10 flex-auto relative">
				{/* <IndexNav /> */}
				<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-10 w-auto" />
				<div className="w-[38rem] max-w-[92%] text-center">
					<Search placeholder={`Search for transaction or contract`}></Search>
					<Link
						href="/transactions?chainId=SN_SEPOLIA&txHash=0x05c131a5809010a0d22baf1ddf063396c5941e8a4b8e2c3819c8a6faedbcabef"
						className="hover:underline text-sm inline-block mt-4 text-gray-500"
					>
						Try an example transaction.
					</Link>
				</div>
			</main>
			<Footer />
		</div>
	);
}
