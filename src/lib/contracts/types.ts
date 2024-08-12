export interface ContractResponseWithSourceCode {
	chainId: string;
	classHash: string;
	isClassVerified: boolean;
	sourceCode: { [key: string]: string } | undefined;
}
