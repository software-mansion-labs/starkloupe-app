'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import logoWalnutWhite from '@/assets/walnut-white.svg';
import logoWalnut from '@/assets/walnut.svg';
import { SignUpWithGithubButton } from '@/components/auth/sign-up-with-github-button';
import { useUserContext } from '@/lib/context/user-context-provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export const runtime = 'edge';

export default function Page() {
	const { isLogged } = useUserContext();
	const router = useRouter();
	useEffect(() => {
		if (isLogged) {
			router.push('/');
		}
	}, [isLogged, router]);
	return (
		<>
			<div
				className="container relative h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
				<div className="relative h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex hidden">
					<div className="absolute inset-0 bg-zinc-900"/>
					<div className="relative z-20 flex items-center text-lg font-medium">
						<Image src={logoWalnutWhite} alt="Walnut logo" unoptimized className="h-10 w-auto"/>
					</div>
					<div className="relative z-20 mt-auto">
						<blockquote className="space-y-2">
							<p className="text-lg">
								We’re building Walnut to help smart contract developers like you create better, more resilient applications on Starknet.
								If there’s anything we can assist with, don’t hesitate to reach out—we’re here for you.
							</p>
							<footer className="text-sm text-white flex items-center">
								<Avatar className="h-8 w-8">
									<AvatarImage src="https://pbs.twimg.com/profile_images/1165175389133688832/J6fWCiVz_400x400.jpg"/>
									<AvatarFallback>Roman Mazur</AvatarFallback>
								</Avatar>
								<Link href="https://x.com/romanmazur" className="ml-2">
									<span>Roman Mazur - Walnut CEO</span>
								</Link>
							</footer>
						</blockquote>
					</div>
				</div>
				<div className="flex items-center justify-center min-h-screen p-4 lg:p-8">
					<div className="mx-auto flex w-full flex-col justify-center items-center space-y-3 sm:w-[450px]">
						<Image src={logoWalnut} alt="Walnut logo" unoptimized className="h-10 w-auto lg:hidden"/>
						<div className="flex flex-col space-y-2 text-center">
							<h1 className="text-2xl font-semibold tracking-tight">
								Sign up to Walnut
							</h1>
							<p className="text-md text-muted-foreground">
								Please sign up with Github and start debugging
							</p>
						</div>
						<div className="flex flex-col">
							<SignUpWithGithubButton/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
