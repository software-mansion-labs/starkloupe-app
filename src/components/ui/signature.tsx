import { ContractCall } from '@/lib/simulation';
import { getContractName, shortenHash } from '@/lib/utils';

export function ContractCallSignature({
	contractCall,
	displayContractName = true,
	displayFunctionName = true,
	variant = 'trace-line'
}: {
	contractCall: ContractCall;
	displayContractName?: boolean;
	displayFunctionName?: boolean;
	variant?: 'trace-line' | 'search-result';
}) {
	const contractName = getContractName({ contractCall });
	return (
		<>
			{displayContractName && (
				<span className={`${variant === 'search-result' ? '' : 'text-classGreen'}`}>
					{contractName}
				</span>
			)}
			{displayFunctionName && (
				<>
					{displayContractName && displayFunctionName && <> {'.'}</>}

					<span className={`${variant === 'search-result' ? '' : 'text-function_purple'}`}>
						{contractCall?.entryPointName ??
							shortenHash(contractCall.entryPoint.entryPointSelector, 13)}
					</span>
				</>
			)}
		</>
	);
}
