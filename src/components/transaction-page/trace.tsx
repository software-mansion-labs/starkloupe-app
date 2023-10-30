import { Call, CallInput } from '@/lib/transaction';
import { copyToClipboard, shortenHash } from '@/lib/utils';

export function Trace({ executeInvocation }: { executeInvocation: Call }) {
	return (
		<div className="pt-16">
			<div className="mb-3 font-medium">Execute Invocation</div>
			<div className="overflow-x-auto whitespace-nowrap min-h-[20rem]">
				{CallElements([executeInvocation])}
			</div>
		</div>
	);
}

function CallElements(calls: Call[]) {
	return calls.map((call, index) => (
		<div key={call.entry_point_selector + call.class_hash + call.contract_address + index}>
			<div className="my-1">
				<div
					className="bg-neutral-50 border-neutral-300 border hover:bg-neutral-100 hover:border-neutral-400 rounded-sm inline-block text-xs font-medium px-2.5 py-0.5 cursor-pointer mr-1"
					onClick={() => copyToClipboard(call.contract_address)}
				>
					{call.class_alias ?? shortenHash(call.contract_address, 13)}
				</div>
				<div className="bg-neutral-50 border-neutral-200 border rounded-sm inline-block text-xs font-medium px-2.5 py-0.5">
					{call.function_name ?? shortenHash(call.entry_point_selector, 13)}({' '}
					{CallInputs(call.inputs)} )
				</div>
			</div>
			<div className="pl-8">{CallElements(call.calls)}</div>
		</div>
	));
}

function CallInputs(inputs?: CallInput[]) {
	return inputs?.map((i, index) => (
		<span key={i.name}>
			<span>{i.name}=</span>
			{typeof i.value === 'string' ? (
				<span className="cursor-pointer hover:bg-neutral-200 rounded-sm px-0.5">
					{shortenHash(i.value)}
				</span>
			) : (
				<span>
					{'{ '}
					{CallInputs(i.value)}
					{' }'}
				</span>
			)}
			{index + 1 < inputs.length ? ', ' : ''}
		</span>
	));
}
