import { SimulationResult, FlameNode } from '@/lib/simulation';
import { DebuggerPayload } from '@/lib/debugger';
import {
	CallTraceContextProvider,
	TabId,
	useCallTrace
} from '@/lib/context/call-trace-context-provider';
import { EventsList } from './event-entries';
import { Debugger } from '@/components/debugger';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import CalldataSearch from '../ui/calldata-search';
import { PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { CommonCallTrace } from './common-call-trace';
import { useCallback } from 'react';
import StorageChanges from '../storage-changes';
import { GasProfiler } from '../gas-profiler';

export function CallTraceRoot({
	simulationResult,
	flamegraph,
	debuggerPayload
}: {
	simulationResult: SimulationResult;
	flamegraph: FlameNode | undefined;
	debuggerPayload: DebuggerPayload | undefined;
}) {
	return (
		<CallTraceContextProvider
			simulationResult={simulationResult}
			flamegraph={flamegraph}
			debuggerPayload={debuggerPayload}
		>
			<CallTraceRootContent />
		</CallTraceContextProvider>
	);
}

function CallTraceRootContent() {
	const {
		collapseAll,
		expandAll,
		activeTab,
		setActiveTab,
		simulationResult,
		flamegraph,
		setChosenCallName,
		debuggerPayload
	} = useCallTrace();
	const onValueChange = useCallback(
		(value: string) => {
			setActiveTab(value as TabId);
			if (activeTab !== 'gas-profiler') {
				setChosenCallName(null);
			}
		},
		[setActiveTab]
	);
	return (
		<div className="mt-12">
			<Tabs value={activeTab} onValueChange={onValueChange}>
				<TabsList className="flex md:inline-flex !justify-start md:justify-center flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-rounded ">
					<TabsTrigger value="call-trace">Call Trace</TabsTrigger>
					<TabsTrigger value="events-list">Events</TabsTrigger>
					<TabsTrigger value="debugger">Debugger</TabsTrigger>
					<TabsTrigger value="storage-changes">Storage</TabsTrigger>
					<TabsTrigger value="gas-profiler">Gas Profiler</TabsTrigger>
				</TabsList>

				<TabsContent value="call-trace">
					<div className="whitespace-nowrap rounded-xl border">
						<TooltipProvider>
							<div className="border-b shadow-sm">
								<div className="flex justify-between w-full items-center px-4 ">
									<CalldataSearch />
									<div className="pt-1">
										<Tooltip delayDuration={100}>
											<TooltipTrigger>
												<div
													onClick={() => {
														expandAll();
													}}
													className={`rounded-sm h-full p-1  hover:bg-neutral-100 cursor-pointer`}
												>
													<PlusCircleIcon className="h-5 w-5" />
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Expand all</p>
											</TooltipContent>
										</Tooltip>
										<Tooltip delayDuration={100}>
											<TooltipTrigger>
												<div
													onClick={() => {
														collapseAll();
													}}
													className={`h-full p-1 rounded-sm select-none hover:bg-neutral-100 cursor-pointer`}
												>
													<MinusCircleIcon className="h-5 w-5" />
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Collapse all</p>
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
							</div>
						</TooltipProvider>

						<ScrollArea className="h-[calc(100vh-450px)]">
							<div className="text-xs px-0 py-2 overflow-y-auto">
								<CommonCallTrace callId={1} nestingLevel={0} callType="contract" />
								<ScrollBar orientation="horizontal" />
							</div>
						</ScrollArea>
					</div>
				</TabsContent>
				<TabsContent value="events-list">
					<Card>
						<ScrollArea className="text-xs h-[calc(100vh-409px)]">
							<div className="p-0 py-2 overflow-y-auto">
								<EventsList events={simulationResult.events} />
							</div>
							<ScrollBar orientation="horizontal" />
						</ScrollArea>
					</Card>
				</TabsContent>
				<TabsContent value="debugger">
					<Card className="text-xs h-[calc(100vh-407px)]">
						<Debugger debuggerPayload={debuggerPayload} />{' '}
					</Card>
				</TabsContent>
				<TabsContent value="storage-changes">
					<Card>
						<ScrollArea className="text-xs h-[calc(100vh-409px)]">
							<StorageChanges />
						</ScrollArea>
					</Card>
				</TabsContent>
				<TabsContent value="gas-profiler">
					<Card>
						<ScrollArea className="text-xs h-[calc(100vh-409px)]">
							<GasProfiler flamegraph={flamegraph} />
						</ScrollArea>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
