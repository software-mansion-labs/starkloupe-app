import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import React, { useEffect, useState } from 'react';
import { ContractFunctions, EntryPointItem, FunctionInput, FunctionOutput } from '@/lib/contracts';
import TypeMembersViewer from '../ui/type-members-viewer';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import { Copy, PlayIcon } from 'lucide-react';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useSettings } from '@/lib/context/settings-context-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import Link from 'next/link';

export function EntrypointsList({
	entryPoints,
	contractAddress,
	chainId
}: {
	entryPoints: ContractFunctions | undefined;
	contractAddress: string;
	chainId?: string;
}) {
	const { contractEntrypointsElementRefs, searchResultAddress } = useSettings();
	const [mode, setMode] = useState('read');

	if (entryPoints?.entry_point_datas.length === 0) {
		return (
			<Alert className="mx-4 mt-2 w-fit">
				<ExclamationTriangleIcon className="h-5 w-5" />
				<AlertTitle>No events.</AlertTitle>
				<AlertDescription>No events emitted during this transaction.</AlertDescription>
			</Alert>
		);
	}

	const getSimulateUrl = (entryPoint: EntryPointItem, contractAddress: string) => {
		const calldata = `0x1,${contractAddress},${entryPoint[0]}`;
		if (chainId)
			return `/simulate-transaction?calldata=${encodeURIComponent(
				calldata
			)}&chainId=${chainId.toUpperCase()}`;
		else return `/simulate-transaction?calldata=${encodeURIComponent(calldata)}`;
	};

	let readEntrypoints: EntryPointItem[] = [];
	let writeEntrypoints: EntryPointItem[] = [];
	entryPoints?.entry_point_datas.forEach((entryPoint) => {
		if (entryPoint[1].state_mutability === 'external') {
			writeEntrypoints.push(entryPoint);
		} else {
			readEntrypoints.push(entryPoint);
		}
	});
	const currentEntrypoints = mode === 'read' ? readEntrypoints : writeEntrypoints;
	return (
		<>
			<div className="flex-row w-full block md:hidden">
				<Select value={mode} onValueChange={setMode}>
					<SelectTrigger className="w-full focus:outline-none rounded-none focus:ring-0 focus:ring-offset-0 border-0 border-b border-border">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="w-[var(--radix-select-trigger-width)]">
						<SelectItem value="read">Read</SelectItem>
						<SelectItem value="write">Write</SelectItem>
					</SelectContent>
				</Select>

				<div className="px-4 ">
					{currentEntrypoints.map((entryPoint, index) => {
						if (!contractEntrypointsElementRefs.current[entryPoint[0]]) {
							contractEntrypointsElementRefs.current[entryPoint[0]] =
								React.createRef<HTMLDivElement>();
						}

						return (
							<EntryPoint
								entryPoint={entryPoint}
								key={`entrypoint-${index}-${entryPoint[0]}`}
								index={index}
								prefix={mode}
								simulateLink={getSimulateUrl(entryPoint, contractAddress)}
								customRef={contractEntrypointsElementRefs.current[entryPoint[0]]}
								searchResultAddress={searchResultAddress}
							/>
						);
					})}
				</div>
			</div>
			<div className=" flex-row w-full hidden md:flex">
				<div className="w-1/2 px-4">
					<div className="mb-2 text-sm">Read</div>
					<div className="border-b border-border mb-4"></div>
					{readEntrypoints.map((entryPoint, index) => {
						if (!contractEntrypointsElementRefs.current[entryPoint[0]]) {
							contractEntrypointsElementRefs.current[entryPoint[0]] =
								React.createRef<HTMLDivElement>();
						}
						return (
							<EntryPoint
								key={`entrypoint-${index}-${entryPoint[0]}`}
								simulateLink={getSimulateUrl(entryPoint, contractAddress)}
								entryPoint={entryPoint}
								index={index}
								prefix="read"
								customRef={contractEntrypointsElementRefs.current[entryPoint[0]]}
								searchResultAddress={searchResultAddress}
							/>
						);
					})}
				</div>
				<div className="border-l border-border "></div>
				<div className="w-1/2 px-4">
					<div className="mb-2 text-sm">Write</div>
					<div className="border-b border-border mb-4"></div>
					{writeEntrypoints.map((entryPoint, index) => {
						if (!contractEntrypointsElementRefs.current[entryPoint[0]]) {
							contractEntrypointsElementRefs.current[entryPoint[0]] =
								React.createRef<HTMLDivElement>();
						}
						return (
							<EntryPoint
								key={`entrypoint-${index}-${entryPoint[0]}`}
								entryPoint={entryPoint}
								index={index}
								simulateLink={getSimulateUrl(entryPoint, contractAddress)}
								prefix="write"
								customRef={contractEntrypointsElementRefs.current[entryPoint[0]]}
								searchResultAddress={searchResultAddress}
							/>
						);
					})}
				</div>
			</div>
		</>
	);
}

const EntryPoint = ({
	entryPoint,
	index,
	prefix = 'entrypoint',
	customRef,
	searchResultAddress,
	simulateLink
}: {
	entryPoint: EntryPointItem;
	index: number;
	prefix: string;
	customRef: any;
	searchResultAddress: string;
	simulateLink: string;
}) => {
	const [isHighlighted, setIsHighlighted] = useState(false);

	useEffect(() => {
		if (searchResultAddress === entryPoint[0]) {
			setIsHighlighted(true);

			const timer = setTimeout(() => {
				setIsHighlighted(false);
			}, 2000);

			return () => clearTimeout(timer);
		}
	}, [searchResultAddress, entryPoint]);

	const key = `${prefix}-${index}-${entryPoint[0]}`;
	return (
		<React.Fragment key={key}>
			<div
				className={`py-2 font-mono border-b border-border min-h-[40px] flex justify-between items-center gap-2`}
				ref={customRef}
			>
				<div>
					<span
						className={`text-function_purple break-words transition-colors duration-300 ${
							isHighlighted ? 'bg-yellow-200' : ''
						}`}
					>
						{entryPoint[1].name}
					</span>
					<span className="text-highlight_yellow">{'('}</span>
					<span>
						{entryPoint[1].inputs.map((i, idx) => (
							<span key={i.name}>
								{i.name}:{' '}
								{i.struct_members || i.enum_variants ? (
									<InpuOutputDetailsDropdown data={i} entrypointAddress={entryPoint[0]} />
								) : (
									<span className="text-typeColor">{i.type}</span>
								)}
								{idx < entryPoint[1].inputs.length - 1 && ', '}
							</span>
						))}
					</span>
					<span className="text-highlight_yellow">{')'}</span>{' '}
					<span className="text-highlight_yellow">{'->'}</span>{' '}
					<span className="text-highlight_yellow">{'('}</span>
					{entryPoint[1].outputs.map((o, idx) => (
						<span key={`${o.type} + ${idx}`}>
							{o.struct_members || o.enum_variants ? (
								<InpuOutputDetailsDropdown data={o} entrypointAddress={entryPoint[0]} />
							) : (
								<span className="text-typeColor">{o.type}</span>
							)}
							{idx < entryPoint[1].outputs.length - 1 && ', '}
						</span>
					))}
					<span className="text-highlight_yellow">{')'}</span>
					<div className="flex flex-row items-center trace-line_content">
						<span className="text-function_purple"></span>
					</div>
				</div>
				<TooltipProvider delayDuration={100}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								href={simulateLink}
								className="flex items-center gap-2 text-xs border border-border py-1 px-2 rounded-md hover:opacity-70 transition-opacity"
							>
								<PlayIcon className="h-3 w-3" />
								{/* Simulate */}
							</Link>
						</TooltipTrigger>
						<TooltipContent className="bg-background border-border text-black dark:text-white border">
							Click to simulate <span className="text-function_purple">{entryPoint[1].name}</span>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</React.Fragment>
	);
};

const InpuOutputDetailsDropdown = ({
	data,
	entrypointAddress
}: {
	data: FunctionInput | FunctionOutput;
	entrypointAddress: string;
}) => {
	return (
		<DropdownMenu>
			<TooltipProvider delayDuration={100}>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<span
								className={`py-1 mb-0.5 hover:bg-accent_2 h-full text-typeColor border-typeColor border-b
								transition-colors duration-200 focus:outline-none rounded-sm cursor-pointer`}
							>
								{data.type}
							</span>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent className="bg-background border-border text-black dark:text-white border">
						Click to show full value
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<DropdownMenuContent
				className="bg-card shadow-xl border rounded-lg text-xs max-w-[90vw] w-fit min-w-[16rem] p-0"
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
				onWheel={(e) => e.stopPropagation()}
				onScroll={(e) => e.stopPropagation()}
			>
				<div className="relative">
					<CopyToClipboardElement
						value={JSON.stringify(data.struct_members, null, 2)}
						toastDescription="Full JSON copied"
						className="absolute top-2 right-3 z-10 bg-accent p-1.5 rounded focus:outline-none focus:ring-2"
						aria-label="Copy"
					>
						<Copy size={14} />
					</CopyToClipboardElement>
					<ScrollArea
						className="md:w-[40rem] h-60 px-3 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-accent [&::-webkit-scrollbar-thumb]:rounded-full"
						onScroll={(e) => e.stopPropagation()}
					>
						<div className="pt-2">
							<TypeMembersViewer data={data} entrypointAddress={entrypointAddress} />
						</div>
						<ScrollBar orientation="horizontal" className="sticky bottom-0 left-0 right-0 h-2" />
					</ScrollArea>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
