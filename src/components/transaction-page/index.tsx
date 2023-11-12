'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ExecutionStatus, Call, Transaction, fetchTransaction } from '@/lib/transaction';
import { Header } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Trace } from './trace';
import { copyToClipboard, formatTimestamp, hexToNumber, hexToText, shortenHash } from '@/lib/utils';
import {
	Simulation,
	SimulationResponse,
	SimulationsResponse,
	fetchSimulation
} from '@/lib/simulation';

function processTraceData(raw_call: Call): Call {
	console.log(raw_call);

	let processedCall: Call = processCallsData([raw_call])[0];
	return processedCall;
}

function findContractName(classHash: string): string | undefined {
	const names: { [key: string]: string } = {
		'0x6ae5d4dfb51d3939e409808022f35415e60dc3c298926b9c998543cce3f835c': 'BriqFactory',
		'0x25e33883f34b7b2ce1adc3e3cf0640d389ccfeca742c11d3d3cf55362153b19': 'World',
		'0x3a489ebfa6f17a07e5a5523f128c894a272080aaa9d9339a5ef3ab046cb5105': 'BriqToken',
		'0x625617e4a14b5672e2626d0c1330835bc35f7d40be8e6105dae99438befe07b': 'Briq SetNFT'
	};
	return names[classHash];
}

function processCallsData(raw_calls: Call[]): Call[] {
	let processedCalls: Call[] = [];

	for (let raw_call of raw_calls) {
		let processed_call: Call = {
			entry_point_selector: raw_call.entry_point_selector,
			contract_address: raw_call.contract_address,
			class_hash: raw_call.class_hash,
			call_type: raw_call.call_type,
			function_name: raw_call.function_name,
			inputs_decoded: raw_call.inputs_decoded,
			outputs_decoded: raw_call.outputs_decoded,
			calls: [...raw_call.calls],
			class_alias: raw_call.class_alias,
			events_decoded: raw_call.events_decoded,
			error_message: raw_call.error_message,
			contract_data: raw_call.contract_data,
			contract_display_name:
				findContractName(raw_call.class_hash) ??
				getContractDisplayName(
					raw_call.contract_address,
					raw_call.class_alias,
					raw_call.contract_data?.contract_alias
				)
		};

		if (checkForCallDelegateDuplicate(raw_call)) {
			processed_call.call_type = 'CALL DELEGATE';

			/**
			 * We can skip the delegate call level
			 * but we want to preserve it's events
			 * and also it's children calls
			 */

			// Expand my level events with the DELEGATE level events
			processed_call.events_decoded = [
				...(processed_call.events_decoded ?? []),
				...(raw_call.calls[0].events_decoded ?? [])
			];

			// Expand my calls with the DELEGATE subcalls
			processed_call.calls = [
				...raw_call.calls[0].calls, // first take DELEGATE subcalls
				...raw_call.calls.slice(1) // and the rest of my calls (skip DELEGATE)
			];

			processed_call.error_message = raw_call.calls[0].error_message;
		}

		if (processed_call.calls.length > 0) {
			processed_call.calls = processCallsData(processed_call.calls);
		}

		processedCalls.push(processed_call);
	}

	return processedCalls;
}

function checkForCallDelegateDuplicate(call: Call): boolean {
	if (
		call.call_type == 'CALL' &&
		call.calls[0]?.call_type == 'DELEGATE' &&
		call.contract_address == call.calls[0].contract_address &&
		call.entry_point_selector == call.calls[0].entry_point_selector &&
		call.inputs_decoded?.toString() == call.calls[0].inputs_decoded?.toString() &&
		call.calls.length == 1
	) {
		return true;
	}

	return false;
}

function getContractDisplayName(
	contract_address: string,
	class_alias?: string,
	contract_alias?: string
): string {
	if (class_alias || contract_alias) {
		return [class_alias, contract_alias].join('');
	}

	return shortenHash(contract_address);
}

export function SimulationPage({ simulationId }: { simulationId: string }) {
	const [simulationData, setSimulationData] = useState<SimulationResponse>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setSimulationData(await fetchSimulation(simulationId));
			} catch (error) {
				setError('Error fetching data');
			}
		};

		fetchData();
	}, [simulationId]);

	return (
		<>
			<Header />
			<main className="flex-auto flex w-full pt-5 pb-10">
				<Container className="overflow-hidden flex-auto">
					<div className="font-medium text-lg mr-2 flex flex-row flex-wrap items-baseline break-all">
						<span className="text-xl mr-6">Simulation</span>{' '}
						<span>
							{simulationId} from{' '}
							{simulationData?.simulation.team_id === 2 ? (
								<> Briq [staging]</>
							) : simulationData?.simulation.team_id === 1 ? (
								<>
									Wido — <a href="https://joinwido.com">joinwido.com</a>
								</>
							) : (
								''
							)}
						</span>
					</div>
					{simulationData && <SimulationInfo simulation={simulationData.simulation} />}
					{simulationData?.trace.execute_invocation ? (
						<Trace
							executeInvocation={processTraceData(simulationData.trace.execute_invocation)}
							classes={simulationData.classes}
						/>
					) : (
						<div>{error ? error : 'Loading...'}</div>
					)}
				</Container>
			</main>
			<Footer />
		</>
	);
}

export function TransactionPage({ chainId, txHash }: { chainId: string; txHash: string }) {
	const [txData, setTxData] = useState<Transaction>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setTxData(await fetchTransaction(chainId, txHash));
			} catch (error) {
				setError('Error fetching data');
			}
		};

		fetchData();
	}, [chainId, txHash]);

	return (
		<>
			<Header />
			<main className="flex-auto flex w-full pt-5 pb-10">
				<Container className="overflow-hidden flex-auto">
					<div className="font-medium text-lg mr-2 flex flex-row flex-wrap items-baseline break-all">
						<span className="text-xl mr-6">Transaction</span> <span>{txHash}</span>
					</div>
					{txData && <TransactionInfo txData={txData} />}
					{txData?.trace.execute_invocation ? (
						<Trace
							executeInvocation={processTraceData(txData.trace.execute_invocation)}
							classes={txData.classes}
						/>
					) : (
						<div>{error ? error : 'Loading...'}</div>
					)}
				</Container>
			</main>
			<Footer />
		</>
	);
}

export function Details(
	info: { name: string; value: ReactNode | string; isCopyable?: boolean; valueToCopy?: string }[]
) {
	return (
		<div className="rounded text-xs flex flex-row gap-x-3 flex-wrap leading-loose">
			{info.map(
				({ name, value, isCopyable, valueToCopy }) =>
					value && (
						<span key={name} className="whitespace-nowrap">
							<span className="text-neutral-500">{name}:</span>{' '}
							<span
								onClick={() =>
									isCopyable && valueToCopy
										? copyToClipboard(valueToCopy)
										: typeof value === 'string'
										? copyToClipboard(value)
										: () => {}
								}
								className={`rounded-sm px-1 ${
									isCopyable ? 'cursor-pointer hover:bg-black/10' : ''
								}`}
							>
								{value}
							</span>
						</span>
					)
			)}
		</div>
	);
}

function TransactionInfo({ txData }: { txData: Transaction }) {
	const info = [
		{
			name: 'Execution status',
			value: (
				<span
					className={` ${
						txData.status.execution_status === ExecutionStatus.REVERTED
							? 'text-red-600'
							: 'text-lime-600'
					}`}
				>
					{txData.status.execution_status}
				</span>
			)
		},
		{
			name: 'Error Reason',
			value: <span className="text-red-600">{txData.status.error_reason}</span>
		},
		{
			name: 'Finality status',
			value: txData.status.finality_status
		},
		{
			name: 'Chain',
			value: 'mainnet'
		},
		{
			name: 'Type',
			value: txData.data.type
		},
		{
			name: 'Nonce',
			value: hexToNumber(txData.data.nonce)
		},
		{
			name: 'Max fee',
			value: hexToNumber(txData.data.max_fee)
		},
		{
			name: 'Actual fee',
			value: hexToNumber(txData.receipt.actual_fee)
		},
		{
			name: 'Version',
			value: hexToNumber(txData.data.version)
		},
		{
			name: 'Block hash',
			value: shortenHash(txData.receipt.block_hash)
		},
		{
			name: 'Block',
			value: txData.receipt.block_number.toString(),
			isCopyable: true
		},
		// {
		// 	name: 'Timestamp',
		// 	value: 'undefined'
		// },
		// {
		// 	name: 'Value',
		// 	value: 'undefined'
		// },
		// {
		// 	name: 'Receiver',
		// 	value: 'undefined',
		// 	isCopyable: true,
		// 	valueToCopy: 'undefined'
		// },
		{
			name: 'Sender',
			value: txData.data.sender_address,
			isCopyable: true,
			valueToCopy: txData.data.sender_address
		},
		// {
		// 	name: 'Calldata',
		// 	value: shortenHash(txData.data.calldata, 35),
		// 	isCopyable: true,
		// 	valueToCopy: txData.data.calldata
		// },
		{
			name: 'Signature',
			value: shortenHash(txData.data.signature, 35),
			isCopyable: true,
			valueToCopy: txData.data.signature
		}
	];
	return <div className="mt-4 py-1 px-2 bg-neutral-100 rounded-sm">{Details(info)}</div>;
}

function SimulationInfo({ simulation }: { simulation: Simulation }) {
	const info = [
		{
			name: 'Execution status',
			value: (
				<span
					className={` ${
						simulation.status === 'success'
							? 'text-lime-600'
							: simulation.status === 'simulating'
							? 'text-blue-600'
							: 'text-red-600'
					}`}
				>
					{(simulation.status ?? '').toUpperCase()}
				</span>
			)
		},
		{
			name: 'Chain id',
			value: hexToText(simulation.chain_id)
		},
		{
			name: 'Timestamp',
			value: formatTimestamp(simulation.created_at)
		},
		{
			name: 'Wallet address',
			value: simulation.wallet_address
		}
	];
	return <div className="mt-4 py-1 px-2 bg-neutral-100 rounded-sm">{Details(info)}</div>;
}
