import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import React from 'react';
import { TraceLine } from '../call-trace';
import { ContractFunctions, EntryPointItem } from '@/lib/contracts';

export function EntrypointsList({ entryPoints }: { entryPoints: ContractFunctions | undefined }) {
	if (entryPoints?.entry_point_datas.length === 0) {
		return (
			<Alert className="mx-4 mt-2 w-fit">
				<ExclamationTriangleIcon className="h-5 w-5" />
				<AlertTitle>No events.</AlertTitle>
				<AlertDescription>No events emitted during this transaction.</AlertDescription>
			</Alert>
		);
	}

	let readEntrypoints: EntryPointItem[] = [];
	let writeEntrypoints: EntryPointItem[] = [];
	entryPoints?.entry_point_datas.forEach((entryPoint) => {
		if (entryPoint[1].state_mutability === 'external') {
			writeEntrypoints.push(entryPoint);
		} else {
			readEntrypoints.push(entryPoint);
		}
	});
	return (
		<div>
			<div className="flex flex-row w-full ">
				<div className="w-1/2 px-4">
					<div className="mb-2 text-sm">Read</div>
					<div className="border-b border-border mb-4"></div>
					{readEntrypoints.map((entryPoint, index) => (
						<EntryPoint
							key={`entrypoint-${index}-${entryPoint[0]}`}
							entryPoint={entryPoint}
							index={index}
							prefix="read"
						/>
					))}
				</div>
				<div className="border-l border-border "></div>
				<div className="w-1/2 px-4">
					<div className="mb-2 text-sm">Write</div>
					<div className="border-b border-border mb-4"></div>
					{writeEntrypoints.map((entryPoint, index) => (
						<EntryPoint
							key={`entrypoint-${index}-${entryPoint[0]}`}
							entryPoint={entryPoint}
							index={index}
							prefix="write"
						/>
					))}
				</div>
			</div>
		</div>
	);
}

const EntryPoint = ({
	entryPoint,
	index,
	prefix = 'entrypoint'
}: {
	entryPoint: EntryPointItem;
	index: number;
	prefix: string;
}) => {
	const key = `${prefix}-${index}-${entryPoint[0]}`;

	return (
		<React.Fragment key={key}>
			<div className="py-2 font-mono border-b border-border">
				<span className="text-function_purple">{entryPoint[1].name}</span>
				<span className="text-highlight_yellow">{'('}</span>
				<span>
					{entryPoint[1].inputs.map((i, idx) => (
						<span key={i.name}>
							{i.name}: <span className="text-typeColor">{i.type}</span>
							{idx < entryPoint[1].inputs.length - 1 && ', '}
						</span>
					))}
				</span>
				<span className="text-highlight_yellow">{')'}</span>{' '}
				<span className="text-highlight_yellow">{'->'}</span>{' '}
				<span className="text-highlight_yellow">{'('}</span>
				{entryPoint[1].outputs.map((o, idx) => (
					<span key={`${o.type} + ${idx}`}>
						<span className="text-typeColor">{o.type}</span>
						{idx < entryPoint[1].outputs.length - 1 && ', '}
					</span>
				))}
				<span className="text-highlight_yellow">{')'}</span>
				<div className="flex flex-row items-center trace-line_content">
					<span className="text-function_purple"></span>
				</div>
			</div>
		</React.Fragment>
	);
};
