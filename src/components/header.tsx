'use client'

import Image from 'next/image'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { Popover, Transition } from '@headlessui/react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

// import { Button } from '@/components/Button'
import { Container } from '@/components/ui/container'
// import { NavLink } from '@/components/NavLink'

import logoWalnut from '@/assets/walnut.svg'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Popover.Button as={Link} href={href} className="block w-full p-2">
			{children}
		</Popover.Button>
	)
}

function MobileNavIcon({ open }: { open: boolean }) {
	return (
		<svg aria-hidden="true" className="h-3.5 w-3.5 overflow-visible stroke-slate-700" fill="none" strokeWidth={2} strokeLinecap="round">
			<path d="M0 1H14M0 7H14M0 13H14" className={clsx('origin-center transition', open && 'scale-90 opacity-0')} />
			<path d="M2 2L12 12M12 2L2 12" className={clsx('origin-center transition', !open && 'scale-90 opacity-0')} />
		</svg>
	)
}

function MobileNavigation() {
	return (
		<Popover>
			<Popover.Button className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none" aria-label="Toggle Navigation">
				{({ open }) => <MobileNavIcon open={open} />}
			</Popover.Button>
			<Transition.Root>
				<Transition.Child
					as={Fragment}
					enter="duration-150 ease-out"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="duration-150 ease-in"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<Popover.Overlay className="fixed inset-0 bg-slate-300/50" />
				</Transition.Child>
				<Transition.Child
					as={Fragment}
					enter="duration-150 ease-out"
					enterFrom="opacity-0 scale-95"
					enterTo="opacity-100 scale-100"
					leave="duration-100 ease-in"
					leaveFrom="opacity-100 scale-100"
					leaveTo="opacity-0 scale-95"
				>
					<Popover.Panel
						as="div"
						className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5"
					>
						<MobileNavLink href="#features">Features</MobileNavLink>
						<MobileNavLink href="#testimonials">Testimonials</MobileNavLink>
						<MobileNavLink href="#pricing">Pricing</MobileNavLink>
						<hr className="m-2 border-slate-300/40" />
						<MobileNavLink href="/login">Sign in</MobileNavLink>
					</Popover.Panel>
				</Transition.Child>
			</Transition.Root>
		</Popover>
	)
}

export function Header() {
	const router = useRouter()
	const [searchValue, setSearchValue] = useState('')

	function search() {
		if (searchValue && searchValue.trim().length > 0) router.push(`/tx/1/${searchValue}`)
	}

	return (
		<header className="py-10">
			<Container>
				<nav className="relative z-50 flex justify-between">
					<div className="flex items-center md:gap-x-12 relative z-50">
						<Link href="/" aria-label="Home">
							<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-10 w-auto" />
						</Link>
					</div>
					<div className="relative z-0 flex flex-1 items-center justify-center px-2 sm:absolute sm:inset-0">
						<div className="w-full sm:max-w-sm">
							<label htmlFor="search" className="sr-only">
								Search
							</label>
							<div className="relative">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
								</div>
								<Input
									className="pl-10"
									placeholder="Search for any transaction"
									type="search"
									name="search"
									value={searchValue}
									onInput={(e) => setSearchValue(e.currentTarget.value)}
									onKeyDown={(e) => e.key === 'Enter' && search()}
								/>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-x-5 md:gap-x-8">
						<div className="hidden md:flex md:gap-x-6">
							{/* <NavLink href="#features">Features</NavLink>
							<NavLink href="#request-access">Request access</NavLink> */}
							<Avatar>
								<AvatarImage src="https://github.com/shadcn.png" />
								<AvatarFallback>CN</AvatarFallback>
							</Avatar>
						</div>
						<div className="-mr-1 md:hidden">
							<MobileNavigation />
						</div>
					</div>
				</nav>
			</Container>
		</header>
	)
}
