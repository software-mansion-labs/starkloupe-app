import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import CopyToClipboardElement from './ui/copy-to-clipboard';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { ContractCallSignature } from './ui/signature';
import { ContractCall, DataType, DecodedItem } from '@/lib/simulation';
import { DecodeDataTable } from './decode-data-table';

interface CallData {
	rawInput: string[];
	input: DecodedItem[] | null | undefined;
	output: DecodedItem[] | null | undefined;
	label?: React.ReactNode;
	callId: number;
}

export function MultiCallIO() {
	const [expandedCalls, setExpandedCalls] = useState<Record<number, boolean>>({});

	const { contractCallsMap } = useCallTrace();

	const expandedCount = Object.values(expandedCalls).filter(Boolean).length;

	function fillCallsFromContractMap(contractCallsMap: { [key: number]: ContractCall }): CallData[] {
		const calls: CallData[] = [];
		const executeCall = Object.values(contractCallsMap).find(
			(call: any) => call.entryPointName === '__execute__'
		);

		if (!executeCall || !executeCall.childrenCallIds) {
			return calls;
		}

		executeCall.childrenCallIds.forEach((childId) => {
			const childCall = contractCallsMap[childId];

			if (
				childCall &&
				childCall.hasOwnProperty('calldataDecoded') &&
				childCall.hasOwnProperty('decodedResult')
			) {
				calls.push({
					rawInput: childCall.entryPoint.calldata,
					input: childCall.calldataDecoded,
					output: childCall.decodedResult,
					label: <ContractCallSignature contractCall={childCall} />,
					callId: childCall.callId
				});
			}
		});
		return calls;
	}

	const calls: CallData[] = fillCallsFromContractMap(contractCallsMap);

	const toggleCallExpand = (index: number) => {
		setExpandedCalls((prev) => ({
			...prev,
			[index]: !prev[index]
		}));
	};

	return (
		<div className="h-full w-full">
			<div className="flex flex-col min-h-full">
				{calls.map((call, index) => {
					const isExpanded = expandedCalls[index];
					return (
						<div key={index} className="flex flex-col min-h-0 bg-card">
							<button
								onClick={() => toggleCallExpand(index)}
								className="w-full flex items-center justify-between border-b border-border p-3 gap-4 transition-colors hover:bg-muted/50"
							>
								<span className="text-xs text-classGreen font-mono whitespace-nowrap">
									{call.label || `Call ${index + 1}`}
									<span className="text-highlight_yellow">{'('}</span>
									{contractCallsMap?.[call?.callId ?? -1]?.argumentsNames?.map((arg, i, array) => {
										return (
											<span key={i}>
												<span className="text-foreground">{arg}</span>
												<span className="text-foreground">: </span>
												<span className="text-typeColor">
													{contractCallsMap?.[call?.callId ?? -1]?.argumentsTypes?.[i]}
												</span>
												{i < array.length - 1 && <span className="text-foreground">, </span>}
											</span>
										);
									})}
									<span className="text-highlight_yellow">{')'}</span>
									<span className="text-variable">&nbsp;{'->'}&nbsp;</span>
									<span className="text-highlight_yellow">{`(`}</span>
									<span className="text-typeColor">
										{contractCallsMap?.[call?.callId ?? -1]?.resultTypes?.map((arg, i, array) => {
											return (
												<span key={i}>
													<span className="text-typeColor">{arg}</span>
													{i < array.length - 1 && <span className="text-foreground">, </span>}
												</span>
											);
										})}
									</span>
									<span className="text-highlight_yellow">{`)`}</span>
								</span>
								{isExpanded ? (
									<ChevronUp size={18} className="text-muted-foreground" />
								) : (
									<ChevronDown size={18} className="text-muted-foreground" />
								)}
							</button>
							{isExpanded && (
								<div className="flex flex-col dark:bg-background border-b py-2 px-4 ">
									<div className="w-[calc(100vw-4rem)] sm:w-[calc(100vw-7rem)]">
										<div className="flex justify-between gap-4">
											<div className={`w-1/2`}>
												<DecodeDataTable
													rawData={call.rawInput}
													decodeData={call.input}
													type={DataType.CALLDATA}
												/>
											</div>
											<div className="w-1/2">
												<DecodeDataTable decodeData={call.output} type={DataType.OUTPUT} />
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
