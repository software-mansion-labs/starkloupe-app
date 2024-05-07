import { SimulationResult } from '@/lib/simulation';
import { useState } from 'react';
import { ToggleButton } from '../ui/toggle-button';
// import { CallTraceContext, StringBooleanDict } from '.';
import { ContractCallTrace } from './entries';
import { CallTraceContextProvider } from './context';

export function CallTraceRoot({ simulationResult }: { simulationResult: SimulationResult }) {
	return (
		<CallTraceContextProvider>
			<div className="pt-16">
				<div className="pb-3 sm:flex sm:items-center">
					<h3 className="text-xs uppercase font-semibold text-gray-900 mr-8">Call Trace</h3>
				</div>
				<div className="overflow-x-auto whitespace-nowrap min-h-[20rem] -mx-4 text-xs">
					<div className="min-w-fit">
						<ContractCallTrace calls={[simulationResult.callTrace]} nestingLevel={0} />
					</div>
				</div>
			</div>
		</CallTraceContextProvider>
	);
}
