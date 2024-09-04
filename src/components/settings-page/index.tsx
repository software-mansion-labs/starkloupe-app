'use client';

import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import Link from 'next/link';
import { CircleUser, Menu, Package2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NetworksList } from './networks-list';

export function SettingsPage() {
	return (
		<>
			<HeaderNav />
			<div className="flex min-h-screen w-full flex-col">
				<main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
					<div className="mx-auto grid w-full max-w-6xl gap-2">
						<h1 className="text-3xl font-semibold">Settings</h1>
					</div>
					<div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
						<nav
							className="grid gap-4 text-sm text-muted-foreground"
							x-chunk="dashboard-04-chunk-0"
						>
							<Link href="#" className="font-semibold text-primary">
								Custom networks
							</Link>
							<span>More settings coming soon...</span>
						</nav>
						<div className="grid gap-6">
							<Card x-chunk="dashboard-04-chunk-1">
								<CardHeader>
									<CardTitle>Custom networks</CardTitle>
									<CardDescription>
										By default, Walnut supports <strong>sn_main</strong> and{' '}
										<strong>sn_sepolia</strong>. You can add custom networks to expand transaction
										search, debugging, and simulation functionality to those networks.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<NetworksList />
								</CardContent>
								{/* <CardFooter className="border-t px-6 py-4">
									<Button>Save</Button>
								</CardFooter> */}
							</Card>
						</div>
					</div>
				</main>
			</div>
		</>
	);
}
