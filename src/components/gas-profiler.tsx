import React, { useMemo } from 'react';
import FlameGraph from './flamegraph';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import FlameNode from '@lib/simulation';

export function GasProfiler({ flamegraph }: { flamegraph: FlameNode }) {
	const isEmpty = !flamegraph || !flamegraph.children || flamegraph.children.length === 0;

	return (
		<div className="flex flex-col gap-4 p-4">
			{!isEmpty ? (
				<FlameGraph data={flamegraph} height={24} />
			) : (
				<p>
					No flamegraph data available. Flamegraph is supported only for transaction version{' '}
					<b>3</b> and Sierra version <b>&ge; 1.7.0</b>
				</p>
			)}
		</div>
	);
}
