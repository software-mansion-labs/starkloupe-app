import { ContractCall } from '@/lib/simulation';
import { getContractName, shortenHash } from '@/lib/utils';
import AddressLink from '../address-link';

export function ContractCallSignature({
	contractCall,
	displayContractName = true,
	displayFunctionName = true,
	variant = 'trace-line',
	updateContractName,
	updateContractColor,
	customSettings,
	updateContractSettings,
	isActiveDropdown = true
}: {
	contractCall: ContractCall;
	displayContractName?: boolean;
	displayFunctionName?: boolean;
	variant?: 'trace-line' | 'search-result';
	updateContractName?: (contractAddress: string, newContractCallName: string) => void;
	updateContractColor?: (contractAddress: string, color: string) => void;
	customSettings?: { [key: string]: { name: string | null; color: string | null } };
	updateContractSettings?: (
		contractAddress: string,
		settings: { name?: string | null; color?: string | null } | null
	) => void;
	isActiveDropdown?: boolean;
}) {
	const contractName = getContractName({ contractCall });
	const contractAddress = contractCall?.entryPoint.storageAddress;

	return (
		<>
			{displayContractName && (
				<AddressLink
					address={contractAddress}
					customSettings={customSettings}
					updateContractColor={updateContractColor}
					updateContractName={updateContractName}
					updateContractSettings={updateContractSettings}
					addressClassName={`${
						variant === 'search-result' ? '' : 'text-classGreen'
					} px-0.5 hover:underline cursor-pointer`}
					isActiveDropdown={isActiveDropdown}
				>
					{contractName}
				</AddressLink>
			)}
			{displayContractName && displayFunctionName && '.'}
			{displayFunctionName && (
				<span className={`${variant === 'search-result' ? '' : 'text-function_purple'}`}>
					{contractCall?.entryPointName ??
						shortenHash(contractCall.entryPoint.entryPointSelector, 13)}
				</span>
			)}
		</>
	);
}
