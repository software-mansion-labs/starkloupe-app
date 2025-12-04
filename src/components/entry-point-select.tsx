import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from './ui/input';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Chain } from './networks-select';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

interface FunctionInput {
	name: string;
	type: string;
}

interface FunctionOutput {
	type: string;
	name?: string;
}

interface FunctionData {
	name: string;
	inputs: FunctionInput[];
	outputs: FunctionOutput[];
	state_mutability: string;
}

type EntryPointItem = [string, FunctionData];

function normalizeHexValue(value: string): string {
	if (!value || !value.startsWith('0x')) return value;

	try {
		const asBigInt = BigInt(value);
		return '0x' + asBigInt.toString(16);
	} catch (e) {
		return value;
	}
}

export function EntryPointSelect({
	entryPoints,
	value,
	onChange,
	chain,
	isLoading = false,
	isError = false
}: {
	entryPoints: EntryPointItem[] | null;
	value: string;
	chain: Chain | undefined;
	onChange: (value: string) => void;
	isLoading?: boolean;
	isError?: boolean;
}) {
	const normalizedInputValue = normalizeHexValue(value);

	const [entryPointsOptions, setEntryPointsOptions] = useState<
		{
			value: string;
			normalizedValue: string;
			label: string;
			data: FunctionData;
		}[]
	>([]);

	const [valueExistsInOptions, setValueExistsInOptions] = useState(false);

	const [selectedOption, setSelectedOption] = useState<
		| {
				value: string;
				normalizedValue: string;
				label: string;
				data: FunctionData;
		  }
		| undefined
	>(undefined);

	const [entrypointValue, setEntrypointValue] = useState<string>('');
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		if (!entryPoints) {
			setEntryPointsOptions([]);
			return;
		}

		const newOptions = entryPoints.map((entrypoint: EntryPointItem) => {
			const selector = entrypoint[0];
			const data = entrypoint[1];

			return {
				value: selector,
				normalizedValue: normalizeHexValue(selector),
				label: data.name,
				data: data
			};
		});

		setEntryPointsOptions(newOptions);
	}, [entryPoints]);

	useEffect(() => {
		if (entryPointsOptions.length === 0) {
			setEntrypointValue('');
		}
		const option = entryPointsOptions.find(
			(option) => option.normalizedValue === normalizedInputValue
		);

		setValueExistsInOptions(!!option);
		setSelectedOption(option);

		if (option) {
			setEntrypointValue(option.value);
			if (option.value !== value && normalizedInputValue === option.normalizedValue) {
				onChange(option.value);
			}
		} else {
			if (value && entryPointsOptions.length > 0) {
				const optionByName = entryPointsOptions.find((option) => option.label === value);
				if (optionByName) {
					setEntrypointValue(optionByName.value);
					onChange(optionByName.value);
				} else {
					setEntrypointValue('');
				}
			} else {
				setEntrypointValue('');
			}
		}
	}, [entryPointsOptions, normalizedInputValue, onChange, value]);

	const getSignatureString = () => {
		if (!selectedOption?.data) return null;

		const inputs = selectedOption.data.inputs
			.map((input) => `${input.name}: ${input.type}`)
			.join(', ');

		return `fn ${selectedOption.data.name}(${inputs})`;
	};

	const handleValueChange = (newValue: string) => {
		onChange(newValue);
		setOpen(false);
		setSearchQuery('');
	};

	const filteredOptions = entryPointsOptions.filter((option) => {
		const search = searchQuery.toLowerCase().trim();
		return (
			option.label.toLowerCase().includes(search) || option.value.toLowerCase().includes(search)
		);
	});

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-4 text-xs md:!items-center gap-x-4 gap-y-2">
				<Label className="md:text-right">Entrypoint</Label>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className={`md:col-span-3 justify-between font-mono ${
								isError && 'border-red-500'
							}`}
							disabled={entryPointsOptions.length === 0}
						>
							<span className="truncate text-left flex-1 min-w-0">
								{selectedOption
									? selectedOption.label
									: isLoading
									? 'Loading Entrypoints...'
									: !entryPointsOptions || entryPointsOptions.length === 0
									? `Enter a valid contract address above`
									: 'Select an Entrypoint'}
							</span>
							<CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
						<Command shouldFilter={false}>
							<CommandInput
								placeholder="Search entrypoint..."
								value={searchQuery}
								onValueChange={setSearchQuery}
							/>
							<CommandList>
								<ScrollArea className="overflow-auto">
									<CommandEmpty>No entrypoint found.</CommandEmpty>
									<CommandGroup>
										{filteredOptions.map((option) => (
											<CommandItem
												key={option.value}
												value={option.value}
												onSelect={() => handleValueChange(option.value)}
											>
												<Check
													className={`mr-2 h-4 w-4 ${
														entrypointValue === option.value ? 'opacity-100' : 'opacity-0'
													}`}
												/>
												<div className="flex justify-between w-full items-center">
													{' '}
													<div className="flex flex-col">
														<div className="font-medium">{option.label}</div>
														<div className="text-xs text-gray-500">{option.value}</div>
													</div>
													<div
														className={`w-14 border text-center text-xs px-1.5 py-0.5 rounded font-medium ${
															option.data.state_mutability === 'view'
																? 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200'
																: 'bg-gray-800 border-gray-900 text-white dark:bg-gray-300 dark:border-gray-400 dark:text-gray-900'
														}`}
													>
														{option.data.state_mutability === 'view' ? 'Read' : 'Write'}
													</div>
												</div>
											</CommandItem>
										))}
									</CommandGroup>
									<ScrollBar orientation="horizontal" />
								</ScrollArea>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{isError && (
					<p className="text-xs text-red-500 text-muted-foreground md:col-span-3 md:col-start-2">
						Entrypoint is required.
					</p>
				)}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 md:items-center gap-y-2 gap-x-4">
				<Label className="md:text-right">Entrypoint signature</Label>
				{selectedOption?.data ? (
					<Input value={getSignatureString() || ''} className="md:col-span-3 font-mono" readOnly />
				) : (
					<>
						<Input
							placeholder={'Select an Entrypoint above to see the signature'}
							className="md:col-span-3 font-mono"
							disabled={true}
							readOnly
						/>
					</>
				)}
				<p className="text-xs text-muted-foreground md:col-span-3 md:col-start-2">
					Automatically generated based on the selected Entrypoint.
				</p>
			</div>
		</>
	);
}
