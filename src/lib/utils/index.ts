import { type ClassValue, clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import {
	ContractCall,
	SimulationPayloadWithCalldata,
	TransactionSimulationResult
} from '../simulation';
import { ChainId } from '../types';
export * from './fetch';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function copyToClipboard(text: string): void {
	navigator.clipboard.writeText(text).then(
		function () {
			console.log('Copying to clipboard was successful!');
		},
		function (err) {
			console.error('Could not copy text: ', err);
		}
	);
}

export function shortenHash(hash: string, length = 13) {
	if (!hash) return '';
	if (hash.length <= length) return hash;
	length = Math.round((length - 5) / 2);
	return hash.substring(0, length + 2) + '...' + hash.substring(hash.length - length);
}

export function hexToNumber(hexString: string): number {
	return parseInt(hexString, 16);
}

export function hexToText(hex: string): string {
	let text = '';
	for (let i = 0; i < hex.length; i += 2) {
		text += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}
	return text;
}

export function isHexFormat(value: string): boolean {
	return typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value);
}

export function isDecimalFormat(value: string): boolean {
	return typeof value === 'string' && /^[0-9]+$/.test(value);
}

export function formatTimestamp(timestamp: number): string {
	let dateObject = new Date(timestamp * 1000);

	let formatDate =
		dateObject.getFullYear() +
		'-' +
		('0' + (dateObject.getMonth() + 1)).slice(-2) +
		'-' +
		('0' + dateObject.getDate()).slice(-2) +
		' ' +
		('0' + dateObject.getHours()).slice(-2) +
		':' +
		('0' + dateObject.getMinutes()).slice(-2);

	return formatDate;
}

export function formatTimestampToUTC(timestamp: number): string {
	let dateObject = new Date(timestamp * 1000);
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23',
		timeZone: 'UTC',
		timeZoneName: 'short'
	};

	const formatter = new Intl.DateTimeFormat('en-GB', options);
	return formatter.format(dateObject);
}

export function useChain(): { chainId: ChainId; chainName: string } {
	const path = usePathname();
	const isSepolia = path.includes('SN_SEPOLIA');
	const chainId = isSepolia ? ChainId.SEPOLIA : ChainId.MAIN;
	return { chainId, chainName: isSepolia ? 'Sepolia' : 'Mainnet' };
}

export function extractChainId(chainIdStr: string): ChainId | undefined {
	switch (chainIdStr) {
		case ChainId.MAIN:
			return ChainId.MAIN;
		case ChainId.SEPOLIA:
			return ChainId.SEPOLIA;
		default:
			return undefined;
	}
}

export function extractSimulationPayloadWithCalldata(
	searchParams: URLSearchParams
): SimulationPayloadWithCalldata | undefined {
	const senderAddress = searchParams.get('senderAddress');
	const calldata = searchParams.get('calldata');
	const blockNumber = searchParams.get('blockNumber');
	const transactionVersion = searchParams.get('transactionVersion');
	const nonce = searchParams.get('nonce');
	const rpcUrl = searchParams.get('rpcUrl');
	const chainId = searchParams.get('chainId');

	if ((rpcUrl || chainId) && senderAddress && calldata && transactionVersion) {
		const result: SimulationPayloadWithCalldata = {
			senderAddress,
			calldata: parseCalldata(calldata),
			transactionVersion: parseInt(transactionVersion),
			nonce: nonce ? parseInt(nonce) : undefined,
			rpcUrl: rpcUrl ?? undefined,
			chainId: chainId ?? undefined
		};
		if (blockNumber) {
			result.blockNumber = parseInt(blockNumber);
		}
		return result;
	}
}

export function openSimulationPage(simulationPayload: SimulationPayloadWithCalldata) {
	const params = new URLSearchParams({
		senderAddress: simulationPayload.senderAddress,
		calldata: simulationPayload.calldata.join(','),
		transactionVersion: simulationPayload.transactionVersion.toString()
	});
	if (simulationPayload.blockNumber !== undefined)
		params.set('blockNumber', simulationPayload.blockNumber.toString());
	if (simulationPayload.nonce !== undefined)
		params.set('nonce', simulationPayload.nonce.toString());
	if (simulationPayload.chainId) params.set('chainId', simulationPayload.chainId);
	if (simulationPayload.rpcUrl) params.set('rpcUrl', simulationPayload.rpcUrl);
	window.location.href = `/simulations?${params.toString()}`;
}

export function parseCalldata(calldata: string): string[] {
	return calldata.split(',');
}

export const getContractName = ({ contractCall }: { contractCall: ContractCall }) => {
	let contractName: string | undefined = undefined;
	if (contractCall.contractName) {
		contractName = contractCall.contractName;
	} else if (contractCall.erc20TokenName || contractCall.erc20TokenSymbol) {
		contractName = [contractCall.erc20TokenName, `(${contractCall.erc20TokenSymbol})`].join(' ');
	} else if (contractCall.entryPointInterfaceName) {
		contractName = contractCall.entryPointInterfaceName.split('::').pop();
	}

	if (!contractName) {
		contractName = shortenHash(contractCall.entryPoint.storageAddress, 13);
	}
	return contractName;
};

export function getRawFunctionName(fnName: string): string {
	if (!fnName) return '';
	let rawFnName = fnName.replace(/::?<([^<>]*)>/g, '');
	while (/<[^<>]*>/g.test(rawFnName)) {
		rawFnName = rawFnName.replace(/::?<([^<>]*)>/g, '');
	}
	return rawFnName.replace(/::$/, '');
}
