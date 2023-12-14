'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { UserAvatar } from '@/components/user-avatar';

export function IndexNav() {
	const session = useSession();
	return (
		<div className="absolute top-4 right-4 gap-2 flex flex-row">
			{session.status === 'authenticated' ? (
				<a href="/simulations">
					<Button variant="link">Monitoring</Button>
				</a>
			) : (
				<></>
			)}
			<UserAvatar />
		</div>
	);
}
