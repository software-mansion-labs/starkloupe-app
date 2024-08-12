'use client';

import { useEffect, useState } from 'react';
import { HeaderNav } from '../header';
import { Container } from '../ui/container';
import { Footer } from '../footer';
import { Loader } from '../ui/loader';
import { ChainId } from '@/lib/types';
import { InfoBoxItem, InfoBox } from '../ui/info-box';
import { Error } from '../ui/error';
import { fetchContractDataByAddress, ContractResponseWithSourceCode } from '@/lib/contracts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CodeViewer } from '../code-viewer/code-viewer';
import { CodeLocation } from '@/lib/simulation';
import { FilesExplorer } from '../code-viewer/file-explorer';

export function ContractPage({
	chainId,
	contractAddress
}: {
	chainId: string;
	contractAddress: string;
}) {
	const [contractData, setContractData] = useState<ContractResponseWithSourceCode>();
	const [error, setError] = useState<string | undefined>();
	const [activeFile, setActiveFile] = useState<string | undefined>('Scarb.toml');

	useEffect(() => {
		const fetchData = async () => {
			try {
				setContractData(
					await fetchContractDataByAddress({
						chainId: chainId as ChainId,
						contractAddress,
						includeSourceCode: true
					})
				);
			} catch (error: any) {
				setError(error.toString());
			}
		};

		fetchData();
	}, [chainId, contractAddress]);

	const handleFileClick = (file: string) => {
		setActiveFile(file);
	};

	return (
		<>
			<HeaderNav />
			<main>
				<Container>
					<div className="bg-white border-x border-b shadow-sm border-neutral-200 p-4 pb-0">
						<div className="flex flex-row items-baseline justify-between">
							<h1 className="text-l font-medium leading-6 mt-4 mb-2 mr-2">
								Contract {contractAddress}
							</h1>
						</div>
						{contractData && <ContractDetails contractData={contractData} />}
						{contractData ? (
							<SourceCode
								isClassVerified={contractData.isClassVerified}
								sourceCode={contractData.sourceCode}
								activeFile={activeFile}
								handleFileClick={handleFileClick}
							/>
						) : error ? (
							<Error message={error} />
						) : (
							<Loader />
						)}
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}

function ContractDetails({ contractData }: { contractData: ContractResponseWithSourceCode }) {
	const details: InfoBoxItem[] = [
		{
			name: 'Class hash',
			value: contractData.classHash
		},
		{
			name: 'Verified',
			value: contractData.isClassVerified.toString()
		}
	];

	return (
		<div className="mt-4 py-1 px-2 bg-neutral-100 rounded-sm flex flex-col">
			<InfoBox details={details} />
		</div>
	);
}

function SourceCode({
	isClassVerified,
	sourceCode,
	activeFile,
	handleFileClick
}: {
	isClassVerified: boolean;
	sourceCode: { [key: string]: string } | undefined;
	activeFile: string | undefined;
	handleFileClick: (file: string) => void;
}) {
	const initialCodeLocation: CodeLocation = {
		start: { line: 0, col: 0 },
		end: { line: 0, col: 0 },
		filePath: activeFile ? activeFile : ''
	};

	return (
		<div className="flex text-xs">
			{isClassVerified ? (
				sourceCode ? (
					<div className="w-full h-[500px] flex flex-row mt-4">
						<FilesExplorer
							classSourceCode={sourceCode}
							activeFile={activeFile}
							handleFileClick={handleFileClick}
						/>
						<div className="flex flex-col flex-grow">
							{activeFile && (
								<CodeViewer code={sourceCode[activeFile]} codeLocation={initialCodeLocation} />
							)}
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center w-full h-full">
						<Loader />
					</div>
				)
			) : (
				<Alert className="my-4 w-fit">
					<ExclamationTriangleIcon className="h-5 w-5" />
					<AlertTitle>No source code for this contract</AlertTitle>
					<AlertDescription>
						<p>
							<span>Follow </span>
							<a
								href={'https://foundry-rs.github.io/starknet-foundry/starknet/verify.html'}
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
