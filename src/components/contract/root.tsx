import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCallback, useState } from 'react';
import { ClassSourceCode } from '../class-source-code';
import { EntrypointsList } from './entrypoints-list';
import { ContractFunctions } from '@/lib/contracts';
import EntryPointsSearch from '../ui/entrypoints-search';

export function ContractRoot({
	isClassVerified,
	sourceCode,
	isContract,
	entryPoints
}: {
	isClassVerified: boolean;
	sourceCode: any;
	isContract: boolean;
	entryPoints: ContractFunctions | undefined;
}) {
	return (
		<ContractRootContent
			isClassVerified={isClassVerified}
			sourceCode={sourceCode}
			isContract={true}
			entryPoints={entryPoints}
		/>
	);
}

function ContractRootContent({
	isClassVerified,
	sourceCode,
	isContract,
	entryPoints
}: {
	isClassVerified: boolean;
	sourceCode: any;
	isContract: boolean;
	entryPoints: ContractFunctions | undefined;
}) {
	const [activeTab, setActiveTab] = useState('source-code');

	const onValueChange = (tab: string) => {
		setActiveTab(tab);
	};

	return (
		<>
			<div className={`mt-12  h-full flex flex-col overflow-hidden`}>
				<Tabs
					value={activeTab}
					onValueChange={onValueChange}
					className="flex flex-col flex-1 overflow-hidden min-h-0"
				>
					<TabsList className="flex md:inline-flex md:w-fit dark:bg-card !justify-start md:justify-center flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-rounded">
						<TabsTrigger value="source-code">Source Code</TabsTrigger>
						<TabsTrigger value="entrypoints">Entrypoints</TabsTrigger>
					</TabsList>
					<TabsContent
						value="source-code"
						className={`h-full flex flex-col flex-1 overflow-hidden min-h-0 ${
							activeTab !== 'source-code' ? 'hidden' : ''
						}`}
					>
						<div className="whitespace-nowrap rounded-xl border flex flex-col flex-1 overflow-hidden min-h-0 dark:bg-card">
							<ClassSourceCode
								isClassVerified={isClassVerified}
								sourceCode={sourceCode}
								isContract={isContract}
							/>
						</div>
					</TabsContent>
					<TabsContent
						value="entrypoints"
						className={`h-full flex flex-col flex-1 overflow-hidden min-h-0 ${
							activeTab !== 'entrypoints' ? 'hidden' : ''
						}`}
					>
						<div className="rounded-xl border flex flex-col flex-1 overflow-hidden min-h-0 text-xs dark:bg-card">
							<div className="border-b shadow-sm flex-none">
								<div className="flex justify-between w-full items-center px-4">
									<EntryPointsSearch entryPoints={entryPoints} />
								</div>
							</div>
							<ScrollArea className="flex-1 overflow-auto">
								<div className="p-0 py-2">
									<EntrypointsList entryPoints={entryPoints} />
								</div>
								<ScrollBar orientation="horizontal" />
							</ScrollArea>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
