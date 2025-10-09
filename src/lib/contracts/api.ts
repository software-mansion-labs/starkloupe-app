import { fetchApi } from '@/lib/utils';
import { ContractFunctions, GetContractResponse } from '.';

export interface FunctionParameter {
	name: string;
	type_name: string;
	value: string;
}

export interface DecodedContractCall {
	contract_address: string;
	function_selector: string;
	function_name: string;
	parameters: FunctionParameter[];
}

export interface StarknetTransactionData {
	decoded_calldata: DecodedContractCall[];
	raw_calldata: string[];
	num_calls: number;
	transaction_version: number;
	network: string;
	sender_address: string;
	block_number: number;
}

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

export async function fetchContractFunctions({
	contractAddress,
	network
}: {
	contractAddress: string;
	network: string;
}) {
	const contractData = await fetchApi<ContractFunctions>(
		`/v1/contracts/${contractAddress}/entrypoints?chain_id=${network}`
	);
	return contractData;
}

export async function fetchContractDecodeCalldata({
	tx_hash,
	sender_address,
	calldata,
	transaction_version,
	block_number,
	chain_id
}: {
	tx_hash?: string;
	sender_address: string;
	calldata: string;
	transaction_version: number;
	block_number: number;
	chain_id: string;
}): Promise<StarknetTransactionData> {
	const data: any = { sender_address, calldata, transaction_version, block_number, chain_id };
	if (tx_hash) {
		data.tx_hash = tx_hash;
	}
	const contractData = await fetchApi(`/v1/decode-calldata`, {
		method: 'POST',
		data
	});
	return contractData as StarknetTransactionData;
}
