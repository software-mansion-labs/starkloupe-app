import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useTheme } from 'next-themes';
import MonacoEditor from '@monaco-editor/react';
import { cn, copyToClipboard } from '@/lib/utils';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { toast } from '../hooks/use-toast';

export function ABIList({ abi }: { abi: string }) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	if (abi.length === 0) {
		return (
			<Alert className="mx-4 mt-4 w-fit">
				<ExclamationTriangleIcon className="h-5 w-5" />
				<AlertTitle>No Abi.</AlertTitle>
				<AlertDescription>No abi for this contract.</AlertDescription>
			</Alert>
		);
	}

	const formattedAbi = (() => {
		try {
			const parsed = JSON.parse(abi);
			return JSON.stringify(parsed, null, 2);
		} catch {
			return abi;
		}
	})();

	return (
		<div className="flex flex-col flex-1 min-h-0 h-full relative">
			<div className="flex-1 min-h-0 relative">
				<Button
					onClick={() => {
						copyToClipboard(formattedAbi);
						toast({ description: 'ABI code has been copied!' });
					}}
					variant="outline"
					className="flex items-center gap-2 text-xs absolute top-2 right-5 z-10 bg-opacity-40"
				>
					<DocumentDuplicateIcon className="w-4 h-4" />
					<span className="md:block hidden">Copy ABI code</span>
				</Button>
				<MonacoEditor
					theme={isDark ? 'vs-dark' : 'vs-light'}
					options={{
						minimap: { enabled: false },
						wordBreak: 'keepAll',
						readOnly: true,
						glyphMargin: true,
						smoothScrolling: true,
						lineNumbers: 'on',
						lineNumbersMinChars: 3,
						lineDecorationsWidth: 15,
						scrollBeyondLastLine: false,
						automaticLayout: true
					}}
					value={formattedAbi}
					language="json"
					className="w-full h-full"
				/>
			</div>
		</div>
	);
}
