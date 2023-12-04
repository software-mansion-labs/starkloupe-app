'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

export default function LayoutClientContainer() {
	useEffect(() => {
		if (process.env.NEXT_PUBLIC_POSTHOG_TOKEN) {
			posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN, {
				api_host: 'https://eu.posthog.com'
			});
		}
	}, []);
	return <></>;
}
