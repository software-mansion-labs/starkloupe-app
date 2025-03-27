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
import { Cog6ToothIcon, PlayIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const UserAvatarDropdown = ({ avatarSrc, userName }: { avatarSrc?: string; userName: string }) => {
	return (
		<div className=" text-left flex w-full">
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger>
					<Avatar className="h-8 w-8">
						<AvatarImage src={avatarSrc} />
						<AvatarFallback>{userName?.charAt(0) ?? 'U'}</AvatarFallback>
					</Avatar>
				</DropdownMenuTrigger>

				<DropdownMenuContent className="md:w-40 w-screen">
					<DropdownMenuItem
						onClick={() => (window.location.href = `/simulate-transaction`)}
						className="cursor-pointer"
					>
						<PlayIcon className="mr-2 h-4 w-4" />
						<span>Simulate transaction</span>
					</DropdownMenuItem>
					<Link href="/settings">
						<DropdownMenuItem className="cursor-pointer">
							<Cog6ToothIcon className="mr-1 h-4 w-4" />
							<span>Settings</span>
						</DropdownMenuItem>
					</Link>
					<DropdownMenuItem onClick={() => githubSignOut()} className="cursor-pointer">
						<ArrowRightEndOnRectangleIcon className="mr-1 h-4 w-4"></ArrowRightEndOnRectangleIcon>
						<span>Log out</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default UserAvatarDropdown;
