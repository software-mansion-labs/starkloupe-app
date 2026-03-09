import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const COOKIE_NAME = 'auth_preview_origin';
const COOKIE_MAX_AGE = 600; // 10 minutes

const ALLOWED_PAGES_DEV_PROJECT = 'walnut-webapp.pages.dev';

function isOriginAllowed(origin: string): boolean {
	const proxyUrl = process.env.NEXT_PUBLIC_PREVIEW_AUTH_PROXY_URL;
	if (!proxyUrl) return false;
	const proxyHostname = new URL(proxyUrl).hostname;
	try {
		const { hostname } = new URL(origin);
		if (hostname === 'localhost' || hostname === proxyHostname) return true;
		if (hostname.endsWith(`.${proxyHostname}`)) return true;
		if (hostname.endsWith(`.${ALLOWED_PAGES_DEV_PROJECT}`)) return true;
		return false;
	} catch {
		return false;
	}
}

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const origin = url.searchParams.get('origin');
	const returnUrl = url.searchParams.get('return');

	if (!origin || !returnUrl) {
		return new NextResponse('Missing origin or return parameter', { status: 400 });
	}

	if (!isOriginAllowed(origin)) {
		return new NextResponse('Origin not allowed', { status: 403 });
	}

	const response = NextResponse.redirect(returnUrl);
	response.cookies.set(COOKIE_NAME, origin, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: COOKIE_MAX_AGE
	});

	return response;
}
