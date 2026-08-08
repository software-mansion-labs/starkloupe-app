import { SimulationResponse, Transaction, SearchDataResponse } from '@/lib/types';
import { fetchApi } from '@/lib/utils';
import { API_URL } from '@/lib/config';
import { ContractItem, GetClassContractsResponse } from './classes';

export async function fetchSearchData({
	hash,
	rpcUrls
}: {
	hash: string;
	rpcUrls?: string[];
}): Promise<SearchDataResponse> {
	const queryParams: { rpc_urls?: string } = {};
	if (rpcUrls && rpcUrls.length > 0) queryParams.rpc_urls = rpcUrls.join(',');
	const searchDataResponse = await fetchApi<SearchDataResponse>(`/v1/search/${hash}`, {
		queryParams,
		renameToCamelCase: true
	});
	return searchDataResponse;
}

export async function fetchClassContracts(classHash: string): Promise<ContractItem[]> {
	const res = await fetch(`${API_URL}/v1/classes/${classHash}/contracts`);
	if (!res.ok) throw new Error('Failed to fetch data');
	const data = (await res.json()) as GetClassContractsResponse;
	return data.contracts || [];
}

export async function fetchSimulation(simulationId: string) {
	const res = await fetch(`${API_URL}/simulation/${simulationId}`);
	if (!res.ok) throw new Error('Failed to fetch data');
	return (await res.json()) as SimulationResponse;
}

export async function fetchTransaction(chainId: string, txHash: string) {
	const res = await fetch(`${API_URL}/${chainId}/tx/${txHash}`);
	if (!res.ok) throw new Error('Failed to fetch data');
	return (await res.json()) as Transaction;
}
