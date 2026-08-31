import React from 'react';
import { WALNUT_VERIFY_DOCS_URL } from '@/lib/config';

export const NoCodeLocationMessage = () => (
	<>
		There are no code locations present for this call. It might be a bug; Please{' '}
		<a
			href="https://t.me/starkloupe"
			target="_blank"
			className="text-blue-500 cursor-pointer underline"
			rel="noreferrer"
		>
			contact us
		</a>{' '}
		to resolve it.
	</>
);

export const NoCodeMessage = () => (
	<>
		This contract source code is not verified. To run the debugger, first verify the source code by
		following{' '}
		<a
			href={WALNUT_VERIFY_DOCS_URL}
			target="_blank"
			className="text-blue-500 cursor-pointer"
			rel="noreferrer"
		>
			this guide
		</a>
		.
	</>
);
