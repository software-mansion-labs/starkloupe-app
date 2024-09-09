import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NextAuthProvider from '@/lib/context/NextAuthProvider';
import LayoutClientContainer from './layout-client-container';
import { SettingsProvider } from '@/lib/context/settings-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Walnut',
	description: 'Transaction debugger for Starknet'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full ">
			<body className={`${inter.className} h-full`}>
				<NextAuthProvider>
					<SettingsProvider>
						<LayoutClientContainer />
						<div className="h-screen flex flex-col">{children}</div>
					</SettingsProvider>
				</NextAuthProvider>
			</body>
		</html>
	);
}
