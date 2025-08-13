import { useState } from 'react';
import { DecodedItem, DataDecoded, DataType } from '@/lib/simulation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Card } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import AddressLink from './address-link';
import CopyToClipboardElement from './ui/copy-to-clipboard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { useSettings } from '@/lib/context/settings-context-provider';

export function DecodeDataTable({
	rawData,
	decodeData,
	type
}: {
	rawData?: string[];
	decodeData: DataDecoded | null | undefined;
	type: DataType;
}) {
	const [displayFormat, setDisplayFormat] = useState<'auto' | 'raw'>(decodeData ? 'auto' : 'raw');

	const { customSettings } = useSettings();
	const isObject = (value: any): boolean => {
		return (
			typeof value === 'object' &&
			value !== null &&
			(('name' in value && 'type_name' in value && 'value' in value) ||
				Object.keys(value).every((key) => !isNaN(Number(key))))
		);
	};

	const formatValue = (value: any): string => {
		if (displayFormat == 'auto') {
			if (typeof value === 'boolean') {
				return value ? 'true' : 'false';
			}
		}

		return value;
	};

	const renderValue = (value: any): JSX.Element => {
		if (Array.isArray(value)) {
			return (
				<div className="pl-4">
					[
					{value.map((item, index) => (
						<div key={index} className="my-1.5 ml-2">
							{renderValue(item)}
						</div>
					))}
					]
				</div>
			);
		} else if (typeof value === 'object' && value !== null) {
			// Handle object values
			if (isObject(value)) {
				return (
					<Table className="text-xs">
						<TableHeader>
							<TableRow>
								{type === DataType.CALLDATA && <TableHead>Name</TableHead>}
								<TableHead>Type</TableHead>
								<TableHead>Value</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody className="font-mono">
							{Object.entries(value).map(([key, item]) => (
								<TableRow key={key}>
									{type === DataType.CALLDATA && (item as { name: string }).name != null && (
										<TableCell className="whitespace-break-spaces">
											{(item as { name: string }).name}
										</TableCell>
									)}
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
			const formattedValue = formatValue(value);
			return formattedValue?.startsWith('0x') ? (
				<CopyToClipboardElement
					value={formattedValue}
					className="py-1 px-0"
					toastDescription="Value has been copied!"
				>
					<AddressLink
						address={formattedValue}
						customSettings={customSettings}
						addressClassName="cursor-pointer"
					>
						{formattedValue}
					</AddressLink>
				</CopyToClipboardElement>
			) : (
				<span>{formattedValue}</span>
			);
		}
	};

	const [isRawDataExpanded, setIsRawDataExpanded] = useState(false);

	const toggleRawData = () => {
		setIsRawDataExpanded(!isRawDataExpanded);
	};

	const getCollapsedRawData = (data: string[]) => {
		const allData = data.join(', ');
		if (allData.length <= 8) return allData;
		return `[${allData.slice(0, 4)}...${allData.slice(-4)}]`;
	};

	return (
		<div className="my-4">
			<div className="flex flex-raw items-center mb-1">
				<div className="font-medium uppercase mr-2">{type}</div>
				{(type === DataType.CALLDATA || type === DataType.OUTPUT) && (
					<ToggleGroup
						type="single"
						size={'sm'}
						value={displayFormat}
						variant="outline"
						className={`mb-1 ${type === DataType.OUTPUT && 'invisible'}`}
						defaultValue="auto"
						aria-label="Native or Raw Toggle"
						onValueChange={(value) => setDisplayFormat(value as 'auto' | 'raw')}
					>
						{decodeData && (
							<ToggleGroupItem value="auto" aria-label="Auto">
								Auto
							</ToggleGroupItem>
						)}

						<ToggleGroupItem value="raw" aria-label="Raw">
							Raw
						</ToggleGroupItem>
					</ToggleGroup>
				)}
			</div>
			<Card>
				{(!rawData || rawData.length === 0) && (!decodeData || decodeData.length === 0) ? (
					<ScrollArea className="overflow-auto">
						<Table className="w-auto py-0.5 px-2 text-xs w-full">
							<TableBody>
								<TableRow>
									<TableCell
										colSpan={type === DataType.CALLDATA ? 3 : 2}
										className="text-center py-4 whitespace-nowrap"
									>
										No data
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				) : (displayFormat === 'raw' || !decodeData) &&
				  type === DataType.CALLDATA &&
				  rawData &&
				  rawData.length > 0 ? (
					<ScrollArea className="overflow-auto">
						<Table className="w-auto py-0.5 px-2 text-xs w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="whitespace-break-spaces flex justify-between items-center">
										Value
										{!decodeData && (
											<Button variant={'ghost'} onClick={toggleRawData} className="text-xs">
												{isRawDataExpanded ? 'Collapse data' : 'Expand data'}
											</Button>
										)}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{!decodeData && !isRawDataExpanded ? (
									<TableRow className="cursor-pointer hover:bg-accent">
										<TableCell className="border-r last:border-r-0">
											<TooltipProvider>
												<Tooltip delayDuration={100}>
													<TooltipTrigger asChild>
														<div onClick={toggleRawData} className="w-full">
															{getCollapsedRawData(rawData)}
														</div>
													</TooltipTrigger>
													<TooltipContent className="bg-background border-border text-black dark:text-white border">
														Click to expand full data
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</TableCell>
									</TableRow>
								) : (
									rawData.map((item: string, index: number) => (
										<TableRow key={index}>
											<TableCell className="border-r last:border-r-0 whitespace-break-spaces">
												{item.startsWith('0x') ? (
													<CopyToClipboardElement
														value={item}
														className="py-1 px-0"
														toastDescription="Value has been copied!"
													>
														<AddressLink address={item} addressClassName="cursor-pointer">
															{item}
														</AddressLink>
													</CopyToClipboardElement>
												) : (
													item
												)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				) : (
					<ScrollArea className="overflow-auto">
						<Table className="w-auto py-0.5 px-2 text-xs">
							<TableHeader>
								<TableRow>
									{type === DataType.CALLDATA && (
										<TableHead className="whitespace-break-spaces">Name</TableHead>
									)}
									<TableHead>Type</TableHead>
									<TableHead>Value</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{decodeData &&
									decodeData.map((item: DecodedItem, index: number) => (
										<TableRow key={index}>
											{type === DataType.CALLDATA && (
												<TableCell className="border-r last:border-r-0 whitespace-break-spaces">
													{item.name}
												</TableCell>
											)}
											<TableCell className="border-r last:border-r-0 whitespace-break-spaces">
												{item.typeName}
											</TableCell>
											<TableCell className="border-r last:border-r-0 w-full">
												{renderValue(item.value)}
											</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</Card>
		</div>
	);
}
