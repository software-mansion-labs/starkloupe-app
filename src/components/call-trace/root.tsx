import { useContext } from 'react';
import { SimulationResult } from '@/lib/simulation';
import { CallTraceContext, CallTraceContextProvider, TabId } from '@/lib/context/call-trace';
import { ContractCallTrace } from './contract-call-trace';
import { EventsList } from './event-entries';
import { Debugger } from '@/components/debugger';
import { DebuggerContextProvider } from '@/lib/context/debugger-context-provider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function CallTraceRoot({ simulationResult }: { simulationResult: SimulationResult }) {
	return (
		<CallTraceContextProvider simulationResult={simulationResult}>
			<DebuggerContextProvider simulationResult={simulationResult}>
				<CallTraceRootContent simulationResult={simulationResult} />
			</DebuggerContextProvider>
		</CallTraceContextProvider>
	);
}

function CallTraceRootContent({ simulationResult }: { simulationResult: SimulationResult }) {
	const { activeTab, setActiveTab } = useContext(CallTraceContext);
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
					<ScrollArea className="whitespace-nowrap rounded-xl border">
						<div className="text-xs px-0 py-2">
							<ContractCallTrace
								call={simulationResult.callTrace}
								nestingLevel={0}
								executionFailed={executionFailed}
							/>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
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
						<Debugger calls={[simulationResult.callTrace]} />
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
