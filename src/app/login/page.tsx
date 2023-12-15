'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signIn, useSession } from 'next-auth/react';

export const runtime = 'edge';

export default function Page({ params }: { params: { team_id: string } }) {
	const { status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'authenticated') {
			router.push('/simulations');
		} else if (status === 'unauthenticated') {
			signIn('cognito');
		}
	}, [status, router]);

	return <div className="text-center pt-20">Loading...</div>;
}
