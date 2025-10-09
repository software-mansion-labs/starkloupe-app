import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { TabsContent } from '../ui/tabs';
import { Button } from '@/components/ui/button';
import { EntryPointSelect } from '../entry-point-select';
import { ParameterInput } from './parameter-input';
import { Chain } from '@/components/networks-select';
import { SimpleContractCall } from '@/lib/utils';
import { StarknetTransactionData } from '@/lib/contracts';
import { validateHexFormat, validateCalldataString } from '../../lib/utils/validation-utils';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface ContractCallFieldsetProps {
	call: SimpleContractCall;
	index: number;
	chain: Chain | undefined;
	contractCallsFunctions: { [key: string]: any };
	isLoadingFunctions: { [key: string]: boolean };
	contractFetchErrors: { [key: string]: string };
	alert: boolean;
	decodeCalldata: StarknetTransactionData | undefined;
	serverDataLoaded: boolean;
	isParameterInvalid: boolean;
	hasDecodeError: boolean;
	onContractAddressChange: (index: number, newAddress: string) => void;
	onFunctionNameChange: (index: number, newFunctionName: string) => void;
	onCalldataChange: (index: number, newCalldata: string) => void;
	onParameterValueChange: (callIndex: number, paramIndex: number, newValue: any) => void;
	onValidationChange: (isValid: boolean) => void;
	onResetCalldata: (index: number) => void;
}

export function ContractCallFieldset({
	call,
	index,
	chain,
	contractCallsFunctions,
	isLoadingFunctions,
	contractFetchErrors,
	alert,
	decodeCalldata,
	serverDataLoaded,
	hasDecodeError,
	onContractAddressChange,
	onFunctionNameChange,
	onCalldataChange,
	onParameterValueChange,
	onValidationChange,
	onResetCalldata
}: ContractCallFieldsetProps) {
	const hasInvalidCalldataFormat = call.calldata !== '' && !validateCalldataString(call.calldata);
	const contractError = call.address ? contractFetchErrors[call.address] : undefined;
	const hasContractError = !!contractError && validateHexFormat(call.address);

	return (
		<fieldset
			key={`${index}-${call.address}-${call.function_name}`}
			className="border rounded-md p-4"
		>
			<legend className="px-2 font-medium text-sm">Call #{index + 1}</legend>
			<div className="grid gap-4">
				<div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
					<Label htmlFor={`contract-address-${index}`} className="text-right">
						Contract address
					</Label>
					<Input
						id={`contract-address-${index}`}
						value={call.address}
						onChange={(e) => onContractAddressChange(index, e.target.value)}
						className={`col-span-3 font-mono ${
							(alert &&
								(!call.address ||
									!validateHexFormat(call.address) ||
									!contractCallsFunctions[call.address])) ||
							hasContractError
								? 'border-red-500'
								: ''
						}`}
					/>
					{alert && !call.address && (
						<p className="text-xs text-red-500 col-span-3 col-start-2">
							Contract address is required.
						</p>
					)}
					{alert && call.address && !validateHexFormat(call.address) && (
						<p className="text-xs text-red-500 col-span-3 col-start-2">
							Contract address must be a hexadecimal number.
						</p>
					)}
					{hasContractError && (
						<p className="text-xs text-red-500 col-span-3 col-start-2">{contractError}</p>
					)}
					{alert &&
						!contractCallsFunctions[call.address] &&
						!hasContractError &&
						call.address &&
						validateHexFormat(call.address) && (
							<p className="text-xs text-red-500 col-span-3 col-start-2">
								This contract is not deployed on {chain?.chainId}.
							</p>
						)}
				</div>

				<EntryPointSelect
					chain={chain}
					entryPoints={call.address ? contractCallsFunctions[call.address] : null}
					value={call.function_name}
					isLoading={call.address ? isLoadingFunctions[call.address] : false}
					isError={alert && call.function_name === ''}
					onChange={(value) => onFunctionNameChange(index, value)}
				/>

				<TabsContent value="raw" className="grid grid-cols-4 items-center gap-y-2 gap-x-4">
					<Label htmlFor={`calldata-${index}`} className="text-right">
						Calldata
					</Label>
					<Textarea
						disabled={call.function_name === ''}
						id={`calldata-${index}`}
						value={call.calldata}
						placeholder={`Enter raw calldata here. For example:\n\n0x0000000000000000000000000000000000000000000000000000000000000001\n0x014c52727fc025f10d431efafb3945a06601e3703fc06c934df177a6c30f3280\n0x02f67e6aeaad1ab7487a680eb9d3363a597afa7a3de33fa9bf3ae6edcb88435d`}
						className={`col-span-3 font-mono h-32 ${
							alert && call.address && hasInvalidCalldataFormat ? 'border-red-500' : ''
						}`}
						onChange={(e) => onCalldataChange(index, e.target.value)}
					/>

					{alert && hasInvalidCalldataFormat && (
						<p className="text-xs text-red-500 col-span-3 col-start-2">
							Calldata must be a list of hexadecimal numbers, each starting with 0x on a new line.
						</p>
					)}
				</TabsContent>
			</div>

			<TabsContent value="parameters" className="grid grid-cols-4 items-center gap-y-2 gap-x-4">
				<Label htmlFor={`calldata-${index}-parameters`} className="text-right">
					Calldata
				</Label>
				{decodeCalldata && decodeCalldata?.decoded_calldata[index]?.parameters?.length > 0 ? (
					<div key={`border-${index}-parameter`} className="col-span-3 space-y-4">
						{(() => {
							const parameters = decodeCalldata?.decoded_calldata[index]?.parameters || [];
							const functionData = contractCallsFunctions[call.address]?.find(
								(fn: any) => fn[0] === call.function_name
							);

							const grouped: { structName?: string; structType?: string; params: any[] }[] = [];
							const structPrefixes = new Map<string, { type: string; params: any[] }>();

							parameters.forEach((parameter: any, idx: number) => {
								if (parameter._struct_info) {
									const structName = parameter._struct_info.name;

									if (!structPrefixes.has(structName)) {
										structPrefixes.set(structName, {
											type: parameter._struct_info.type,
											params: []
										});
									}
									structPrefixes.get(structName)!.params.push({ parameter, idx });
								} else {
									grouped.push({
										params: [{ parameter, idx }]
									});
								}
							});

							structPrefixes.forEach((value, structName) => {
								grouped.push({
									structName,
									structType: value.type,
									params: value.params
								});
							});

							grouped.sort((a, b) => {
								const aFirstIdx = a.params[0].idx;
								const bFirstIdx = b.params[0].idx;
								return aFirstIdx - bFirstIdx;
							});

							return grouped.map((group, groupIdx) => {
								const functionInput = serverDataLoaded
									? undefined
									: functionData?.[1]?.inputs?.[group.params[0].idx];

								if (group.structName) {
									return (
										<div key={`group-${groupIdx}`} className="border rounded-lg p-4 space-y-3">
											<div className="flex items-center justify-between border-b pb-2 mb-3">
												<Label className="font-medium text-base">{group.structName}</Label>
												<span className="text-xs text-muted-foreground">{group.structType}</span>
											</div>
											<Label className="text-sm text-muted-foreground">Struct members</Label>
											<div className="space-y-3 pl-4">
												{group.params.map(({ parameter, idx }) => {
													const displayParameter = {
														...parameter,
														name: parameter.name.replace(new RegExp(`^${group.structName}_`), '')
													};

													let paramFunctionInput = undefined;
													if (functionData) {
														const structInput = functionData[1]?.inputs?.find(
															(input: any) => input.name === group.structName
														);
														if (structInput?.struct_members) {
															paramFunctionInput = structInput.struct_members.find(
																(member: any) => member.name === displayParameter.name
															);
														}
													}

													return (
														<ParameterInput
															key={`${index}-${idx}-${serverDataLoaded}`}
															parameter={displayParameter}
															functionInput={paramFunctionInput}
															onValidationChange={onValidationChange}
															onValueChange={(newValue) =>
																onParameterValueChange(index, idx, newValue)
															}
														/>
													);
												})}
											</div>
										</div>
									);
								} else {
									const { parameter, idx } = group.params[0];

									let paramFunctionInput = functionInput;
									if (!paramFunctionInput && functionData) {
										paramFunctionInput = functionData[1]?.inputs?.find(
											(input: any) => input.name === parameter.name
										);
									}

									return (
										<div key={`${index}-${idx}-${serverDataLoaded}`}>
											<ParameterInput
												parameter={parameter}
												functionInput={paramFunctionInput}
												onValidationChange={onValidationChange}
												onValueChange={(newValue) => onParameterValueChange(index, idx, newValue)}
											/>
										</div>
									);
								}
							});
						})()}
					</div>
				) : hasDecodeError ? (
					<div className="col-span-3 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
									<XCircleIcon className="w-5 h-5" />
									<p className="font-medium">Invalid Calldata</p>
								</div>
								<p className="text-sm text-red-600/80 dark:text-red-400/80">
									The raw calldata provided could not be decoded. Please check your input or reset
									calldata to default values.
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onResetCalldata(index)}
								className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
							>
								Reset
							</Button>
						</div>
					</div>
				) : (
					<div className="text-sm text-muted-foreground">No parameters</div>
				)}
			</TabsContent>
		</fieldset>
	);
}
