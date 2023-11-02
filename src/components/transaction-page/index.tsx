'use client';

import { useEffect, useState } from 'react';
import { ExecutionStatus, Transaction, fetchTransaction } from '@/lib/transaction';
import { Header } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Trace } from './trace';
import { copyToClipboard, hexToNumber, shortenHash } from '@/lib/utils';

export function TransactionPage({ chainId, txHash }: { chainId: number; txHash: string }) {
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
						<Trace executeInvocation={txData.trace.execute_invocation} />
					) : (
						<div>{error ? error : 'Loading...'}</div>
					)}
				</Container>
			</main>
			<Footer />
		</>
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
		{
			name: 'Timestamp',
			value: 'undefined'
		},
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
		{
			name: 'Calldata',
			value: shortenHash(txData.data.calldata, 35),
			isCopyable: true,
			valueToCopy: txData.data.calldata
		},
		{
			name: 'Signature',
			value: shortenHash(txData.data.signature, 35),
			isCopyable: true,
			valueToCopy: txData.data.signature
		}
	];
	return (
		<div className="mt-4 bg-neutral-100 rounded py-1 px-2 text-xs flex flex-row gap-x-3 flex-wrap leading-loose">
			{info.map(({ name, value, isCopyable, valueToCopy }) => (
				<span key={name} className="whitespace-nowrap">
					<span className="text-neutral-500">{name}:</span>{' '}
					<span
						onClick={() => isCopyable && copyToClipboard(valueToCopy ?? value)}
						className={`rounded-sm px-1 ${isCopyable ? 'cursor-pointer hover:bg-black/10' : ''}`}
					>
						{value}
					</span>
				</span>
			))}
		</div>
	);
}
