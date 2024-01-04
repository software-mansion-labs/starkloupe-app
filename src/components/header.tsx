'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import { Search } from '@/components/ui/search';
import { Button } from '@/components/ui/button';
import { Bars3Icon, XMarkIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import logoWalnut from '@/assets/walnut.svg';
import { useSession, signOut, signIn } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { UserAvatar } from './user-avatar';
import { usePathname } from 'next/navigation';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger
} from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useChain } from '@/lib/utils';

export function HeaderNav() {
	const session = useSession();
	const pathname = usePathname();
	const router = useRouter();

	const { chainId, chainName } = useChain();

	function changeChainId(id: string) {
		if (id === chainId) return;
		router.push(`/transactions/${id}`);
	}

	return (
		<Disclosure as="nav" className="bg-neutral-50 border-b border-neutral-200">
			{({ open }) => (
				<>
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="flex h-16 items-center justify-between">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									{/* <Link href="/"> */}
									<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-8 w-auto" />
									{/* </Link> */}
								</div>
								<div className="hidden md:block">
									<nav className="ml-10 flex items-center space-x-4 lg:space-x-6">
										{session.status === 'authenticated' ? (
											<Link
												href="/monitoring"
												className={`text-sm font-medium transition-colors hover:text-primary ${
													pathname.startsWith('/monitoring') ? '' : 'text-muted-foreground'
												}`}
											>
												Monitoring
											</Link>
										) : (
											<></>
										)}
										<Link
											href="/transactions/SN_MAIN"
											className={`text-sm font-medium transition-colors hover:text-primary ${
												pathname.startsWith('/transactions') ? '' : 'text-muted-foreground'
											}`}
										>
											Transactions
										</Link>
									</nav>
								</div>
							</div>
							<div className="flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end gap-2">
								<div className="w-full max-w-lg lg:max-w-xs">
									<Search className="w-full" placeholder="Search for transaction"></Search>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="relative pr-10 min-w-[7rem]">
											{chainName} <ChevronUpDownIcon className="w-5 h-5 absolute right-2" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-56">
										<DropdownMenuRadioGroup value={chainId} onValueChange={changeChainId}>
											<DropdownMenuRadioItem value="SN_MAIN">Mainnet</DropdownMenuRadioItem>
											<DropdownMenuRadioItem value="SN_GOERLI">Testnet</DropdownMenuRadioItem>
										</DropdownMenuRadioGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="hidden md:block">
								<div className="ml-4 flex items-center md:ml-6">
									<div className="flex flex-row items-center ml-3">
										<UserAvatar />
									</div>
								</div>
							</div>
							<div className="-mr-2 flex md:hidden">
								{/* Mobile menu button */}
								<Disclosure.Button>
									{open ? (
										<XMarkIcon className="block h-6 w-6" aria-hidden="true" />
									) : (
										<Bars3Icon className="block h-6 w-6" aria-hidden="true" />
									)}
								</Disclosure.Button>
							</div>
						</div>
					</div>

					<Disclosure.Panel className="md:hidden fixed bg-neutral-50 inset-x-0 z-50 border-b border-neutral-200">
						<div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
							{session.status === 'authenticated' ? (
								<Link href="/monitoring">
									<Button variant="ghost">Monitoring</Button>
								</Link>
							) : (
								<></>
							)}
						</div>
						<div className="border-t border-neutral-100 pb-3 pt-4">
							{session.status === 'authenticated' ? (
								<div className="flex items-center px-5 justify-between">
									<div className="flex flex-row items-center">
										<div className="flex-shrink-0">
											<Avatar>
												{session.data.user?.image && <AvatarImage src={session.data.user.image} />}
												<AvatarFallback>AA</AvatarFallback>
											</Avatar>
										</div>
										<div className="ml-3">
											<div className="text-base font-medium">{session.data.user?.name}</div>
											<div className="text-sm font-medium text-secondary-foreground/80">
												{session.data.user?.email}
											</div>
										</div>
									</div>
									<Disclosure.Button className="ml-2">
										<Button variant="outline" onClick={() => signOut()}>
											Log out
										</Button>
									</Disclosure.Button>
								</div>
							) : session.status === 'unauthenticated' ? (
								<Button onClick={() => signIn('cognito')} className="mx-5">
									Log in
								</Button>
							) : (
								<></>
							)}
						</div>
					</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	);
}
