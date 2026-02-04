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
	source?: string;
	sourceCode?: Record<string, string>;
	abi: string;
}

export interface FunctionInput {
	name: string;
	type: string;
	struct_members?: FunctionInput[];
	enum_variants?: FunctionInput[];
	circular_reference_to?: string;
}
export interface FunctionOutput {
	type: string;
	name?: string;
	struct_members?: FunctionInput[];
	enum_variants?: FunctionInput[];
	circular_reference_to?: string;
}

export interface FunctionData {
	name: string;
	inputs: FunctionInput[];
	outputs: FunctionOutput[];
	state_mutability: string;
}

type Selector = string;

export type EntryPointItem = [Selector, FunctionData];

export interface ContractFunctions {
	entry_point_datas: EntryPointItem[];
}
