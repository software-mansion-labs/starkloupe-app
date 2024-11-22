import { ChainId } from '@/lib/types';
import { fetchApi } from '@/lib/utils';
import { ContractResponseWithSourceCode } from '.';

export async function fetchContractDataByAddress({
	chainId,
	rpcUrl,
	contractAddress,
	includeSourceCode
}: {
	chainId?: ChainId;
	rpcUrl?: string;
	contractAddress: string;
	includeSourceCode: boolean;
}): Promise<ContractResponseWithSourceCode> {
	const queryParams: Record<string, string> = {
		include_source_code: includeSourceCode ? 'true' : 'false'
	};
	if (chainId) {
		queryParams.chain_id = chainId;
	}
	if (rpcUrl) {
		queryParams.rpc_url = rpcUrl;
	}
	const contractData = await fetchApi<ContractResponseWithSourceCode>(
		`/v1/contracts/${contractAddress}`,
		{
			queryParams,
			renameToCamelCase: true
		}
	);
	return contractData;
}
