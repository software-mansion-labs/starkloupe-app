import { DecodedItem, CalldataDecoded, DataType } from '@/lib/simulation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function CalldataTable({ calldata, type }: { calldata: CalldataDecoded; type: DataType }) {
	const isObjectArray = (value: any[]): boolean => {
		return (
			Array.isArray(value) &&
			typeof value[0] === 'object' &&
			'type' in value[0] &&
			'name' in value[0] &&
			'value' in value[0]
		);
	};

	const renderValue = (value: any): JSX.Element => {
		if (Array.isArray(value)) {
			if (isObjectArray(value)) {
				return (
					<Table className="bg-neutral-50 border-b border-neutral-200">
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Value</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody className="font-mono">
							{value.map((item: any, index: number) => (
								<TableRow key={index}>
									<TableCell className="whitespace-break-spaces">{item.name}</TableCell>
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
						{value.map((item: any, index: number) => (
							<li key={index}>{renderValue(item)}</li>
						))}
					</ul>
				);
			}
		} else {
			return <span>{value}</span>;
		}
	};

	return (
		<Table className="mt-4 mb-4 py-1 px-2 bg-neutral-100 rounded-sm">
			<TableHeader>
				<TableRow>
					{type === DataType.INPUT ? (
						<TableHead className="whitespace-break-spaces">{DataType.INPUT}</TableHead>
					) : (
						<TableHead className="whitespace-break-spaces">{DataType.OUTPUT}</TableHead>
					)}
				</TableRow>
				<TableRow>
					{type === DataType.INPUT && (
						<TableHead className="whitespace-break-spaces">Name</TableHead>
					)}
					<TableHead>Type</TableHead>
					<TableHead>Value</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{calldata.map((item: DecodedItem, index: number) => (
					<TableRow key={index}>
						{type === DataType.INPUT && (
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
	);
}
