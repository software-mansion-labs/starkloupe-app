import { EntryPoint } from '@/lib/simulation';

const classNames: { [key: string]: string } = {
	'0x816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253': 'Braavos',
	'0x1e60c8722677cfb7dd8dbea5be86c09265db02cdfe77113e77da7d44c017388': 'Openzeppelin'
};
const contractNames: { [key: string]: string } = {
	'0xae1a37094caf0697f008f78d6c7641b0f90f1d5ebbceea2ffb5841d0490627': 'Beer'
};
const entrypointFunctionNames: { [key: string]: string } = {};

export function getEntryPointNames(entrypoint: EntryPoint) {
	return {
		contractName:
			contractNames[entrypoint.storageAddress] ?? classNames[entrypoint.classHash] ?? null,
		entryPointFunctionName: entrypointFunctionNames[entrypoint.entryPointSelector] ?? null
	};
}
