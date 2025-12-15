import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Router middleware. Configure here URLs to which user has/not have access (logged/not logged).
 */
export async function middleware(request: NextRequest) {
	const sessionCookie = request.cookies.get(
		`${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}better-auth.session_token`
	);
	const isLogged = !!sessionCookie;

	const openPageOrGoToLoginIfNotLogged = async (url: URL) => {
		return isLogged
			? NextResponse.next()
			: NextResponse.redirect(
					`${
						process.env.NODE_ENV === 'production'
							? 'https://app.walnut.dev'
							: 'http://localhost:5173'
					}/login`
			  );
	};
	const url = new URL(request.url);
	switch (url.pathname) {
		case '/':
		case '/settings':
			return openPageOrGoToLoginIfNotLogged(url);
		default: {
			if (url.pathname.startsWith('/monitoring')) {
				return openPageOrGoToLoginIfNotLogged(url);
			}
			return NextResponse.next();
		}
	}
}
