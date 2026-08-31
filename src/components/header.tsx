'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import { Search } from '@/components/ui/search';
import { Button } from '@/components/ui/button';
import { PlayIcon, MoonIcon, SunIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import logoWalnut from '@/assets/walnut-logo-beta.svg';
import logoWalnutWhite from '@/assets/walnut-logo-beta-white.svg';
import starknetLogo from '@/assets/network-logos/strk.svg';
import { Container } from '@/components/ui/container';
import { useSettings } from '@/lib/context/settings-context-provider';
import { useTheme } from 'next-themes';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from './ui/dropdown-menu';
import { useEffect, useState } from 'react';

export function HeaderNav({ isMainPage = false }: { isMainPage?: boolean }) {
	const { trackingActive } = useSettings();
	const { setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const Icon = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon;

	return (
		<Disclosure as="nav" className={`${!isMainPage && 'bg-background  border-b border-border'}`}>
			{({ open }) => (
				<>
					{!trackingActive && (
						<div className=" top-0 left-0 w-full h-5 bg-green-500 text-white flex items-center justify-between px-4 shadow-md z-50">
							<div className="text-sm font-semibold">NO TRACKING</div>
						</div>
					)}
					<Container>
						<div className="flex h-16 items-center justify-between">
							{!isMainPage && (
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0">
										<Link href="/">
											<Image
												src={logoWalnut}
												alt="Starkloupe logo"
												unoptimized
												className="h-6 w-auto cursor-pointer dark:hidden"
											/>
											<Image
												src={logoWalnutWhite}
												alt="Starkloupe logo"
												unoptimized
												className="h-6 w-auto cursor-pointer hidden dark:block"
											/>
										</Link>
									</div>
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
									<div className="hidden md:block">
										<nav className="ml-10 flex items-center space-x-4 lg:space-x-6">
											{/* {session.status === 'authenticated' ? (
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
										)} */}
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
							)}

							<div className="flex flex-1 justify-end space-x-2 lg:space-x-4 mx-4 md:mr-0">
								{!isMainPage && (
									<div className="w-auto max-w-xs md:w-80">
										<Search className="w-full" placeholder="Search"></Search>
									</div>
								)}
								<div className="hidden md:block">
									<Link href={`/simulate-transaction`}>
										<Button variant="outline">
											<PlayIcon className="mr-2 h-4 w-4" /> Simulate transaction
										</Button>
									</Link>
								</div>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									{mounted && (
										<button
											className="
											p-2 hover:bg-accent rounded-sm ml-3
											focus:outline-none focus:ring-0
											focus-visible:outline-none focus-visible:ring-0
										"
										>
											<Icon className="w-[1.2rem] h-[1.2rem]" />
										</button>
									)}
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

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
					</Container>

					<Disclosure.Panel className="md:hidden fixed bg-neutral-50 inset-x-0 z-50 border-b border-t shadow-md border-neutral-200">
						<div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
							<div>
								<Link href={`/simulate-transaction`}>
									<Button variant="ghost"> Simulate transaction</Button>
								</Link>
							</div>
							<div>
								<a href="/settings">
									<Button variant="ghost">Settings</Button>
								</a>
							</div>
						</div>
					</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	);
}
