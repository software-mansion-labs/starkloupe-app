import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/solid';
import { githubSignOut } from '@/components/auth/sign-out-server-action';
import {
	Cog6ToothIcon,
	PlayIcon,
	MoonIcon,
	SunIcon,
	DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { navigation } from '../footer';

const UserAvatarDropdown = ({ avatarSrc, userName }: { avatarSrc?: string; userName: string }) => {
	const { theme, setTheme } = useTheme();
	return (
		<div className="text-left flex w-full">
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger>
					<Avatar className="h-8 w-8">
						<AvatarImage src={avatarSrc} />
						<AvatarFallback>{userName?.charAt(0) ?? 'U'}</AvatarFallback>
					</Avatar>
				</DropdownMenuTrigger>

				<DropdownMenuContent className="w-56 mr-4 sm:mr-6 lg:mr-8">
					<div className="px-2 py-1.5">
						<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</p>
					</div>
					<Link href={`/simulate-transaction`}>
						<DropdownMenuItem className="cursor-pointer">
							<PlayIcon className="mr-2 h-4 w-4" />
							<span>Simulate transaction</span>
						</DropdownMenuItem>
					</Link>
					<Link href="/settings">
						<DropdownMenuItem className="cursor-pointer">
							<Cog6ToothIcon className="mr-2 h-4 w-4" />
							<span>Settings</span>
						</DropdownMenuItem>
					</Link>

					<DropdownMenuSeparator />
					<div className="px-2 py-1.5">
						<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Links</p>
					</div>
					{navigation.map((item) => (
						<a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer">
							<DropdownMenuItem className="cursor-pointer">
								<item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
								<span>{item.name}</span>
							</DropdownMenuItem>
						</a>
					))}

					<DropdownMenuSeparator />

					<div className="px-2 py-1.5">
						<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Theme</p>
					</div>
					<DropdownMenuItem
						onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
						className="cursor-pointer"
					>
						{theme === 'dark' ? (
							<SunIcon className="mr-2 h-4 w-4" />
						) : (
							<MoonIcon className="mr-2 h-4 w-4" />
						)}
						<span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
						<DevicePhoneMobileIcon className="mr-2 h-4 w-4" />
						<span>System theme</span>
					</DropdownMenuItem>

					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => githubSignOut()}
						className="cursor-pointer text-red-600 focus:text-red-600"
					>
						<ArrowRightEndOnRectangleIcon className="mr-2 h-4 w-4" />
						<span>Log out</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default UserAvatarDropdown;
