import { SourceFiles } from './source-files';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { WALNUT_VERIFY_DOCS_URL } from '@/lib/config';

export function ClassSourceCode({
	isClassVerified,
	sourceCode,
	isContract
}: {
	isClassVerified: boolean;
	sourceCode: Record<string, string>;
	isContract: boolean;
}) {
	return (
		<div className="h-full">
			{isClassVerified && sourceCode ? (
				<SourceFiles sourceCode={sourceCode} />
			) : (
				<Alert className="m-4 py-4 w-fit min-w-[2rem]  gap-4">
					<ExclamationTriangleIcon className="h-5 w-5" />
					<AlertTitle>No source code for this {isContract ? 'contract' : 'class'}.</AlertTitle>
					<AlertDescription>
						<p>
							<span>Follow </span>
							<a
								href={WALNUT_VERIFY_DOCS_URL}
								className="text-blue-500 cursor-pointer"
								target="_blank"
								rel="noopener noreferrer"
							>
								this guide
							</a>
							<span> to verify the source code.</span>
						</p>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
