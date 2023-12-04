import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import LayoutClientContainer from './layout-client-container';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Walnut',
	description: 'Transaction debugger for Starknet'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full ">
			<LayoutClientContainer />
			<body className={`${inter.className} h-full`}>
				<div className="min-h-full">{children}</div>
			</body>
		</html>
	);
}
