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
import { useCallback, useContext, useEffect, useState } from 'react';
import { SimulationPayloadWithCalldata } from '@/lib/simulation';
import { openSimulationPage } from '@/lib/utils';
import { Network, useSettings } from '@/lib/context/settings-context-provider';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

interface Chain {
	chainId?: string;
	network?: Network;
}

function extractChain(
	networks: Network[],
	simulationPayload?: SimulationPayloadWithCalldata
): Chain {
	if (simulationPayload) {
		if (simulationPayload.chainId) {
			return {
				chainId: simulationPayload.chainId
			};
		} else if (simulationPayload.rpcUrl) {
			const network = networks.find((n) => n.rpcUrl === simulationPayload.rpcUrl);
			if (network) return { network };
			else
				return {
					network: { networkName: simulationPayload.rpcUrl, rpcUrl: simulationPayload.rpcUrl }
				};
		}
	}
	return { chainId: 'SN_MAIN' };
}

export function SimulateDialog({
	title = 'Simulate transaction',
	description = 'Configure your invoke transaction for simulation.',
	dialogTrigger,
	simulationPayload
}: {
	title?: string;
	description?: string;
	dialogTrigger: React.ReactNode;
	simulationPayload?: SimulationPayloadWithCalldata;
}) {
	const { networks } = useSettings();
	const defaultTransactionVersion = '3';
	const [alert, setAlert] = useState(false);
	const validateHexFormat = (value: string) => /^0x[0-9a-fA-F]+$/.test(value);

	const validateCalldata = useCallback((calldata: string[]) => {
		return calldata.every((item) => validateHexFormat(item));
	}, []);

	const [_senderAddress, _setSenderAddress] = useState<string>(
		simulationPayload?.senderAddress ?? ''
	);
	const [_calldata, _setCalldata] = useState<string>(simulationPayload?.calldata.join('\n') ?? '');
	const [_blockNumber, _setBlockNumber] = useState<string>(
		simulationPayload?.blockNumber?.toString() ?? ''
	);
	const defaultChain = extractChain(networks, simulationPayload);
	const [_chain, _setChain] = useState<Chain>(defaultChain);

	function handleChainChange(value: string) {
		if (value === 'SN_MAIN' || value === 'SN_SEPOLIA') {
			_setChain({ chainId: value });
		} else {
			const network = networks.find((n) => n.networkName === value);
			if (network) {
				_setChain({ network });
			} else if (value === defaultChain.network?.networkName) {
				_setChain(defaultChain);
			}
		}
	}

	const [_transactionVersion, _setTransactionVersion] = useState<string>(
		simulationPayload?.transactionVersion.toString() ?? defaultTransactionVersion
	);

	useEffect(() => {
		_setSenderAddress(simulationPayload?.senderAddress ?? '');
		_setBlockNumber(simulationPayload?.blockNumber?.toString() ?? '');
		_setChain(extractChain(networks, simulationPayload));
		_setCalldata(simulationPayload?.calldata.join('\n') ?? '');
		_setTransactionVersion(
			simulationPayload?.transactionVersion.toString() ?? defaultTransactionVersion
		);
	}, [networks, simulationPayload]);

	function onDialogSubmit() {
		const simulationPayload: SimulationPayloadWithCalldata = {
			senderAddress: _senderAddress,
			calldata: _calldata.trim().split('\n'),
			blockNumber: _blockNumber.length > 0 ? parseInt(_blockNumber) : undefined,
			transactionVersion: parseInt(_transactionVersion)
		};
		if (_chain.chainId) {
			simulationPayload.chainId = _chain.chainId;
		} else if (_chain.network) {
			simulationPayload.rpcUrl = _chain.network.rpcUrl;
		}
		if (
			simulationPayload.senderAddress === '' ||
			simulationPayload.calldata[0] === '' ||
			isNaN(simulationPayload.transactionVersion) ||
			!validateHexFormat(simulationPayload.senderAddress) ||
			!validateCalldata(simulationPayload.calldata)
		) {
			setAlert(true);
		} else {
			openSimulationPage(simulationPayload);
		}
	}

	const chainOptions = [
		{ value: 'SN_MAIN', label: 'SN_MAIN' },
		{ value: 'SN_SEPOLIA', label: 'SN_SEPOLIA' },
		...networks.map((network) => ({ value: network.networkName, label: network.networkName }))
	];

	if (defaultChain.network) {
		if (!networks.find((n) => n.rpcUrl === defaultChain.network?.rpcUrl)) {
			chainOptions.push({
				value: defaultChain.network.networkName,
				label: defaultChain.network.networkName
			});
		}
	}

	const FieldAlert = () => {
		const getValidationErrors = () => {
			const errors = [];
			const emptyFields = [];
			if (!_senderAddress) emptyFields.push('Sender Address');
			if (_calldata.trim() === '') emptyFields.push('Calldata');
			if (!_transactionVersion) emptyFields.push('Transaction version');
			if (emptyFields.length > 0) {
				errors.push(
					`The ${emptyFields.join(', ')} field${emptyFields.length > 1 ? 's' : ''} ${
						emptyFields.length === 1 ? 'is' : 'are'
					} required`
				);
			}
			if (_senderAddress && !validateHexFormat(_senderAddress)) {
				errors.push('Sender address must be a hexadecimal number starting with 0x');
			}
			if (_calldata.trim() !== '') {
				const calldataArray = _calldata.trim().split(' ');
				if (!validateCalldata(calldataArray)) {
					errors.push('Calldata must be a list of hexadecimal numbers, each starting with 0x');
				}
			}
			if (isNaN(parseInt(_transactionVersion))) {
				errors.push('Transaction version must be a number');
			}

			return errors.join('. ');
		};

		const validationMessage = getValidationErrors();

		if (!validationMessage) {
			return null;
		}

		return (
			<Alert variant="destructive" className="mt-4">
				<ExclamationTriangleIcon className="h-4 w-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>{validationMessage}</AlertDescription>
			</Alert>
		);
	};

	useEffect(() => {
		if (
			alert &&
			!(
				_senderAddress === '' ||
				!validateHexFormat(_senderAddress) ||
				_calldata.trim() === '' ||
				!validateCalldata(_calldata.trim().split('\n')) ||
				isNaN(parseInt(_transactionVersion))
			)
		) {
			setAlert(false);
		}
	}, [_senderAddress, _calldata, _transactionVersion, alert, validateCalldata]);

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
							className={`col-span-3 font-mono ${
								alert &&
								(_senderAddress === '' || !validateHexFormat(_senderAddress)) &&
								' border-red-500'
							}`}
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
						<Label htmlFor="calldata" className="text-right">
							Calldata
						</Label>
						<Textarea
							placeholder={`Enter raw calldata here. For example:\n\n0x0000000000000000000000000000000000000000000000000000000000000001\n0x014c52727fc025f10d431efafb3945a06601e3703fc06c934df177a6c30f3280\n0x02f67e6aeaad1ab7487a680eb9d3363a597afa7a3de33fa9bf3ae6edcb88435d\n0x0000000000000000000000000000000000000000000000000000000000000001\n0x000000000000000000000000000000000000000000000000000000000000002a`}
							className={`col-span-3 font-mono h-32 ${
								alert &&
								(_calldata.trim() === '' || !validateCalldata(_calldata.trim().split('\n'))) &&
								' border-red-500'
							}`}
							id="calldata"
							value={_calldata}
							onChange={(e) => {
								_setCalldata(e.target.value);
								console.log(_calldata);
							}}
						/>
						<p className="text-xs text-muted-foreground col-span-3 col-start-2">
							The calldata will be executed on the sender contract.
						</p>
					</div>
					<div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
						<Label htmlFor="block-number" className="text-right">
							Block number
						</Label>
						<Input
							min={0}
							type="number"
							id="block-number"
							value={_blockNumber}
							onChange={(e) => _setBlockNumber(e.target.value)}
							className="col-span-3 font-mono"
						/>
						<p className="text-xs text-muted-foreground col-span-3 col-start-2">
							If you leave the field empty, the latest block will be used.
						</p>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="chain-id" className="text-right">
							Chain
						</Label>
						<Select
							value={_chain.chainId ?? _chain.network?.networkName}
							onValueChange={(value) => handleChainChange(value)}
						>
							<SelectTrigger className="col-span-3 font-mono">
								<SelectValue placeholder="Select a chain" />
							</SelectTrigger>
							<SelectContent>
								{chainOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="tx-version" className="text-right">
							Transaction version
						</Label>
						<Input
							id="tx-version"
							value={_transactionVersion}
							className={`col-span-3 font-mono ${
								alert && isNaN(parseInt(_transactionVersion)) && ' border-red-500'
							}`}
							onChange={(e) => _setTransactionVersion(e.target.value)}
						/>
					</div>
				</div>
				{alert && <FieldAlert />}

				<DialogFooter>
					<Button type="submit" onClick={onDialogSubmit}>
						<PlayIcon className="w-4 h-4 mr-2"></PlayIcon> Run Simulation
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
