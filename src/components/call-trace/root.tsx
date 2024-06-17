import { useState } from 'react';
import { ExecutionResultReverted, SimulationResult } from '@/lib/simulation';
import { CallTraceContextProvider } from '@/lib/context/call-trace';
import { ContractCallTrace } from './entries';
import { EventsList } from './event-entries';

export function CallTraceRoot({ simulationResult }: { simulationResult: SimulationResult }) {
	const [activeTab, setActiveTab] = useState('call');
	const executionFailed =
		(simulationResult.executionResult as ExecutionResultReverted) !== undefined;

	return (
		<div className="pt-16">
			<div className="pb-3 sm:flex sm:items-center">
				<h3
					className={`text-xs uppercase font-semibold text-gray-900 mr-8 cursor-pointer ${
						activeTab === 'call'
							? 'text-black bg-gray-100 rounded-t-lg border-b-2 border-gray-900'
							: 'text-gray-500 hover:text-black rounded-t-lg hover:border-b-2 hover:border-gray-900'
					}`}
					onClick={() => setActiveTab('call')}
				>
					Call Trace
				</h3>
				<h3
					className={`text-xs uppercase font-semibold text-gray-900 mr-8 cursor-pointer ${
						activeTab === 'event'
							? 'text-black bg-gray-100 rounded-t-lg border-b-2 border-gray-900'
							: 'text-gray-500 hover:bg-gray-200 rounded-t-lg hover:border-b-2 hover:border-gray-900'
					}`}
					onClick={() => setActiveTab('event')}
				>
					Events
				</h3>
			</div>
			<CallTraceContextProvider simulationResult={simulationResult}>
				<div className="overflow-x-auto whitespace-nowrap min-h-[20rem] -mx-4 text-xs">
					<div className="min-w-fit">
						{activeTab === 'call' && (
							<ContractCallTrace
								calls={[simulationResult.callTrace]}
								nestingLevel={0}
								executionFailed={executionFailed}
							/>
						)}
						{activeTab === 'event' && <EventsList events={simulationResult.eventsTrace} />}
					</div>
				</div>
			</CallTraceContextProvider>
		</div>
	);
}
