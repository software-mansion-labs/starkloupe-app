'use client';

import { useEffect, useState } from 'react';
import { Transaction, fetchTransaction } from '@/lib/transaction';
import { Header } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Trace } from './trace';
import { copyToClipboard } from '@/lib/utils';

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
			name: 'Status',
			value: txData.status.execution_status
		},
		{
			name: 'Chain',
			value: 'mainnet'
		},
		{
			name: 'Sender',
			value: '0x0000...0000',
			isCopyable: true,
			valueToCopy: '0x0000000000000000000000000000000000000000000000000000000000000000'
		},
		{
			name: 'Receiver',
			value: '0x0000...0000',
			isCopyable: true,
			valueToCopy: '0x0000000000000000000000000000000000000000000000000000000000000000'
		},
		{
			name: 'Timestamp',
			value: '0 sec ago'
		},
		{
			name: 'Value',
			value: '0 ETH'
		},
		{
			name: 'Block',
			value: '000000',
			isCopyable: true
		},
		{
			name: 'Index',
			value: '0'
		},
		{
			name: 'Nonce',
			value: '0'
		},
		{
			name: 'Input raw',
			value: '0x000000000...000000000',
			isCopyable: true,
			valueToCopy: '0x0000000000000000000000000000000000000000000000000000000000000000'
		}
	];
	return (
		<div className="mt-4 bg-neutral-100 rounded py-1 px-2 text-xs flex flex-row gap-x-3 flex-wrap leading-loose">
			{info.map(({ name, value, isCopyable, valueToCopy }) => (
				<span key={name} className="whitespace-nowrap">
					<span className="text-neutral-500">{name}:</span>{' '}
					<span
						onClick={() => copyToClipboard(valueToCopy ?? value)}
						className={`rounded-sm px-1 ${isCopyable ? 'cursor-pointer hover:bg-black/10' : ''}`}
					>
						{value}
					</span>
				</span>
			))}
		</div>
	);
}
