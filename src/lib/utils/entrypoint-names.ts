import { EntryPoint } from '@/lib/simulation';

const classNames: { [key: string]: string } = {
	'0x816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253': 'Braavos',
	'0x1e60c8722677cfb7dd8dbea5be86c09265db02cdfe77113e77da7d44c017388': 'Openzeppelin',
	'0x29927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b': 'Argent',
	'0x22cd64e6cfb008cd8eec024f15c43f7c88278c00fa3c76519512bd12d21021a': 'Beer'
};
const contractNames: { [key: string]: string } = {
	'0xae1a37094caf0697f008f78d6c7641b0f90f1d5ebbceea2ffb5841d0490627': 'Beer',
	'0x4d1f96a986f746d6e7bb3f0820516a65f5ef3e82abe59a955477f52660b0b16': 'BeerToken'
};
const entrypointFunctionNames: { [key: string]: string } = {};

export function getEntryPointNames(entrypoint: EntryPoint) {
	return {
		contractName:
			contractNames[entrypoint.storageAddress] ?? classNames[entrypoint.classHash] ?? null,
		entryPointFunctionName: entrypointFunctionNames[entrypoint.entryPointSelector] ?? null
	};
}
