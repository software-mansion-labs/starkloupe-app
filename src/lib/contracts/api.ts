import { fetchApi } from '@/lib/utils';
import { GetContractResponse } from '.';

export async function fetchContractDataByAddress({
	contractAddress,
	includeSourceCode,
	rpcUrls
}: {
	contractAddress: string;
	includeSourceCode: boolean;
	rpcUrls: string[];
}): Promise<GetContractResponse> {
	const queryParams: Record<string, string> = {
		include_source_code: includeSourceCode ? 'true' : 'false'
	};
	if (rpcUrls.length > 0) {
		queryParams.rpc_urls = rpcUrls.join(',');
	}
	const contractData = await fetchApi<GetContractResponse>(`/v1/contracts/${contractAddress}`, {
		renameToCamelCase: true,
		queryParams
	});
	return contractData;
}
