import { useCallTrace } from '@/lib/context/call-trace-context-provider';

import dynamic from 'next/dynamic';
import { FlameNode } from './flamegraph';

const FlameGraph = dynamic(() => import('./flamegraph'), {
	ssr: false,
	loading: () => (
		<div className={'flex items-center justify-center mt-4 gap-2 h-full'}>
			<span className="h-6 w-6 block rounded-full border-4 border-t-gray-800 animate-spin"></span>
			loading...
		</div>
	)
});

export function GasProfiler({ flamegraph }: { flamegraph: FlameNode | undefined }) {
	const { chosenCallName } = useCallTrace();
	const isEmpty = !flamegraph || !flamegraph.children || flamegraph.children.length === 0;
	return (
		<div className="flex flex-col gap-4 ">
			{!isEmpty ? (
				<div className="p-4">
					<FlameGraph data={flamegraph} activeName={chosenCallName} />
				</div>
			) : (
				<div className="text-sm font-mono flex items-center justify-center flex-col mt-4 h-full  !rounded-xl">
					💡 Flamegraph is currently supported for Transactions Version 3 and Sierra version 1.7.0
					or above. Reach out if you need support for lower versions.
				</div>
			)}
		</div>
	);
}
