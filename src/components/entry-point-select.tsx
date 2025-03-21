import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Label } from '@/components/ui/label';

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
	isLoading = false
}: {
	entryPoints: EntryPointItem[] | null;
	value: string;
	onChange: (value: string) => void;
	isLoading?: boolean;
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

	const [safeValue, setSafeValue] = useState<string>('');

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
		const option = entryPointsOptions.find(
			(option) => option.normalizedValue === normalizedInputValue
		);

		setValueExistsInOptions(!!option);
		setSelectedOption(option);

		if (option) {
			setSafeValue(option.value);
			if (option.value !== value && normalizedInputValue === option.normalizedValue) {
				onChange(option.value);
			}
		} else {
			if (value && entryPointsOptions.length > 0) {
				const optionByName = entryPointsOptions.find((option) => option.label === value);
				if (optionByName) {
					setSafeValue(optionByName.value);
					onChange(optionByName.value);
				} else {
					setSafeValue('');
				}
			} else {
				setSafeValue('');
			}
		}
	}, [entryPointsOptions, normalizedInputValue, value, onChange]);

	const getSignatureString = () => {
		if (!selectedOption?.data) return null;

		const inputs = selectedOption.data.inputs
			.map((input) => `${input.name}: ${input.type}`)
			.join(', ');

		return `fn ${selectedOption.data.name}(${inputs})`;
	};

	const handleValueChange = (newValue: string) => {
		onChange(newValue);
	};

	return isLoading ? (
		<div className="grid grid-cols-4 !items-center gap-4">
			<Label className="text-right">Entrypoint</Label>
			<div className="col-span-3">
				<ArrowPathIcon className="w-5 h-5 animate-spin" />
			</div>
		</div>
	) : (
		<>
			<div className="grid grid-cols-4 !items-center gap-4">
				<Label className="text-right">Entrypoint</Label>
				<Select
					value={safeValue}
					onValueChange={handleValueChange}
					disabled={isLoading || entryPointsOptions.length === 0}
				>
					<SelectTrigger className="col-span-3 font-mono">
						<SelectValue placeholder="Select an entry point">
							{selectedOption
								? selectedOption.label
								: isLoading
								? 'Loading entry points...'
								: 'Select an entry point'}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{isLoading ? (
							<div className="p-2 text-sm text-gray-500">Loading entry points...</div>
						) : entryPointsOptions.length > 0 ? (
							entryPointsOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									<div className="font-medium">{option.label}</div>
									<div className="text-xs text-gray-500">{option.value}</div>
								</SelectItem>
							))
						) : (
							<div className="p-2 text-sm text-gray-500">No entry points available</div>
						)}
					</SelectContent>
				</Select>
			</div>
			<div className="grid grid-cols-4 !items-center gap-4">
				<Label className="text-right">Entrypoint signature</Label>
				{selectedOption?.data && (
					<div className="mt-2 p-2 col-span-3 font-semibold border border-dashed border-gray-300 break-words rounded font-mono text-sm">
						{getSignatureString()}
					</div>
				)}
			</div>
		</>
	);
}
