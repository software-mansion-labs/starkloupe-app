'use client';

import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworksList } from './networks-list';
import { Footer } from '../footer';

export function SettingsPage() {
	return (
		<>
			<HeaderNav />

			<main className="overflow-y-auto flex-grow">
				<Container className="max-w-6xl mx-auto pt-6 pb-4">
					<h1 className="text-3xl font-semibold mb-8">Settings</h1>
					<div className="grid w-full items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
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
							</Card>
						</div>
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}
