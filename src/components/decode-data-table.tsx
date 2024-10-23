import { useState } from 'react';
import { DecodedItem, DataDecoded, DataType } from '@/lib/simulation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Card } from './ui/card';

export function DecodeDataTable({ decodeData, type }: { decodeData: DataDecoded; type: DataType }) {
	const hasNameField = decodeData.some((item: DecodedItem) => 'name' in item);
	const [displayFormat, setDisplayFormat] = useState<'hex' | 'dec'>('hex');

	const isObject = (value: any): boolean => {
		return (
			typeof value === 'object' &&
			value !== null &&
			(('name' in value && 'type_name' in value && 'value' in value) ||
				Object.keys(value).every((key) => !isNaN(Number(key))))
		);
	};

	const formatHexDecValue = (value: string): string => {
		if (displayFormat === 'dec') {
			if (value.startsWith('0x')) {
				return BigInt(value).toString(10);
			}
		} else if (displayFormat === 'hex') {
			if (/^\d+$/.test(value)) {
				return '0x' + BigInt(value).toString(16);
			}
		}
		return value;
	};

	const renderValue = (value: any): JSX.Element => {
		if (Array.isArray(value)) {
			return (
				<div className="pl-4">
					{value.map((item, index) => (
						<div key={index}>{renderValue(item)}</div>
					))}
				</div>
			);
		} else if (typeof value === 'object' && value !== null) {
			// Handle object values
			if (isObject(value)) {
				// Existing code for known object structure
				return (
					<Table className="text-xs">
						<TableHeader>
							<TableRow>
								{hasNameField && <TableHead>Name</TableHead>}
								<TableHead>Type</TableHead>
								<TableHead>Value</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody className="font-mono">
							{Object.entries(value).map(([key, item]) => (
								<TableRow key={key}>
									<TableCell className="whitespace-break-spaces">
										{(item as { name: string }).name}
									</TableCell>
									<TableCell className="whitespace-break-spaces">
										{(item as { typeName: string }).typeName}
									</TableCell>
									<TableCell>{renderValue((item as { value: any }).value)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				);
			} else {
				// Handle other objects
				return (
					<div className="pl-4">
						{Object.entries(value).map(([key, val]) => (
							<div key={key}>
								{key}: {renderValue(val)}
							</div>
						))}
					</div>
				);
			}
		} else {
			const formattedHexDecValue = formatHexDecValue(value);
			return <span>{formattedHexDecValue}</span>;
		}
	};

	return (
		<div className="my-4">
			<div className="flex flex-raw items-center mb-1">
				<div className="font-medium uppercase mr-2">
					{type === DataType.INPUT ? 'Input params' : 'Output params'}
				</div>
				<ToggleGroup
					type="single"
					size={'sm'}
					variant="outline"
					className="mb-1"
					defaultValue="hex"
					aria-label="Hex or Decimal Toggle"
					onValueChange={(value) => setDisplayFormat(value as 'hex' | 'dec')}
				>
					<ToggleGroupItem value="hex" aria-label="Hexadecimal">
						Hex
					</ToggleGroupItem>
					<ToggleGroupItem value="dec" aria-label="Decimal">
						Decimal
					</ToggleGroupItem>
				</ToggleGroup>
			</div>
			<Card className="overflow-x-scroll">
				<Table className="w-auto py-0.5 px-2 text-xs">
					<TableHeader>
						<TableRow>
							{type === DataType.INPUT && (
								<TableHead className="whitespace-break-spaces">Name</TableHead>
							)}
							<TableHead>Type</TableHead>
							<TableHead>Value</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{decodeData?.map((item: DecodedItem, index: number) => (
							<TableRow key={index}>
								{type === DataType.INPUT && (
									<TableCell className="border-r border-neutral-200 last:border-r-0 whitespace-break-spaces">
										{item.name}
									</TableCell>
								)}
								<TableCell className="border-r border-neutral-200 last:border-r-0 whitespace-break-spaces">
									{item.typeName}
								</TableCell>
								<TableCell className="border-r border-neutral-200 last:border-r-0">
									{renderValue(item.value)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}
