'use client';

import { HeaderNav } from '../header';
import { Footer } from '../footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { shortenHash, SimulationPayload } from '@/lib/utils';
import { Chain, NetworksSelect } from '@/components/networks-select';
import { fetchContractDecodeCalldata } from '@/lib/contracts';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { normalizeDecodedCalldata, validateHexFormat } from '../../lib/utils/validation-utils';
import { FieldAlert } from './field-alert';
import { ContractCallFieldset } from './contract-call-fieldset';
import { useContractFunctions } from '../hooks/use-contract-functions';
import { useDecodeCalldata } from '../hooks/use-decode-calldata';
import { useSimulationForm, useFormValidation } from '../hooks/use-simulation-form';
import {
	handleParameterSubmission,
	handleRawSubmission
} from '../../lib/utils/simulation-handlers';
import { flattenParameters } from '@/lib/utils/parameter-utils';
import { toast } from '@/components/hooks/use-toast';

interface SimulateTransactionPageProps {
	txHash?: string;
	title?: string;
	description?: string;
	simulationPayload?: SimulationPayload;
	parsedCalldata?: string;
}

export function SimulateTransactionPage({
	txHash,
	title = 'Simulate transaction',
	description = 'Configure your invoke transaction for simulation.',
	simulationPayload,
	parsedCalldata
}: SimulateTransactionPageProps) {
	const defaultTransactionVersion = 3;
	const router = useRouter();

	const {
		alert,
		setAlert,
		isParameterInvalid,
		setIsParameterInvalid,
		serverDataLoaded,
		setServerDataLoaded,
		isSimulating,
		setIsSimulating,
		calldataDecodeError,
		setCalldataDecodeError,
		_senderAddress,
		_setSenderAddress,
		_numberOfContracts,
		_setNumberOfContracts,
		_contractCalls,
		_setContractCalls,
		_blockNumber,
		_setBlockNumber,
		_transactionVersion,
		_setTransactionVersion,
		_chain,
		_setChain,
		activeTabs,
		setActiveTabs
	} = useSimulationForm(simulationPayload, defaultTransactionVersion);

	const {
		contractCallsFunctions,
		isLoadingFunctions,
		contractFetchErrors,
		isLoading,
		fetchFunctionsForContractAddress
	} = useContractFunctions(_chain, _contractCalls);

	const { decodeCalldata, setDecodeCalldata } = useDecodeCalldata(
		_contractCalls,
		contractCallsFunctions,
		serverDataLoaded,
		txHash
	);

	useEffect(() => {
		const fetchServerDecodeCalldata = async () => {
			if (
				!parsedCalldata ||
				!_senderAddress ||
				!_blockNumber ||
				!_chain?.chainId ||
				!contractCallsFunctions ||
				Object.keys(contractCallsFunctions).length === 0
			) {
				return;
			}

			if (serverDataLoaded) {
				return;
			}

			try {
				const response = await fetchContractDecodeCalldata({
					tx_hash: txHash,
					sender_address: _senderAddress,
					calldata: parsedCalldata,
					block_number: _blockNumber,
					chain_id: _chain.chainId,
					transaction_version: _transactionVersion
				});

				if (response && typeof response === 'object') {
					const normalizedData = normalizeDecodedCalldata(response);
					setDecodeCalldata(normalizedData);
					setServerDataLoaded(true);
					setCalldataDecodeError({});
				}
			} catch (error) {
				console.error('Error fetching decode calldata:', error);

				const errorMap: { [key: number]: boolean } = {};
				_contractCalls.forEach((call, index) => {
					if (call.calldata && call.calldata.trim() !== '') {
						errorMap[index] = true;
					}
				});
				setCalldataDecodeError(errorMap);

				toast({
					title: 'Error',
					description: 'Failed to decode raw calldata. Please check your input.',
					variant: 'destructive'
				});
			}
		};

		fetchServerDecodeCalldata();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [txHash, parsedCalldata, contractCallsFunctions, serverDataLoaded]);

	useFormValidation(
		_senderAddress,
		_contractCalls,
		_transactionVersion,
		alert,
		contractCallsFunctions,
		setAlert
	);

	const onChainChangedCallback = async (chain: Chain) => {
		_setChain(chain);
	};

	const handleNumberOfContractsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;
		const numValue = Math.max(1, parseInt(inputValue) || 1);
		_setNumberOfContracts(numValue);
	};

	const handleBlockNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;

		if (inputValue === '') {
			_setBlockNumber('');
			return;
		}

		if (/^0$|^[1-9]\d*$/.test(inputValue)) {
			const numValue = parseInt(inputValue, 10);
			_setBlockNumber(numValue);
		} else {
			e.target.value = _blockNumber !== null ? _blockNumber.toString() : '';
		}
	};

	const handleContractAddressChange = async (index: number, newAddress: string) => {
		const newCalls = [..._contractCalls];
		const oldAddress = newCalls[index].address;

		newCalls[index] = {
			...newCalls[index],
			address: newAddress,
			function_name: ''
		};

		_setContractCalls(newCalls);

		if (
			newAddress &&
			validateHexFormat(newAddress) &&
			newAddress !== oldAddress &&
			_chain?.chainId &&
			!contractCallsFunctions[newAddress] &&
			!isLoadingFunctions[newAddress]
		) {
			await fetchFunctionsForContractAddress(newAddress);
		}
	};

	const handleFunctionNameChange = (index: number, newFunctionName: string) => {
		_setContractCalls((prevCalls) => {
			return prevCalls.map((call, idx) => {
				if (idx === index) {
					return {
						address: call.address,
						function_name: newFunctionName,
						calldata: ''
					};
				}
				return call;
			});
		});

		setDecodeCalldata((prevData) => {
			if (!prevData) return prevData;

			const updatedData = { ...prevData };
			updatedData.decoded_calldata = [...prevData.decoded_calldata];

			const contractAddress = _contractCalls[index].address;
			const functions = contractCallsFunctions[contractAddress];

			if (!functions || !newFunctionName) {
				updatedData.decoded_calldata[index] = {
					contract_address: contractAddress,
					function_selector: newFunctionName,
					function_name: '',
					parameters: []
				};
				return updatedData;
			}

			const functionData = functions.find((fn: any) => fn[0] === newFunctionName);

			if (!functionData) {
				updatedData.decoded_calldata[index] = {
					contract_address: contractAddress,
					function_selector: newFunctionName,
					function_name: '',
					parameters: []
				};
				return updatedData;
			}

			const functionInfo = functionData[1];
			const parameters = flattenParameters(functionInfo?.inputs || []);

			updatedData.decoded_calldata[index] = {
				contract_address: contractAddress,
				function_selector: functionData[0],
				function_name: functionInfo.name,
				parameters
			};

			return updatedData;
		});
	};

	const handleCalldataChange = (index: number, newCalldata: string) => {
		const newCalls = [..._contractCalls];
		newCalls[index] = {
			...newCalls[index],
			calldata: newCalldata
		};
		_setContractCalls(newCalls);

		setServerDataLoaded(false);
	};

	const handleTabChange = async (newTab: string) => {
		setActiveTabs(newTab);

		if (newTab === 'parameters') {
			const hasAnyRawCalldata = _contractCalls.some(
				(call) => call.calldata && call.calldata.trim() !== ''
			);

			const hasExistingErrors = Object.keys(calldataDecodeError).length > 0;

			if (
				!hasAnyRawCalldata ||
				serverDataLoaded ||
				hasExistingErrors ||
				!_senderAddress ||
				!_blockNumber ||
				!_chain?.chainId
			) {
				return;
			}

			const callsWithCalldata = _contractCalls.filter(
				(call) => call.calldata && call.calldata.trim() !== ''
			);
			const combinedCalldata = callsWithCalldata
				.map((call) => call.calldata?.trim() || '')
				.join(',');

			try {
				const response = await fetchContractDecodeCalldata({
					tx_hash: txHash,
					sender_address: _senderAddress,
					calldata: combinedCalldata,
					block_number: _blockNumber,
					chain_id: _chain.chainId,
					transaction_version: _transactionVersion
				});

				if (response && typeof response === 'object') {
					const normalizedData = normalizeDecodedCalldata(response);
					setDecodeCalldata(normalizedData);
					setServerDataLoaded(true);
					setCalldataDecodeError({});
				}
			} catch (error) {
				console.error('Error decoding calldata:', error);
				const errorMap: { [key: number]: boolean } = {};
				_contractCalls.forEach((call, index) => {
					if (call.calldata && call.calldata.trim() !== '') {
						errorMap[index] = true;
					}
				});
				setCalldataDecodeError(errorMap);

				toast({
					title: 'Error',
					description: 'Failed to decode raw calldata. Please check your input.',
					variant: 'destructive'
				});
			}
		}
	};

	const handleResetCalldata = (index: number) => {
		const newCalls = [..._contractCalls];
		newCalls[index] = {
			...newCalls[index],
			calldata: ''
		};
		_setContractCalls(newCalls);

		const newErrors = { ...calldataDecodeError };
		delete newErrors[index];
		setCalldataDecodeError(newErrors);
	};

	const handleParameterValueChange = (callIndex: number, paramIndex: number, newValue: any) => {
		setDecodeCalldata((prevData) => {
			if (!prevData) return prevData;

			const updatedData = { ...prevData };
			updatedData.decoded_calldata = [...prevData.decoded_calldata];
			updatedData.decoded_calldata[callIndex] = {
				...prevData.decoded_calldata[callIndex],
				parameters: [...prevData.decoded_calldata[callIndex].parameters]
			};

			const parameter = updatedData.decoded_calldata[callIndex].parameters[paramIndex];
			const contractAddress = _contractCalls[callIndex].address;
			const functionName = _contractCalls[callIndex].function_name;
			const functions = contractCallsFunctions[contractAddress];
			const functionData = functions?.find((fn: any) => fn[0] === functionName);
			const functionInput = functionData?.[1]?.inputs?.[paramIndex];

			let finalValue = newValue;
			let newTypeName: string;

			if (typeof newValue === 'object' && newValue !== null && '__enum_variant' in newValue) {
				const enumBase = parameter.type_name.includes('::')
					? parameter.type_name.split('::')[0]
					: functionInput?.type || parameter.type_name;
				newTypeName = `${enumBase}::${newValue.__enum_variant}`;

				if ('__enum_value' in newValue) {
					finalValue = newValue.__enum_value;
				} else {
					const { __enum_variant, ...rest } = newValue;
					finalValue = rest;
				}
			} else if (functionInput?.enum_variants && typeof newValue === 'string') {
				const enumBase = parameter.type_name.includes('::')
					? parameter.type_name.split('::')[0]
					: parameter.type_name;
				newTypeName = `${enumBase}::${newValue}`;
			} else {
				newTypeName = parameter.type_name.includes('::')
					? parameter.type_name.split('::')[0]
					: parameter.type_name;
			}

			updatedData.decoded_calldata[callIndex].parameters[paramIndex] = {
				...parameter,
				type_name: newTypeName,
				value: finalValue
			};

			return updatedData;
		});
	};

	const onDialogSubmit = async () => {
		if (activeTabs === 'parameters' && decodeCalldata) {
			await handleParameterSubmission(
				_senderAddress,
				decodeCalldata,
				_blockNumber,
				_transactionVersion,
				_chain,
				setIsSimulating,
				setAlert
			);
		} else {
			await handleRawSubmission(
				_senderAddress,
				_contractCalls,
				_blockNumber,
				_transactionVersion,
				_chain,
				setAlert
			);
		}
	};

	return (
		<>
			<HeaderNav />
			<main className="overflow-y-scroll h-[calc(100vh-650px)] xl:flex xl:justify-between flex-grow relative">
				<div className="left-8 px-4 py-8 xl:block hidden">
					<Button onClick={() => router.back()} variant="outline">
						<ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
					</Button>
				</div>
				<div className="xl:hidden block px-4 py-8">
					<Button onClick={() => router.back()} variant="outline">
						<ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
					</Button>
				</div>

				<div className="w-full flex justify-center">
					<div className="w-full max-w-5xl px-4 py-8">
						<div className="mb-6">
							<div className="flex flex-col gap-2">
								<h1 className="text-xl font-medium flex flex-nowrap items-center">
									{title}
									{txHash && (
										<CopyToClipboardElement
											value={txHash}
											toastDescription="The address has been copied."
										>
											{shortenHash(txHash)}
										</CopyToClipboardElement>
									)}
								</h1>
								<h3 className="text-muted-foreground">{description}</h3>
							</div>
						</div>

						<div className="rounded-lg py-4">
							<div className="grid gap-6">
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor="chain-id" className="text-right">
										Network
									</Label>
									<NetworksSelect
										isLoading={isLoading}
										simulationPayload={simulationPayload}
										onChainChangedCallback={onChainChangedCallback}
									/>
								</div>

								<div className="grid grid-cols-4 items-center gap-y-2 gap-x-4">
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
											'border-red-500'
										}`}
									/>
									{alert && _senderAddress === '' && (
										<p className="text-xs text-muted-foreground text-red-500 col-span-3 col-start-2">
											Sender address is required.
										</p>
									)}
									{alert && !validateHexFormat(_senderAddress) && (
										<p className="text-xs text-muted-foreground text-red-500 col-span-3 col-start-2">
											Sender address must be a hexadecimal number.
										</p>
									)}
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
											alert && _numberOfContracts < 1 && 'border-red-500'
										}`}
									/>
								</div>

								<Tabs defaultValue="parameters" onValueChange={handleTabChange}>
									<div className="grid grid-cols-4 items-center gap-4">
										<Label className="text-right">Calldata mode</Label>

										<TabsList className="flex md:inline-flex col-span-3 w-fit dark:bg-card !justify-start md:justify-center flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-rounded">
											<TabsTrigger value="raw">Raw</TabsTrigger>
											<TabsTrigger value="parameters">Parameters</TabsTrigger>
										</TabsList>
									</div>

									{_contractCalls.map((call, index) => (
										<ContractCallFieldset
											key={`${index}-${call.address}-${call.function_name}`}
											call={call}
											index={index}
											chain={_chain}
											contractCallsFunctions={contractCallsFunctions}
											isLoadingFunctions={isLoadingFunctions}
											contractFetchErrors={contractFetchErrors}
											alert={alert}
											decodeCalldata={decodeCalldata}
											serverDataLoaded={serverDataLoaded}
											isParameterInvalid={isParameterInvalid}
											hasDecodeError={calldataDecodeError[index] || false}
											onContractAddressChange={handleContractAddressChange}
											onFunctionNameChange={handleFunctionNameChange}
											onCalldataChange={handleCalldataChange}
											onParameterValueChange={handleParameterValueChange}
											onValidationChange={(isValid) => setIsParameterInvalid(!isValid)}
											onResetCalldata={handleResetCalldata}
										/>
									))}
								</Tabs>

								<div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
									<Label htmlFor="block-number" className="text-right">
										Block number
									</Label>
									<Input
										type="text"
										inputMode="numeric"
										id="block-number"
										value={_blockNumber ?? ''}
										onChange={handleBlockNumberChange}
										className="col-span-3 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

								{alert && (
									<FieldAlert
										senderAddress={_senderAddress}
										contractCalls={_contractCalls}
										transactionVersion={_transactionVersion}
									/>
								)}

								<div className="flex justify-end mt-4 mb-12">
									<Button
										type="submit"
										onClick={onDialogSubmit}
										disabled={isParameterInvalid || isSimulating}
									>
										{isSimulating ? (
											<>
												<span className="h-4 w-4 block rounded-full border-2 border-t-transparent animate-spin mr-2"></span>
												Simulating...
											</>
										) : (
											<>
												<PlayIcon className="w-4 h-4 mr-2" /> Run Simulation
											</>
										)}
									</Button>
								</div>
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
