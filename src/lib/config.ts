export const API_URL =
	process.env.NEXT_PUBLIC_LOCAL_API === 'true'
		? 'http://127.0.0.1:8080'
		: 'https://xyz.joinwido.com';

export const SIMULATIONS_API_URL =
	process.env.NEXT_PUBLIC_LOCAL_API === 'true' ? 'http://127.0.0.1:3000' : '';
