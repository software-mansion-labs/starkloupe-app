import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Router middleware. Configure here URLs to which user has/not have access (logged/not logged).
 */
export async function middleware(request: NextRequest) {
	if (process.env.TEST_USER || process.env.NEXT_PUBLIC_TEST_USER) {
		return NextResponse.next();
	}

	const isSecure = request.url.startsWith('https://');
	const sessionCookie = request.cookies.get(
		`${isSecure ? '__Secure-' : ''}better-auth.session_token`
	);
	const isLogged = !!sessionCookie;

	const openPageOrGoToLoginIfNotLogged = async (url: URL) => {
		return isLogged
			? NextResponse.next()
			: NextResponse.redirect(new URL('/login', request.url));
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
