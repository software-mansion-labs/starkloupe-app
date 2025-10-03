import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import React, { useEffect, useState } from 'react';
import { ContractFunctions, EntryPointItem, FunctionInput, FunctionOutput } from '@/lib/contracts';
import TypeMembersViewer from '../ui/type-members-viewer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import CopyToClipboardElement from '../ui/copy-to-clipboard';
import { Copy } from 'lucide-react';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useSettings } from '@/lib/context/settings-context-provider';

export function EntrypointsList({ entryPoints }: { entryPoints: ContractFunctions | undefined }) {
	const { contractEntrypointsElementRefs, searchResultAddress } = useSettings();
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
					{readEntrypoints.map((entryPoint, index) => {
						if (!contractEntrypointsElementRefs.current[entryPoint[0]]) {
							contractEntrypointsElementRefs.current[entryPoint[0]] =
								React.createRef<HTMLDivElement>();
						}
						return (
							<EntryPoint
								key={`entrypoint-${index}-${entryPoint[0]}`}
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
								prefix="write"
								customRef={contractEntrypointsElementRefs.current[entryPoint[0]]}
								searchResultAddress={searchResultAddress}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}

const EntryPoint = ({
	entryPoint,
	index,
	prefix = 'entrypoint',
	customRef,
	searchResultAddress
}: {
	entryPoint: EntryPointItem;
	index: number;
	prefix: string;
	customRef: any;
	searchResultAddress: string;
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
			<div className={`py-2 font-mono border-b border-border  `} ref={customRef}>
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
