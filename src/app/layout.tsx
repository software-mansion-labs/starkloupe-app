import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SettingsContextProvider } from '@/lib/context/settings-context-provider';
import { Toaster } from '@/components/ui/toaster';
import { UserContextProvider } from '@/lib/context/user-context-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Walnut',
	description: 'Transaction debugger for Starknet'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full ">
			<body className={`${inter.className} h-full`}>
				<UserContextProvider>
					<SettingsContextProvider>
						<div className="flex flex-col w-full min-h-screen">{children}</div>
					</SettingsContextProvider>
					<Toaster />
				</UserContextProvider>
			</body>
		</html>
	);
}
