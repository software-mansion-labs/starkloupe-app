import { API_URL } from '@/lib/config';

export enum ValueFormatType {
	DECIMAL = 'DECIMAL',
	TEXT = 'TEXT'
}

export interface CallIoDecoded {
	name?: string;
	type?: string;
	value: string | CallIoDecoded[];
	value_formats?: Record<ValueFormatType, string | number>;
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
	call_type: string;
	function_name?: string;
	inputs_decoded?: CallIoDecoded[];
	outputs_decoded?: CallIoDecoded[];
	calls: Call[];
	class_alias?: string;
	events_decoded?: CallEventDecoded[];
	error_message?: string;
}

export interface Trace {
	execute_invocation: Call;
}

export enum FinalityStatus {
	RECEIVED = 'RECEIVED',
	REJECTED = 'REJECTED',
	ACCEPTED_ON_L2 = 'ACCEPTED_ON_L2',
	ACCEPTED_ON_L1 = 'ACCEPTED_ON_L1'
}

export enum ExecutionStatus {
	SUCCEEDED = 'SUCCEEDED',
	REVERTED = 'REVERTED'
}

export interface Status {
	finality_status: FinalityStatus;
	execution_status: ExecutionStatus;
}

export interface TransactionData {
	type: string;
	nonce: string;
	sender_address: string;
	version: string;
	max_fee: string;
	calldata: string;
	signature: string;
}

export interface TransactionReceipt {
	actual_fee: string;
	block_hash: string;
	block_number: number;
}
export interface Transaction {
	trace: Trace;
	status: Status;
	data: TransactionData;
	receipt: TransactionReceipt;
}

export async function fetchTransaction(chainId: number, txHash: string) {
	const res = await fetch(`${API_URL}/${chainId}/tx/${txHash}`);
	if (!res.ok) throw new Error('Failed to fetch data');
	return (await res.json()) as Transaction;
}
