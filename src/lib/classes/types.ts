export interface Source {
	chainId?: string;
	rpcUrl?: string;
	value: string;
}

export interface GetClassResponse {
	verified: boolean;
	declaredSources: Source[];
	sourceCode?: Record<string, string>;
}

export interface ContractNetwork {
	ChainId?: string;
	RpcUrl?: string;
}

export interface ContractItem {
	address: string;
	deployment_time: string;
	networks: ContractNetwork[];
}

export interface GetClassContractsResponse {
	class_hash: string;
	total_count: number;
	contracts: ContractItem[];
}
