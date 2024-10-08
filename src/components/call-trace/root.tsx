import { useContext, useState } from 'react';
import { SimulationResult } from '@/lib/simulation';
import {
	CallTraceContext,
	CallTraceContextProvider,
	TabId,
	useCallTrace
} from '@/lib/context/call-trace-context-provider';
import { ContractCallTrace } from './contract-call-trace';
import { EventsList } from './event-entries';
import { Debugger } from '@/components/debugger';
import { DebuggerContextProvider } from '@/lib/context/debugger-context-provider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function CallTraceRoot({ simulationResult }: { simulationResult: SimulationResult }) {
	return (
		<CallTraceContextProvider simulationResult={simulationResult}>
			<DebuggerContextProvider>
				<CallTraceRootContent />
			</DebuggerContextProvider>
		</CallTraceContextProvider>
	);
}

function CallTraceRootContent() {
	const { collapseAll, expandAll, activeTab, setActiveTab, simulationResult } = useCallTrace();
	const executionFailed = simulationResult.executionResult.executionStatus === 'REVERTED';

	return (
		<div className="mt-12">
			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
				<TabsList>
					<TabsTrigger value="call-trace">Call Trace</TabsTrigger>
					<TabsTrigger value="events-list">Events</TabsTrigger>
					<TabsTrigger value="debugger">Debugger</TabsTrigger>
				</TabsList>
				<TabsContent value="call-trace">
					<div className="whitespace-nowrap rounded-xl border">
						<TooltipProvider>
							<div className="border-b shadow-sm">
								<div className="flex justify-end items-center px-4 ">
									<div className="py-1">
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

						<ScrollArea className="md:h-[calc(100vh-410px)] h-[calc(100vh-200px)]">
							<div className="text-xs px-0 py-2 overflow-y-auto">
								<ContractCallTrace
									call={simulationResult.callTrace}
									nestingLevel={0}
									executionFailed={executionFailed}
								/>
								<ScrollBar orientation="horizontal" />
							</div>
						</ScrollArea>
					</div>
				</TabsContent>
				<TabsContent value="events-list">
					<Card>
						<CardContent className="p-0 py-2 text-xs">
							<EventsList events={simulationResult.eventsTrace} />
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="debugger">
					<Card className="text-xs">
						<Debugger />
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
