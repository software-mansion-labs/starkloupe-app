import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const COOKIE_NAME = 'auth_preview_origin';

function isOriginAllowed(origin: string): boolean {
	const proxyUrl = process.env.NEXT_PUBLIC_PREVIEW_AUTH_PROXY_URL;
	if (!proxyUrl) return false;
	const proxyHostname = new URL(proxyUrl).hostname;
	try {
		const { hostname } = new URL(origin);
		return hostname === 'localhost' || hostname.endsWith(`.${proxyHostname}`);
	} catch {
		return false;
	}
}

export async function GET(request: NextRequest) {
	const origin = request.cookies.get(COOKIE_NAME)?.value;

	if (!origin) {
		return new NextResponse(
			'No preview origin found. Please start the sign-in flow from the preview app.',
			{ status: 400 }
		);
	}

	if (!isOriginAllowed(origin)) {
		return new NextResponse('Origin not allowed', { status: 403 });
	}

	const url = new URL(request.url);
	const targetUrl = `${origin}/api/auth/callback/github${url.search}`;

	const response = NextResponse.redirect(targetUrl);
	response.cookies.set(COOKIE_NAME, '', {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 0
	});

	return response;
}
