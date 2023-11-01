import { API_URL } from '@/lib/config';

export interface CallIoDecoded {
	name?: string;
	type?: string;
	value: string | CallIoDecoded[];
}

export interface CallEventDecoded {
	name: string;
	order?: number;
	data: CallIoDecoded[];
}

export interface Call {
	entry_point_selector: string;
	contract_address: string;
	class_hash: string;
	function_name?: string;
	inputs_decoded?: CallIoDecoded[];
	outputs_decoded?: CallIoDecoded[];
	calls: Call[];
	class_alias?: string;
	events_decoded?: CallEventDecoded[];
}

export interface Trace {
	execute_invocation: Call;
}

export interface Transaction {
	trace: Trace;
}

export async function fetchTransaction(chainId: number, txHash: string) {
	const res = await fetch(`${API_URL}/${chainId}/tx/${txHash}`);
	if (!res.ok) throw new Error('Failed to fetch data');
	return (await res.json()) as Transaction;
}
