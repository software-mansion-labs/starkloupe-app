import { ChainId } from '@/lib/types';
import { fetchApi } from '@/lib/utils';
import { TransactionSimulationResult } from './types';
import { CallTrace, InternalFnCallTrace } from '@/lib/simulation';
export * from './types';

export async function simulateTransactionByHash({
	chainId,
	txHash
}: {
	chainId: ChainId;
	txHash: string;
}): Promise<TransactionSimulationResult> {
	const transactionSimulationResult = await fetchApi<TransactionSimulationResult>(
		`/v1/${chainId}/simulate-transaction/${txHash}`,
		{
			renameToCamelCase: true
		}
	);
	addHardcodedPanicResult([transactionSimulationResult.simulationResult.callTrace]);
	return transactionSimulationResult;
}

// TODO: remove this function
function addHardcodedPanicResult(calls: CallTrace[]): boolean {
	for (let i = 0; i < calls.length; i++) {
		const call = calls[i];
		if (call.additionalInfo.errorMessage) {
			if (call.internalFnCallTrace) {
				return addHardcodedPanicResultInternalFnCalls([call.internalFnCallTrace]);
			}
			break;
		} else {
			const isAdded = addHardcodedPanicResult(call.nestedCalls);
			if (isAdded) return true;
		}
	}
	return false;
}

// TODO: remove this function
function addHardcodedPanicResultInternalFnCalls(internalFnCalls: InternalFnCallTrace[]): boolean {
	for (let i = 0; i < internalFnCalls.length; i++) {
		const internalCall = internalFnCalls[i];
		if (
			internalCall.data.fnName ===
			'carmine_protocol::amm_core::options::Options::expire_option_token@27844([0]: RangeCheck, [1]: GasBuiltin, [2]: Pedersen, [3]: System, [4]: ContractAddress, [5]: u8, [6]: u8, [7]: cubit::f128::types::fixed::Fixed, [8]: cubit::f128::types::fixed::Fixed, [9]: u128, [10]: u64) -> (RangeCheck, GasBuiltin, Pedersen, System, core::panics::PanicResult::<((),)>)'
		) {
			internalCall.data.isPanicResult = true;
			return true;
		}
		if (internalCall.nestedCalls.length > 0) {
			const isAdded = addHardcodedPanicResultInternalFnCalls(internalCall.nestedCalls);
			if (isAdded) return true;
		}
	}
	return false;
}
