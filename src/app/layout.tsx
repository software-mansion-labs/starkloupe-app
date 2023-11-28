import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import posthog from 'posthog-js';

if (process.env.NEXT_PUBLIC_POSTHOG_TOKEN) {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN, {
		api_host: 'https://eu.posthog.com'
	});
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Walnut',
	description: 'Transaction debugger for Starknet'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={`${inter.className} min-h-screen flex flex-col`}>{children}</body>
		</html>
	);
}
