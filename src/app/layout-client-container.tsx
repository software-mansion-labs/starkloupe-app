'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function LayoutClientContainer() {
	const session = useSession();
	useEffect(() => {
		if (session.status === 'authenticated') {
			const email = session.data.user?.email;
			if (email) {
				posthog.identify(email);
			}
		}
	}, [session]);

	useEffect(() => {
		if (process.env.NEXT_PUBLIC_POSTHOG_TOKEN) {
			posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN, {
				api_host: 'https://eu.posthog.com'
			});
		}
	}, []);
	return <></>;
}
