'use client';

export const runtime = 'edge';

import { Footer } from '@/components/footer';
import Image from 'next/image';
import logoLightBg from '@/assets/starkloupe-logo-light-bg.svg';
import { Search } from '@/components/ui/search';
import Link from 'next/link';
import { HeaderNav } from '@/components/header';
import logoDarkBg from '@/assets/starkloupe-logo-dark-bg.svg';
import starknetLogo from '@/assets/network-logos/strk.svg';
import { useRouter } from 'next/navigation';

export default function Page() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex flex-col">
			<HeaderNav isMainPage={true} />
			<main className="overflow-hidden flex flex-col items-center justify-center flex-auto relative">
				<div className="relative w-[38rem] max-w-[92%] text-center">
					<div className="absolute bottom-full left-0 right-0 mb-10 flex items-start justify-center gap-3">
						<Image
							src={logoLightBg}
							alt="Starkloupe logo"
							unoptimized
							className="h-24 w-auto dark:hidden"
						/>
						<Image
							src={logoDarkBg}
							alt="Starkloupe logo"
							unoptimized
							className="h-24 w-auto hidden dark:block"
						/>
						<div
							className="
								hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-full
								bg-gradient-to-r from-purple-500/10 to-pink-500/10
								border border-purple-500/30
							"
						>
							<div className="relative w-3 h-3 flex-shrink-0">
								<Image
									src={starknetLogo}
									alt="Starknet"
									className="w-full h-full object-contain"
									unoptimized
								/>
							</div>
							<span className="text-[10px] font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
								Starknet (CairoVM)
							</span>
						</div>
					</div>
					<Search placeholder={`Search for transaction or contract`}></Search>
					<Link
						href="/transactions?chainId=SN_SEPOLIA&txHash=0x3a96fd05defd943c9e9daeff4a8ab052bbda38db340e327924d47253babe014"
						className="absolute top-full left-0 right-0 mt-4 hover:underline text-sm text-gray-500"
					>
						Try an example transaction.
					</Link>
				</div>
			</main>
			<Footer />
		</div>
	);
}
