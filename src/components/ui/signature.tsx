import { CallTrace } from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';

export function ContractCallSignature({ contractCall }: { contractCall: CallTrace }) {
	let contractName: string | undefined = undefined;
	if (contractCall.additionalInfo.contractName) {
		contractName = contractCall.additionalInfo.contractName;
	} else if (
		contractCall.additionalInfo.erc20TokenName ||
		contractCall.additionalInfo.erc20TokenSymbol
	) {
		contractName = [
			contractCall.additionalInfo.erc20TokenName,
			`(${contractCall.additionalInfo.erc20TokenSymbol})`
		].join(' ');
	} else if (contractCall.additionalInfo.entryPointInterfaceName) {
		contractName = contractCall.additionalInfo.entryPointInterfaceName.split('::').pop();
	}

	if (!contractName) {
		contractName = shortenHash(contractCall.entryPoint.storageAddress, 13);
	}

	return (
		<>
			<span className="text-blue-600">{contractName}</span>
			{'.'}
			<span className="text-pink-500">
				{contractCall.additionalInfo?.entryPointFunctionName ??
					shortenHash(contractCall.entryPoint.entryPointSelector, 13)}
			</span>
		</>
	);
}
