import { useEffect, useState } from 'react';
import { DecodedItem, DataDecoded, DataType } from '@/lib/simulation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Card } from './ui/card';
import { isHexFormat } from '@/lib/utils';

export function DecodeDataTable({ decodeData, type }: { decodeData: DataDecoded; type: DataType }) {
	const hasNameField = decodeData.some((item: DecodedItem) => 'name' in item);
	const [displayFormat, setDisplayFormat] = useState<'hex' | 'dec'>('hex');

	useEffect(() => {
		const hasHex = decodeData.some((item: DecodedItem) => {
			if (typeof item.value === 'string') {
				return isHexFormat(item.value);
			} else if (Array.isArray(item.value)) {
				return item.value.some((nestedItem) => isHexFormat(nestedItem.toString()));
			}
			return false;
		});

		if (!hasHex) {
			setDisplayFormat('dec');
		}
	}, [decodeData]);

	const isObjectArray = (value: any[]): boolean => {
		return (
			Array.isArray(value) &&
			value.some(
				(item) => typeof item === 'object' && item !== null && 'type' in item && 'value' in item
			)
		);
	};

	const formatHexDecValue = (value: string): string => {
		if (displayFormat === 'dec') {
			if (value.startsWith('0x')) {
				return BigInt(value).toString(10);
			}
		} else if (displayFormat === 'hex') {
			if (!value.startsWith('0x') && /^\d+$/.test(value)) {
				return '0x' + BigInt(value).toString(16);
			}
		}
		return value;
	};

	const renderValue = (value: any): JSX.Element => {
		if (Array.isArray(value)) {
			if (isObjectArray(value)) {
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
							{value.map((item: any, index: number) => (
								<TableRow key={index}>
									{item.name && (
										<TableCell className="whitespace-break-spaces">{item.name}</TableCell>
									)}
									<TableCell className="whitespace-break-spaces">{item.type}</TableCell>
									<TableCell>{renderValue(item.value)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				);
			} else {
				return (
					<ul>
						{value.map((item: any) => (
							<li key={item}>{renderValue(item)}</li>
						))}
					</ul>
				);
			}
		} else if (typeof value === 'object' && value !== null) {
			return (
				<Table className="text-xs">
					<TableBody className="font-mono">
						{Object.entries(value).map(([key, val]: [string, any]) => (
							<TableRow key={key}>
								<TableCell>{renderValue(val)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			);
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
					value={displayFormat}
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
			<Card className="w-fit">
				<Table className="w-auto py-0.5 px-2 text-xs">
					<TableHeader>
						<TableRow>
							{type === DataType.INPUT && hasNameField && (
								<TableHead className="whitespace-break-spaces">Name</TableHead>
							)}
							<TableHead>Type</TableHead>
							<TableHead>Value</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{decodeData.map((item: DecodedItem, index: number) => (
							<TableRow key={index}>
								{type === DataType.INPUT && item.name && (
									<TableCell className="border-r border-neutral-200 last:border-r-0 whitespace-break-spaces">
										{item.name}
									</TableCell>
								)}
								<TableCell className="border-r border-neutral-200 last:border-r-0 whitespace-break-spaces">
									{item.type}
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
