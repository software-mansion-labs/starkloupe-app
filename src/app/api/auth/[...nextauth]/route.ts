import NextAuth from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';
import * as jose from 'jose';

export const runtime = 'edge';

const dev = process.env.NODE_ENV !== 'production';

const { handlers } = NextAuth({
	trustHost: true,
	cookies: {
		sessionToken: {
			name: 'session-token',
			options: dev
				? { httpOnly: false, sameSite: 'Lax', path: '/', secure: false }
				: {
						httpOnly: true,
						sameSite: 'None', // Changed from 'Lax' to 'None' to allow cross-origin requests
						path: '/',
						secure: true, // This must be set to true if sameSite is 'None'
						domain: '.walnut.dev' // Optionally specify the domain to include subdomains
				  }
		}
	},
	session: { strategy: 'jwt' },
	secret: process.env.NEXTAUTH_SECRET as string,
	providers: [
		CognitoProvider({
			clientId: process.env.COGNITO_CLIENT_ID as string,
			clientSecret: process.env.COGNITO_CLIENT_SECRET as string,
			issuer: process.env.COGNITO_ISSUER
		})
	],
	callbacks: {
		async jwt({ token, profile }) {
			token.projects = token.projects ?? profile?.['cognito:groups'];
			return token;
		}
	},
	jwt: {
		async decode(params) {
			const { token, secret, salt } = params;
			if (!token) return null;
			const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
			return payload as any;
		},
		async encode(params) {
			const DEFAULT_MAX_AGE = 2592000;
			const { token = {}, secret, maxAge = DEFAULT_MAX_AGE, salt } = params;
			const iat = Math.floor(Date.now() / 1000);
			const exp = Math.floor(Date.now() / 1000) + maxAge;
			return new jose.SignJWT(token)
				.setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
				.setExpirationTime(exp)
				.setIssuedAt(iat)
				.setNotBefore(iat)
				.sign(new TextEncoder().encode(secret));
		}
	}
});

export const GET = handlers.GET;
export const POST = handlers.POST;
