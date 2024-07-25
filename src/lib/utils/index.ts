import { type ClassValue, clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { CallTrace } from '../simulation';
import { TransactionSimulationResult } from '@/lib/simulation';
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

type ChainId = 'SN_MAIN' | 'SN_SEPOLIA';

export function useChain(): { chainId: ChainId; chainName: string } {
	const path = usePathname();
	const isSepolia = path.includes('SN_SEPOLIA');
	const chainId = isSepolia ? 'SN_SEPOLIA' : 'SN_MAIN';
	return { chainId, chainName: isSepolia ? 'Sepolia' : 'Mainnet' };
}

export function addCairoLocationsToContractCalls(calls: CallTrace[]) {
	for (const call of calls) {
		if (call.fnCalls[0] && call.fnCalls[0].nestedCalls.length > 0) {
			const wrapper = call.fnCalls[0];
			if (!wrapper) continue;
			const entryPointFunction = wrapper.nestedCalls[1];
			if (!entryPointFunction) continue;
			call.additionalInfo.cairoLocation = entryPointFunction.data.cairoLocation ?? undefined;
		}
		addCairoLocationsToContractCalls(call.nestedCalls);
	}
}

export function hardcodeCairoLocationsForTheDemo(simResult: TransactionSimulationResult) {
	if (simResult.simulationResult.executionResult.executionStatus === 'SUCCEEDED') {
		const classesDebuggerData =
			simResult.simulationResult.simulationDebuggerData.classesDebuggerData;
		let isBeerContract = false;
		Object.keys(classesDebuggerData).forEach((key) => {
			const classDebuggerData = classesDebuggerData[key];
			Object.keys(classDebuggerData.sourceCode).forEach((file) => {
				const code = classDebuggerData.sourceCode[file];
				if (code.includes('impl IBeerImpl of super::IBeer<ContractState>')) {
					isBeerContract = true;
				}
			});
		});
		if (isBeerContract) {
			const callDebuggerData =
				simResult.simulationResult.callTrace.nestedCalls[0].additionalInfo.callDebuggerData;
			if (callDebuggerData && callDebuggerData.executionTrace.length === 10) {
				callDebuggerData.executionTrace.splice(callDebuggerData.executionTrace.length - 1, 0, {
					withLocation: { sierraIndex: 434, results: [], arguments: [] }
				});
			}
		}
	}
}
