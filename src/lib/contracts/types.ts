export interface Source {
	chainId?: string;
	rpcUrl?: string;
	value: string;
}

export interface GetContractResponse {
	verified: boolean;
	deployedSources: Source[];
	cairoVersion: string;
	classHash: string;
	sourceCode?: Record<string, string>;
}
