import { useContext, useState } from 'react';
import { ExecutionResultReverted, SimulationResult } from '@/lib/simulation';
import { CallTraceContext, CallTraceContextProvider, TabId } from '@/lib/context/call-trace';
import { ContractCallTrace } from './entries';
import { EventsList } from './event-entries';
import { Debugger } from '@/components/debugger';
import { DebuggerContextProvider } from '@/lib/context/debugger-context-provider';

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

	const tabs: { id: TabId; name: string }[] = [
		{
			id: 'call-trace',
			name: 'Call Trace'
		},
		{
			id: 'events-list',
			name: 'Events'
		},
		{
			id: 'debugger',
			name: 'Debugger'
		}
	];

	return (
		<div className="pt-16">
			<div className="flex flex-row items-center border-b border-neutral-200">
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
			<div className="overflow-x-auto whitespace-nowrap min-h-[20rem] -mx-4 text-xs mt-5">
				<div className="min-w-fit">
					{activeTab === 'call-trace' && (
						<ContractCallTrace
							calls={[simulationResult.callTrace]}
							nestingLevel={0}
							executionFailed={executionFailed}
						/>
					)}
					{activeTab === 'events-list' && <EventsList events={simulationResult.eventsTrace} />}
					{activeTab === 'debugger' && <Debugger />}
				</div>
			</div>
		</div>
	);
}
