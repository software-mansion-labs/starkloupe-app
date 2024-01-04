import { CommonError } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useRouter } from 'next/navigation';
import CryptoJS from 'crypto-js';
import Link from 'next/link';

export default function CommonErrorsTable({
	commonErrors,
	projectSlug
}: {
	commonErrors: CommonError[];
	projectSlug: string;
}) {
	const router = useRouter();

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="whitespace-nowrap">Count</TableHead>
					<TableHead>Error message</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody className="font-mono">
				{commonErrors.map((error) => (
					<Link
						key={error.error_message}
						href={`/monitoring/project/${projectSlug}/error/${CryptoJS.MD5(
							error.error_message
						).toString()}`}
						className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted table-row"
					>
						<TableCell className="whitespace-nowrap">{error.error_count}</TableCell>
						<TableCell className="flex flex-row items-center whitespace-nowrap">
							{error.error_message}
						</TableCell>
					</Link>
				))}
			</TableBody>
		</Table>
	);
}
