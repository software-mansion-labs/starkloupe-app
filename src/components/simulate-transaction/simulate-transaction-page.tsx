'use client';

import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/solid';
import { useCallback, useEffect, useState } from 'react';
import { SimulationPayloadWithCalldata } from '@/lib/simulation';
import { openSimulationPage, SimpleContractCall, SimulationPayload } from '@/lib/utils';
import { Chain, NetworksSelect } from '@/components/networks-select';
import { Textarea } from '../ui/textarea';
import { fetchContractFunctions } from '@/lib/contracts';
import { EntryPointSelect } from '../entry-point-select';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';

export function SimulateTransactionPage({
	title = 'Simulate transaction',
	description = 'Configure your invoke transaction for simulation.',
	simulationPayload
}: {
	title?: string;
	description?: string;
	simulationPayload?: SimulationPayload;
}) {
	const [view, setView] = useState<'networks' | 'monitoring' | 'members'>('networks');
	const changeTabCallback = (tab: 'networks' | 'monitoring' | 'members') => {
		setView(tab);
	};
	const defaultTransactionVersion = 3;
	const [alert, setAlert] = useState(false);
	const validateHexFormat = (value: string) => /^0x[0-9a-fA-F]+$/.test(value);
	const validateCalldata = useCallback((calldata: string[]) => {
		return calldata.length > 0 && calldata.every((item) => validateHexFormat(item));
	}, []);
	const [isLoadingFunctions, setIsLoadingFunctions] = useState(false);

	const [_senderAddress, _setSenderAddress] = useState<string>(
		simulationPayload?.senderAddress ?? ''
	);
	const [_numberOfContracts, _setNumberOfContracts] = useState<number>(
		simulationPayload?.calls?.length || 1
	);

	const [_contractCalls, _setContractCalls] = useState<SimpleContractCall[]>([]);

	const [_contractCallsFunctions, _setContractCallsFunctions] = useState<{ [key: string]: any }>(
		{}
	);

	const [_blockNumber, _setBlockNumber] = useState<string>(
		simulationPayload?.blockNumber?.toString() ?? ''
	);

	const [_transactionVersion, _setTransactionVersion] = useState<number>(
		simulationPayload?.transactionVersion || defaultTransactionVersion
	);
	const [_chain, _setChain] = useState<Chain | undefined>(undefined);

	const onChainChangedCallback = (chain: Chain) => {
		_setChain(chain);
		_setContractCallsFunctions({});
	};

	const handleNumberOfContractsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;

		const numValue = Math.max(1, parseInt(inputValue) || 1);

		_setNumberOfContracts(numValue);
	};

	function validateContractCalls(calls: SimpleContractCall[]): boolean {
		if (calls.length === 0) {
			return false;
		}

		return calls.every((call) => {
			if (!validateHexFormat(call.address)) {
				return false;
			}
			const calldata = call.calldata.trim();
			if (calldata === '') {
				return false;
			}

			const calldataLines = calldata.split('\n').filter((line) => line.trim() !== '');
			return calldataLines.length > 0 && validateCalldata(calldataLines);
		});
	}

	useEffect(() => {
		if (!simulationPayload) return;

		_setSenderAddress(simulationPayload.senderAddress ?? '');
		_setBlockNumber(simulationPayload.blockNumber?.toString() ?? '');

		if (simulationPayload.chainId) {
			_setChain({ chainId: simulationPayload.chainId });
		} else if (simulationPayload.rpcUrl) {
			_setChain({
				network: {
					rpcUrl: simulationPayload.rpcUrl,
					networkName: 'Custom Network'
				}
			});
		}

		if (simulationPayload.calls && simulationPayload.calls.length > 0) {
			_setContractCalls(simulationPayload.calls);
			_setNumberOfContracts(simulationPayload.calls.length);
		} else {
			_setContractCalls([{ address: '', function_name: '', calldata: '' }]);
			_setNumberOfContracts(1);
		}

		_setTransactionVersion(simulationPayload.transactionVersion || defaultTransactionVersion);
	}, [simulationPayload]);

	useEffect(() => {
		if (_contractCalls.length > 0 && _chain?.chainId) {
			const loadContractFunctions = async () => {
				setIsLoadingFunctions(true);
				try {
					const allContractFunctions = { ..._contractCallsFunctions };
					let functionsLoaded = false;

					for (const call of _contractCalls) {
						if (call.address && validateHexFormat(call.address)) {
							try {
								const functions = await getFunctionNames(call.address);

								if (functions && functions.entry_point_datas) {
									allContractFunctions[call.address] = functions.entry_point_datas;
									functionsLoaded = true;
								}
							} catch (error) {
								console.log(error);
							}
						}
					}

					if (functionsLoaded) {
						_setContractCallsFunctions(allContractFunctions);
					}
				} finally {
					setIsLoadingFunctions(false);
				}
			};

			loadContractFunctions();
		}
	}, [_chain, _contractCalls]);

	useEffect(() => {
		if (_contractCalls.length === _numberOfContracts) return;

		const newCalls = [..._contractCalls];

		if (newCalls.length < _numberOfContracts) {
			for (let i = newCalls.length; i < _numberOfContracts; i++) {
				newCalls.push({
					address: '',
					function_name: '',
					calldata: ''
				});
			}
		} else if (newCalls.length > _numberOfContracts) {
			newCalls.splice(_numberOfContracts);
		}

		_setContractCalls(newCalls);
	}, [_numberOfContracts]);

	function onDialogSubmit() {
		const allCallsValid = _contractCalls.every(
			(call) => validateHexFormat(call.address) && call.function_name && call.calldata.trim() !== ''
		);

		const allCalldataValid = _contractCalls.every((call) => {
			const calldataLines = call.calldata
				.trim()
				.split('\n')
				.filter((line) => line.trim() !== '');
			return calldataLines.length > 0 && validateCalldata(calldataLines);
		});

		if (!allCallsValid || !allCalldataValid) {
			setAlert(true);
			return;
		}

		const simulationPayload: SimulationPayload = {
			senderAddress: _senderAddress,
			calls: _contractCalls,
			blockNumber: _blockNumber.length > 0 ? parseInt(_blockNumber) : undefined,
			transactionVersion: _transactionVersion
		};

		if (_chain) {
			if (_chain.chainId) {
				simulationPayload.chainId = _chain.chainId;
			} else if (_chain.network) {
				simulationPayload.rpcUrl = _chain.network.rpcUrl;
			}
		} else {
			throw new Error('Chain is not defined');
		}

		if (
			simulationPayload.senderAddress === '' ||
			!validateHexFormat(simulationPayload.senderAddress) ||
			![1, 3].includes(simulationPayload.transactionVersion)
		) {
			setAlert(true);
		} else {
			openSimulationPage(simulationPayload);
		}
	}

	const FieldAlert = () => {
		const getValidationErrors = () => {
			const errors = [];
			const emptyFields = [];

			if (!_senderAddress) emptyFields.push('Sender Address');

			const hasEmptyAddresses = _contractCalls.some(
				(call) => !call.address || !validateHexFormat(call.address)
			);
			if (hasEmptyAddresses) {
				emptyFields.push('Contract Address');
			}

			const hasEmptyFunctions = _contractCalls.some((call) => !call.function_name);
			if (hasEmptyFunctions) {
				emptyFields.push('Entry Point');
			}

			const hasEmptyCalldata = _contractCalls.some((call) => call.calldata.trim() === '');
			if (hasEmptyCalldata) {
				emptyFields.push('Calldata');
			}

			if (!_transactionVersion) emptyFields.push('Transaction version');

			if (emptyFields.length > 0) {
				errors.push(
					`The ${emptyFields.join(', ')} field${emptyFields.length > 1 ? 's' : ''} ${
						emptyFields.length === 1 ? 'is' : 'are'
					} required for all calls`
				);
			}

			if (_senderAddress && !validateHexFormat(_senderAddress)) {
				errors.push('Sender address must be a hexadecimal number starting with 0x');
			}

			_contractCalls.forEach((call, index) => {
				if (call.address && !validateHexFormat(call.address)) {
					errors.push(
						`Contract address in call #${index + 1} must be a hexadecimal number starting with 0x`
					);
				}

				if (call.address && call.calldata && call.calldata.trim() !== '') {
					const calldataArray = call.calldata
						.trim()
						.split('\n')
						.filter((line) => line.trim() !== '');
					if (calldataArray.length === 0) {
						errors.push(`Calldata in call #${index + 1} cannot be empty`);
					} else if (!validateCalldata(calldataArray)) {
						errors.push(
							`Calldata in call #${
								index + 1
							} must be a list of hexadecimal numbers, each starting with 0x`
						);
					}
				}
			});

			if (![1, 3].includes(_transactionVersion)) {
				errors.push('Transaction version must be either 1 or 3');
			}

			return errors.join('. ');
		};

		const validationMessage = getValidationErrors();

		if (!validationMessage) {
			return null;
		}

		return (
			<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				<p>{validationMessage}</p>
			</div>
		);
	};

	useEffect(() => {
		if (alert) {
			const allAddressesValid = _contractCalls.every((call) => validateHexFormat(call.address));

			const allFunctionsSelected = _contractCalls.every((call) => !!call.function_name);

			const allCalldataValid = _contractCalls.every((call) => {
				const calldataLines = call.calldata
					.trim()
					.split('\n')
					.filter((line) => line.trim() !== '');
				return calldataLines.length > 0 && validateCalldata(calldataLines);
			});

			if (
				_senderAddress !== '' &&
				validateHexFormat(_senderAddress) &&
				allAddressesValid &&
				allFunctionsSelected &&
				allCalldataValid &&
				[1, 3].includes(_transactionVersion)
			) {
				setAlert(false);
			}
		}
	}, [_senderAddress, _contractCalls, _transactionVersion, alert, validateCalldata]);

	const getFunctionNames = async (contractAddress: string) => {
		if (!_chain?.chainId || !validateHexFormat(contractAddress)) return null;

		try {
			const result = await fetchContractFunctions({
				contractAddress,
				network: _chain.chainId
			});
			return result;
		} catch (error) {
			return null;
		}
	};

	const handleContractAddressChange = async (index: number, newAddress: string) => {
		const newCalls = [..._contractCalls];
		const oldAddress = newCalls[index].address;

		newCalls[index] = {
			...newCalls[index],
			address: newAddress
		};

		_setContractCalls(newCalls);

		if (newAddress && validateHexFormat(newAddress) && newAddress !== oldAddress) {
			const functions = await getFunctionNames(newAddress);

			if (functions && functions.entry_point_datas) {
				const newFunctions = { ..._contractCallsFunctions };
				newFunctions[newAddress] = functions.entry_point_datas;
				_setContractCallsFunctions(newFunctions);
			}
		}
	};

	const handleFunctionNameChange = (index: number, newFunctionName: string) => {
		const newCalls = [..._contractCalls];
		newCalls[index] = {
			...newCalls[index],
			function_name: newFunctionName
		};
		_setContractCalls(newCalls);
	};

	const handleCalldataChange = (index: number, newCalldata: string) => {
		const newCalls = [..._contractCalls];
		newCalls[index] = {
			...newCalls[index],
			calldata: newCalldata
		};
		_setContractCalls(newCalls);
	};

	return (
		<>
			<HeaderNav />
			<main className="overflow-y-auto xl:flex xl:justify-between flex-grow relative">
				<div className="left-8 px-4 py-8 xl:block hidden">
					<Button onClick={() => window.history.back()} variant="outline">
						<ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
					</Button>
				</div>
				<div className="xl:hidden block px-4 py-8">
					<Button onClick={() => window.history.back()} variant="outline">
						<ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
					</Button>
				</div>

				<div className="w-full flex justify-center">
					<div className="w-full max-w-5xl px-4 py-8">
						<div className="mb-6">
							<div className="flex flex-col gap-4">
								<h1 className="text-3xl font-semibold">{title}</h1>
								<h3 className="text-gray-600">{description}</h3>
							</div>
						</div>

						<div className="rounded-lg py-6">
							<div className="grid gap-6">
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor="chain-id" className="text-right">
										Network
									</Label>
									<NetworksSelect
										simulationPayload={simulationPayload}
										onChainChangedCallback={onChainChangedCallback}
									/>
								</div>

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

								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor="number-contracts" className="text-right">
										Number of contract calls
									</Label>
									<Input
										id="number-contracts"
										value={_numberOfContracts}
										type="number"
										min={1}
										onChange={handleNumberOfContractsChange}
										className={`col-span-3 font-mono ${
											alert && _numberOfContracts < 1 && ' border-red-500'
										}`}
									/>
								</div>

								{_contractCalls.map((call, index) => (
									<fieldset key={index} className="border border-gray-200 rounded-md p-4">
										<legend className="px-2 font-medium text-sm">Call #{index + 1}</legend>
										<div className="grid gap-4">
											<div className="grid grid-cols-4 items-center gap-4">
												<Label htmlFor={`contract-address-${index}`} className="text-right">
													Contract address
												</Label>
												<Input
													id={`contract-address-${index}`}
													value={call.address}
													onChange={(e) => handleContractAddressChange(index, e.target.value)}
													className={`col-span-3 font-mono ${
														alert && index === 0 && !call.address && ' border-red-500'
													}`}
												/>
											</div>
											<EntryPointSelect
												entryPoints={call.address ? _contractCallsFunctions[call.address] : null}
												value={call.function_name}
												isLoading={isLoadingFunctions}
												onChange={(value) => handleFunctionNameChange(index, value)}
											/>
											<div className="grid grid-cols-4 items-center gap-4">
												<Label htmlFor={`calldata-${index}`} className="text-right">
													Calldata
												</Label>
												<Textarea
													id={`calldata-${index}`}
													value={call.calldata}
													placeholder={`Enter raw calldata here. For example:\n\n0x0000000000000000000000000000000000000000000000000000000000000001\n0x014c52727fc025f10d431efafb3945a06601e3703fc06c934df177a6c30f3280\n0x02f67e6aeaad1ab7487a680eb9d3363a597afa7a3de33fa9bf3ae6edcb88435d\n0x0000000000000000000000000000000000000000000000000000000000000001\n0x000000000000000000000000000000000000000000000000000000000000002a`}
													className={`col-span-3 font-mono h-32 ${
														alert &&
														call.address &&
														(call.calldata.trim() === '' ||
															!validateCalldata(
																call.calldata
																	.trim()
																	.split('\n')
																	.filter((line) => line.trim() !== '')
															)) &&
														' border-red-500'
													}`}
													onChange={(e) => handleCalldataChange(index, e.target.value)}
												/>
											</div>
										</div>
									</fieldset>
								))}

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
										placeholder="Latest"
									/>
									<p className="text-xs text-muted-foreground col-span-3 col-start-2">
										If you leave the field empty, the latest block will be used.
									</p>
								</div>

								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor="tx-version" className="text-right">
										Transaction version
									</Label>
									<div className="col-span-3">
										<Select
											value={_transactionVersion.toString()}
											onValueChange={(value) => _setTransactionVersion(parseInt(value))}
										>
											<SelectTrigger className="font-mono">
												<SelectValue placeholder="Select version" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="1">Version 1</SelectItem>
												<SelectItem value="3">Version 3</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="flex justify-end mt-4">
									<Button type="submit" onClick={onDialogSubmit}>
										<PlayIcon className="w-4 h-4 mr-2" /> Run Simulation
									</Button>
								</div>

								{alert && <FieldAlert />}
							</div>
						</div>
					</div>
				</div>
				<div></div>
			</main>
			<Footer />
		</>
	);
}
