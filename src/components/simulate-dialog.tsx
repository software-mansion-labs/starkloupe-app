'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DialogClose } from '@radix-ui/react-dialog';

export function SimulateDialog({
	title = 'Simulate transaction',
	description = 'Configure your transaction for simulation.',
	dialogTrigger,
	senderAddress = '',
	blockNumber = '',
	chainId = '',
	calldata = '',
	transactionVersion = 2
}: {
	title?: string;
	description?: string;
	dialogTrigger: React.ReactNode;
	senderAddress?: string;
	blockNumber?: string;
	chainId?: string;
	calldata?: string;
	transactionVersion?: number;
}) {
	const [_senderAddress, _setSenderAddress] = useState(senderAddress);
	const [_calldata, _setCalldata] = useState(calldata);
	const [_blockNumber, _setBlockNumber] = useState(blockNumber);
	const [_chainId, _setChainId] = useState(chainId);
	const [_transactionVersion, _setTransactionVersion] = useState(transactionVersion);

	useEffect(() => {
		_setSenderAddress(senderAddress);
		_setBlockNumber(blockNumber);
		_setChainId(chainId);
		_setCalldata(calldata);
		_setTransactionVersion(transactionVersion);
	}, [senderAddress, blockNumber, chainId, calldata, transactionVersion]);

	const router = useRouter();
	const searchParams = useSearchParams();

	const _tempChainId = 'SN_MAIN'; // TODO: use real chain id
	function onDialogSubmit() {
		router.push(
			`/simulations/${_tempChainId}` +
				'?' +
				createQueryStringWithObject({
					senderAddress: _senderAddress,
					calldata: _calldata,
					blockNumber: _blockNumber,
					chainId: _chainId,
					nonce: '0',
					transactionVersion: _transactionVersion.toString()
				})
		);
	}

	const createQueryStringWithObject = useCallback(
		(obj: Record<string, string>) => {
			const params = new URLSearchParams(searchParams.toString());
			Object.entries(obj).forEach(([key, value]) => {
				params.set(key, value);
			});

			return params.toString();
		},
		[searchParams]
	);

	return (
		<Dialog>
			<DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-screen-lg">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="sender-address" className="text-right">
							Sender address
						</Label>
						<Input
							id="sender-address"
							value={_senderAddress}
							onChange={(e) => _setSenderAddress(e.target.value)}
							className="col-span-3 font-mono"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
						<Label htmlFor="calldata" className="text-right">
							Calldata
						</Label>
						<Textarea
							placeholder="Enter raw calldata here."
							className="col-span-3 font-mono h-32"
							id="calldata"
							value={_calldata}
							onChange={(e) => _setCalldata(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground col-span-3 col-start-2">
							The calldata will be executed on the sender contract.
						</p>
					</div>
					<div className="grid grid-cols-4 items-center gap-4 mt-8">
						<Label htmlFor="block-number" className="text-right">
							Block number
						</Label>
						<Input
							type="number"
							id="block-number"
							value={_blockNumber}
							onChange={(e) => _setBlockNumber(e.target.value)}
							className="col-span-3 font-mono"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="chain-id" className="text-right">
							Chain ID
						</Label>
						<Input
							id="chain-id"
							value={_chainId}
							onChange={(e) => _setChainId(e.target.value)}
							className="col-span-3 font-mono"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="tx-version" className="text-right">
							Transaction version
						</Label>
						<Input id="tx-version" value={_transactionVersion} className="col-span-3 font-mono" />
					</div>
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button type="submit" onClick={onDialogSubmit}>
							<PlayIcon className="w-4 h-4 mr-2"></PlayIcon> Run Simulation
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
