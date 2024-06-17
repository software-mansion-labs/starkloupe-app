import { type ClassValue, clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { CallTrace } from '../simulation';
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

type ChainId = 'SN_MAIN' | 'SN_GOERLI';

export function useChain(): { chainId: ChainId; chainName: string } {
	const path = usePathname();
	const isGoerli = path.includes('SN_GOERLI');
	const chainId = isGoerli ? 'SN_GOERLI' : 'SN_MAIN';
	return { chainId, chainName: isGoerli ? 'Testnet' : 'Mainnet' };
}

export function addCairoLocationsToContractCalls(calls: CallTrace[]) {
	for (const call of calls) {
		if (call.internalFnCallTrace && call.internalFnCallTrace.nestedCalls.length > 0) {
			const wrapper = call.internalFnCallTrace;
			if (!wrapper) continue;
			const entryPointFunction = wrapper.nestedCalls[1];
			if (!entryPointFunction) continue;
			call.additionalInfo.cairoLocations = entryPointFunction.data.cairoLocations;
		}
		addCairoLocationsToContractCalls(call.nestedCalls);
	}
}

export function padHexString(hexString: string) {
	const targetLength = 66; // The target length of the string
	const prefix = '0x'; // The prefix to be included in the length

	// Remove the prefix if it exists
	if (hexString.startsWith(prefix)) {
		hexString = hexString.slice(2);
	}

	// Pad the string with zeros at the start
	hexString = hexString.padStart(targetLength - prefix.length, '0');

	// Add the prefix back
	hexString = prefix + hexString;

	return hexString;
}
