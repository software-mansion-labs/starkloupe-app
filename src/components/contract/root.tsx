import { ContractResponseWithSourceCode } from '@/lib/contracts';
import { SourceFiles } from './source-files';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export function ContractRoot({ contractData }: { contractData: ContractResponseWithSourceCode }) {
	return (
		<div className="mt-12">
			<h2 className="text-sm font-medium mb-2">Contract Source Code</h2>
			<Card>
				<SourceFiles
					isClassVerified={contractData.isClassVerified}
					sourceCode={contractData.sourceCode}
				/>
			</Card>
		</div>
	);
}
