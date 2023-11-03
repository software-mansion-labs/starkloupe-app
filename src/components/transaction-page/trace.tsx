import { Call, CallIoDecoded } from '@/lib/transaction';
import { copyToClipboard, shortenHash } from '@/lib/utils';
import { ArrowLongRightIcon } from '@heroicons/react/20/solid';

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
					{call.class_alias || call.contract_data?.contract_alias ? (
						<>
							{call.class_alias} {call.contract_data?.contract_alias}
						</>
					) : (
						shortenHash(call.contract_address, 13)
					)}
					{call.contract_data?.token_name &&
						` (${call.contract_data?.token_name} - ${call.contract_data?.token_symbol})`}
				</div>
				<div className="bg-neutral-50 border-neutral-200 border rounded-sm inline-block text-xs font-medium px-2.5 py-0.5">
					{call.call_type} {call.function_name ?? shortenHash(call.entry_point_selector, 13)}({' '}
					{CallInputs(call.inputs_decoded)} )<ArrowLongRightIcon className="h-3 w-3 inline mx-1" />
					{call.error_message ? (
						<span className="text-red-500">{call.error_message}</span>
					) : call.outputs_decoded && call.outputs_decoded.length > 0 ? (
						<>
							{'{ '}
							{CallInputs(call.outputs_decoded)}
							{' }'}
						</>
					) : call.outputs_decoded ? (
						'void'
					) : (
						'undefined'
					)}
				</div>
			</div>
			{call.events_decoded && (
				<div className="ml-8">
					{call.events_decoded.map((event_decoded, j) => (
						<div
							key={j}
							className="bg-neutral-50 border-neutral-200 border rounded-sm inline-block text-xs font-medium px-2.5 py-0.5 cursor-pointer mr-1"
						>
							{event_decoded.name} event {event_decoded.order ? `order=${event_decoded.order}` : ''}
							<ArrowLongRightIcon className="h-3 w-3 inline mx-1" />{' '}
							{CallInputs(event_decoded.data)}
						</div>
					))}
				</div>
			)}

			<div className="pl-8">{CallElements(call.calls)}</div>
		</div>
	));
}

function CallInputs(inputs?: CallIoDecoded[]) {
	return inputs?.map((i, index) => (
		<span key={i.name}>
			{i.name && <span>{i.name}=</span>}
			{typeof i.value === 'string' ? (
				<span className="cursor-pointer hover:bg-neutral-200 rounded-sm px-0.5">
					{shortenHash(i.value)}
				</span>
			) : i.type && i.type.slice(-1) === '*' ? (
				<span>[{CallInputs(i.value)}]</span>
			) : i.value_formats && i.value_formats.DECIMAL ? (
				<span>{i.value_formats.DECIMAL}</span>
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
