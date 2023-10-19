'use client'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from './ui/button'
import { HomeIcon } from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'

export function SideNav() {
	const pathname = usePathname()

	const pages = [
		{ name: 'Home', path: '/', icon: HomeIcon },
		{ name: 'Transaction', path: '/transactions', path2: '/tx', icon: HomeIcon },
		{ name: 'Wallets', path: '/wallets', icon: HomeIcon },
		{ name: 'Simulator', path: '/simulator', icon: HomeIcon },
		{ name: 'Contracts', path: '/contracts', icon: HomeIcon },
	]

	return (
		<Card className="px-2 py-6 rounded-md flex flex-col gap-1 w-60 min-w-[15rem] self-start">
			{pages.map((page) => {
				const Icon = page.icon
				return (
					<Link href={page.path} className="w-full" key={page.name}>
						<Button
							variant={'ghost'}
							className={`justify-start w-full pl-6 ${pathname === page.path || (page.path2 && pathname.startsWith(page.path2)) ? 'bg-muted' : ''}`}
						>
							{/* <Icon className="w-4 h-4 mr-1 text-muted-foreground" /> */}
							{page.name}
						</Button>
					</Link>
				)
			})}
		</Card>
	)
}
