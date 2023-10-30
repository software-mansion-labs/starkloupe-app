import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import clsx from 'clsx';
import { Popover, Transition } from '@headlessui/react';
import { Container } from '@/components/ui/container';
import { Search } from '@/components/ui/search';
import { Button } from '@/components/ui/button';
import { LinkIcon } from '@heroicons/react/20/solid';
import { copyToClipboard } from '@/lib/utils';
import logoWalnut from '@/assets/walnut.svg';

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Popover.Button as={Link} href={href} className="block w-full p-2">
			{children}
		</Popover.Button>
	);
}

function MobileNavIcon({ open }: { open: boolean }) {
	return (
		<svg
			aria-hidden="true"
			className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
			fill="none"
			strokeWidth={2}
			strokeLinecap="round"
		>
			<path
				d="M0 1H14M0 7H14M0 13H14"
				className={clsx('origin-center transition', open && 'scale-90 opacity-0')}
			/>
			<path
				d="M2 2L12 12M12 2L2 12"
				className={clsx('origin-center transition', !open && 'scale-90 opacity-0')}
			/>
		</svg>
	);
}

function MobileNavigation() {
	return (
		<Popover>
			<Popover.Button
				className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none"
				aria-label="Toggle Navigation"
			>
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
	);
}

export function Header() {
	return (
		<header className="py-10">
			<Container>
				<nav className="relative z-50 flex justify-between gap-6">
					<div className="flex items-center md:gap-x-12 relative z-50">
						<Link href="/" aria-label="Home">
							<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-10 w-auto" />
						</Link>
					</div>
					<div className="relative z-0 md:flex-1 items-center justify-center md:px-2 md:absolute md:inset-0 hidden md:flex">
						<Search
							className="lg:w-[38rem] md:w-[28rem] w-full"
							placeholder="Search for any starknet transaction"
						></Search>
					</div>
					<div className="flex items-center gap-x-5 md:gap-x-8 flex-auto md:flex-none">
						<div className="relative z-10 hidden md:flex md:gap-x-6">
							<Button variant="outline" onClick={() => copyToClipboard(window.location.href)}>
								<LinkIcon className="w-4 h-4 mr-1" /> Copy Link
							</Button>
						</div>
						<div className="-mr-1 md:hidden flex-auto">
							<Search className="w-full" placeholder="Search for transaction"></Search>
						</div>
					</div>
				</nav>
			</Container>
		</header>
	);
}
