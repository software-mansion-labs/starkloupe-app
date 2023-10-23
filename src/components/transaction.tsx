'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { ShareIcon } from '@heroicons/react/20/solid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CallInput {
	name: string
	type: string
	value: string | CallInput[]
}

interface Call {
	entry_point_selector: string
	contract_address: string
	class_hash: string
	function_name?: string
	inputs?: CallInput[]
	calls: Call[]
	class_alias?: string
}

function shortenHash(hash: string, length = 13) {
	if (!hash) return ''
	if (hash.length <= length) return hash
	length = Math.round((length - 5) / 2)
	return hash.substring(0, length + 2) + '...' + hash.substring(hash.length - length)
}

function getInputs(inputs?: CallInput[]) {
	return inputs?.map((i, index) => (
		<span key={i.name}>
			{i.name}=
			{typeof i.value === 'string' ? (
				<span className="cursor-pointer hover:bg-pink-200 rounded-sm px-0.5">{shortenHash(i.value)}</span>
			) : (
				<span>
					{'{ '}
					{getInputs(i.value)}
					{' }'}
				</span>
			)}
			{index + 1 < inputs.length ? ', ' : ''}
		</span>
	))
}

function copyToClipboard(text: string): void {
	navigator.clipboard.writeText(text).then(
		function () {
			console.log('Copying to clipboard was successful!')
		},
		function (err) {
			console.error('Could not copy text: ', err)
		}
	)
}

function CallElements(calls: Call[]) {
	return calls.map((call, index) => (
		<div key={call.entry_point_selector + call.class_hash + call.contract_address + index}>
			<div>
				<div
					className="bg-red-100 rounded-sm inline-block text-xs font-medium px-2.5 py-0.5 cursor-pointer hover:bg-red-200 mr-0.5"
					onClick={() => copyToClipboard(call.contract_address)}
				>
					{call.class_alias ?? shortenHash(call.contract_address, 13)}
				</div>
				<div className="bg-pink-100 rounded-sm inline-block text-xs font-medium px-2.5 py-0.5">
					{call.function_name ?? shortenHash(call.entry_point_selector, 13)}( {getInputs(call.inputs)} )
				</div>
			</div>
			<div className="pl-8">{CallElements(call.calls)}</div>
		</div>
	))
}

async function getData(chainId: number, txHash: string) {
	const res = await fetch(`https://xyz.joinwido.com/${chainId}/tx/${txHash}`)
	// const res = await fetch(`http://127.0.0.1:8080/${chainId}/tx/${txHash}`)

	if (!res.ok) {
		// This will activate the closest `error.js` Error Boundary
		throw new Error('Failed to fetch data')
	}

	return res.json()
}

function hash(hash: string, length?: true | number) {
	return (
		<span className="hover:bg-black/10 rounded-sm px-1 cursor-pointer" onClick={() => copyToClipboard(hash)}>
			{length ? shortenHash(hash, length === true ? 13 : length) : hash}
		</span>
	)
}

function TransactionInfo({ chainId, txHash, txData }: { chainId: number; txHash: string; txData?: any }) {
	return (
		<div>
			<div className="flex flex-row justify-between items-center">
				<div className="font-medium text-lg mr-2">Transaction {hash(txHash, 41)}</div>
				<Button onClick={() => copyToClipboard(window.location.href)}>
					<ShareIcon className="w-4 h-4 mr-2" /> Share
				</Button>
			</div>
		</div>
	)
}

function Trace(executeInvocation: Call) {
	const info = [
		{
			name: 'Chain',
			value: 'mainnet',
		},
		{
			name: 'Sender',
			value: '0x0000...0000',
			isCopyable: true,
			valueToCopy: '0x0000000000000000000000000000000000000000000000000000000000000000',
		},
		{
			name: 'Receiver',
			value: '0x0000...0000',
			isCopyable: true,
			valueToCopy: '0x0000000000000000000000000000000000000000000000000000000000000000',
		},
		{
			name: 'Timestamp',
			value: '0 sec ago',
		},
		{
			name: 'Value',
			value: '0 ETH',
		},
		{
			name: 'Block',
			value: '000000',
			isCopyable: true,
		},
		{
			name: 'Index',
			value: '0',
		},
		{
			name: 'Nonce',
			value: '0',
		},
		{
			name: 'Input raw',
			value: '0x000000000...000000000',
			isCopyable: true,
			valueToCopy: '0x0000000000000000000000000000000000000000000000000000000000000000',
		},
	]
	return (
		<div>
			<div className="mt-4 bg-neutral-100 rounded py-1 px-2 text-xs flex flex-row gap-x-3 flex-wrap leading-snug">
				{info.map(({ name, value, isCopyable, valueToCopy }) => (
					<span key={name} className="whitespace-nowrap">
						<span className="text-neutral-500">{name}:</span>{' '}
						<span onClick={() => copyToClipboard(valueToCopy ?? value)} className={`rounded-sm px-1 ${isCopyable ? 'cursor-pointer hover:bg-black/10' : ''}`}>
							{value}
						</span>
					</span>
				))}
			</div>
			<div className="overflow-x-auto whitespace-nowrap min-h-[20rem] py-4">{CallElements([executeInvocation])}</div>
		</div>
	)
}

export default function Transaction({ chainId, txHash }: { chainId: number; txHash: string }) {
	const [txData, setTxData] = useState<any>(null)

	useEffect(() => {
		const fetchData = async () => {
			try {
				setTxData(await getData(chainId, txHash))
			} catch (error) {
				console.error('Error fetching data: ', error)
			}
		}

		fetchData()
	}, [chainId, txHash])

	const executeInvocation: Call | null = txData?.trace?.execute_invocation
	return (
		<div>
			{TransactionInfo({ chainId, txHash, txData })}
			{executeInvocation ? Trace(executeInvocation) : <div>Loading...</div>}
		</div>
	)
}
