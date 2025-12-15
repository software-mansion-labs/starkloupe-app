export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.walnut.dev';
export const WALNUT_VERIFY_DOCS_URL =
	'https://docs.walnut.dev/overview/verify-starknet-contracts-in-walnut';
export const VERIFY_URL =
	process.env.NODE_ENV === 'production'
		? 'https://verify.walnut.dev'
		: 'http://verify.walnut.local';
export const REPO_URL =
	process.env.NODE_ENV === 'production' ? 'https://repo.walnut.dev' : 'http://repo.walnut.local';
