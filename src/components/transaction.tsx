'use client'

import { useEffect, useState } from 'react'

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

function shortenHash(hash: string) {
	if (!hash) return ''
	if (hash.length <= 10) return hash
	return hash.substring(0, 6) + '...' + hash.substring(hash.length - 4)
}

function getInputs(inputs?: CallInput[]) {
	return inputs?.map((i, index) => (
		<span key={i.name}>
			{i.name}={typeof i.value === 'string' ? <span>{shortenHash(i.value)}</span> : <span>[{getInputs(i.value)}]</span>}
			{index + 1 < inputs.length ? '; ' : ''}
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
					className="bg-red-100 rounded-sm inline-block text-xs font-medium px-2.5 py-0.5 cursor-pointer"
					onClick={() => copyToClipboard(call.contract_address)}
				>
					{call.class_alias ?? shortenHash(call.contract_address)}
				</div>
				.
				<div className="bg-pink-100 rounded-sm inline-block text-xs font-medium px-2.5 py-0.5">
					{call.function_name ?? shortenHash(call.entry_point_selector)}( {getInputs(call.inputs)} )
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
		<div className="overflow-x-auto whitespace-nowrap min-h-[20rem] py-4">{executeInvocation ? CallElements([executeInvocation]) : <div>Loading...</div>}</div>
	)
}
