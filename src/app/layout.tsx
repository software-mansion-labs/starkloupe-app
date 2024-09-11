import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import LayoutClientContainer from './layout-client-container';
import { SettingsContextProvider } from '@/lib/context/settings-context-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Walnut',
	description: 'Transaction debugger for Starknet'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full ">
			<body className={`${inter.className} h-full`}>
				<SettingsContextProvider>
					<LayoutClientContainer />
					<div className="h-screen flex flex-col">{children}</div>
				</SettingsContextProvider>
			</body>
		</html>
	);
}
