import { SIMULATIONS_API_URL } from '@/lib/config';
import { getSessionToken } from '@/lib/auth';

interface FetchApiParams {
	init?: RequestInit | undefined;
	data?: unknown;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	apiUrl?: string;
	queryParams?: { [key: string]: string | number };
}

export function makeApiRequest(input: string, params?: FetchApiParams) {
	const apiUrl = params?.apiUrl ?? SIMULATIONS_API_URL;
	input = apiUrl + input;
	const body = params?.data ? JSON.stringify(params?.data) : params?.init?.body;
	const method = params?.method ?? params?.init?.method ?? 'GET';
	let headers: HeadersInit = { 'Content-Type': 'application/json', ...params?.init?.headers };
	const authToken = getSessionToken();
	if (authToken)
		headers = {
			Authorization: `Bearer ${authToken}`,
			...headers
		};
	let queryString = '';
	if (method === 'GET' && params?.queryParams) {
		queryString = `?${Object.entries(params?.queryParams)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			.join('&')}`;
	}
	const init: RequestInit | undefined = {
		...params?.init,
		body: method !== 'GET' ? body : undefined,
		headers,
		method
	};
	return fetch(input + queryString, init);
}

export async function fetchApi<ResponseDataType>(input: string, params?: FetchApiParams) {
	const response = await makeApiRequest(input, params);
	if (!response.ok) throw Error(await response.text());
	else return response.json() as Promise<ResponseDataType>;
}

export async function safeFetchApi<ResponseDataType>(input: string, params?: FetchApiParams) {
	const response = await makeApiRequest(input, params);
	if (!response.ok) return { error: await response.text() };
	else return { data: response.json() as Promise<ResponseDataType> };
}
