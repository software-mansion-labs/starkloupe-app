export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.starkloupe.co';
export const WALNUT_VERIFY_DOCS_URL = 'https://docs.walnut.dev/verification/verify-starknet';
export const REPO_URL =
	process.env.NODE_ENV === 'production' ? 'https://repo.walnut.dev' : 'http://repo.walnut.local';
