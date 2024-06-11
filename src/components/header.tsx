'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import { Search } from '@/components/ui/search';
import { Button } from '@/components/ui/button';
import { Bars3Icon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import logoWalnut from '@/assets/walnut.svg';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { SimulateDialog } from './simulate-dialog';

export function HeaderNav() {
	const session = useSession();
	const pathname = usePathname();

	return (
		<Disclosure as="nav" className="bg-neutral-50 border-b border-neutral-200">
			{({ open }) => (
				<>
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="flex h-16 items-center justify-between">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-8 w-auto" />
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
										{/* <Link
											href="/transactions/SN_MAIN"
											className={`text-sm font-medium transition-colors hover:text-primary ${
												pathname.startsWith('/transactions') ? '' : 'text-muted-foreground'
											}`}
										>
											Transactions
										</Link> */}
									</nav>
								</div>
							</div>
							<div className="flex flex-1 justify-end space-x-2 lg:space-x-4 mx-4 md:mr-0">
								<div className="w-auto max-w-xs md:max-w-sm">
									<Search
										className="w-full"
										placeholder="Search for transaction"
										isChainSelector
									></Search>
								</div>
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
							{/* <div className="hidden md:block">
								<div className="ml-4 flex items-center md:ml-6">
									<div className="flex flex-row items-center ml-3">
										<UserAvatar />
									</div>
								</div>
							</div> */}
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
							<Button variant="ghost">Simulate transaction</Button>
						</div>
						{/* <div className="border-t border-neutral-100 pb-3 pt-4">
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
								// <Button onClick={() => signIn('cognito')} className="mx-5">
								// 	Log in
								// </Button>
								<></>
							) : (
								<></>
							)}
						</div> */}
					</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	);
}
