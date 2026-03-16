import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

const isProduction = !!process.env.BETTER_AUTH_URL?.includes('app.walnut.dev');

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-key-change-in-production',
	baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5173',
	trustedOrigins: isProduction ? ['*.walnut.dev'] : [],
	advanced: {
		crossSubDomainCookies: {
			enabled: isProduction,
			domain: 'walnut.dev'
		}
	},
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: true
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60
		}
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!
		}
	},
	plugins: [],
	logger: {
		level: 'debug',
		log: (level: string, message: string, ...args: any[]) => {
			console.log(`[Better Auth ${level.toUpperCase()}]`, message, ...args);
		}
	}
});
