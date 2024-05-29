import { EntryPoint } from '@/lib/simulation';

const classNames: { [key: string]: string } = {
	'0x816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253': 'Braavos',
	'0x239b6f9eeb5ffba1df4da7f33e116d3603d724283bc01338125eed82964e729': 'carmine_protocol::IAMM',
	'0x5e269051bec902aa2bd421d348e023c3893c4ff93de6c5f4b8964cd67cc3fc5': 'Pragma: Oracle'
};
const contractNames: { [key: string]: string } = {
	'0x47472e6755afc57ada9550b6a3ac93129cc4b5f98f51c73e0644d129fd208d9': 'carmine_protocol::IAMM',
	'0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b': 'Pragma: Oracle'
};
const entrypointFunctionNames: { [key: string]: string } = {
	'0x16d9d5d83f8eecc5d7450519aad7e6e649be1a6c9d6df85bd0b177cc59a926a': 'get_decimals',
	'0x3fa2ea83f0780e0525f99583b868dd6a31fc799b6a9dbc30c1a8bb00bca1c3d': 'get_last_checkpoint_before',
	'0x35a73cd311a05d46deda634c5ee045db92f811b4e74bca4437fcb5302b7af33': 'balance_of',
	'0x1bc8eacc8f2e975145f89ebf776c3ff8bb857d34bdb69a855bff1a230af2c08': 'base_token_address'
};

export function getEntryPointNames(entrypoint: EntryPoint) {
	return {
		contractName:
			contractNames[entrypoint.storageAddress] ?? classNames[entrypoint.classHash] ?? null,
		entryPointFunctionName: entrypointFunctionNames[entrypoint.entryPointSelector] ?? null
	};
}
