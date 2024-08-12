import { ChainId } from '@/lib/types';
import { fetchApi } from '@/lib/utils';
import { ContractResponseWithSourceCode } from '.';

export async function fetchContractDataByAddress({
	chainId,
	contractAddress,
	includeSourceCode
}: {
	chainId: ChainId;
	contractAddress: string;
	includeSourceCode: boolean;
}): Promise<ContractResponseWithSourceCode> {
	const contractData = await fetchApi<ContractResponseWithSourceCode>(
		`/v1/${chainId}/contracts/${contractAddress}?include_source_code=${includeSourceCode}`,
		{
			renameToCamelCase: true
		}
	);
	return contractData;
}
