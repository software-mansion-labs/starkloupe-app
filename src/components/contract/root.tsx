import { useState } from 'react';
import { ContractResponseWithSourceCode } from '@/lib/contracts';
import { SourceFiles } from './source-files';

export type TabId = 'source-files';

export function ContractRoot({ contractData }: { contractData: ContractResponseWithSourceCode }) {
	const [activeTab, setActiveTab] = useState<TabId>('source-files');

	const tabs: { id: TabId; name: string }[] = [
		{
			id: 'source-files',
			name: 'Source files'
		}
	];

	return (
		<div className="pt-16">
			<div className="flex flex-row items-center border-b border-neutral-200 -mx-4 px-4">
				{tabs.map((tab) => (
					<div
						key={tab.id}
						className={`text-xs uppercase font-semibold cursor-pointer pb-2 border-b-2 -my-[1px] px-4 ${
							activeTab === tab.id
								? 'text-black border-black'
								: 'text-neutral-500 border-transparent'
						}`}
						onClick={() => setActiveTab(tab.id)}
					>
						{tab.name}
					</div>
				))}
			</div>
			<div className="overflow-x-auto whitespace-nowrap min-h-[20rem] -mx-4 text-xs">
				<div className="min-w-fit">
					{activeTab === 'source-files' && (
						<div className="mt-5">
							<SourceFiles
								isClassVerified={contractData.isClassVerified}
								sourceCode={contractData.sourceCode}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
