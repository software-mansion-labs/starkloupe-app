import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { FlameNode } from './flamegraph';

const FlameGraph = dynamic(() => import('./flamegraph'), {
	ssr: false,
	loading: () => (
		<Alert className="m-4 py-4 w-fit min-w-[2rem] flex items-center gap-4">
			<span className="h-6 w-6 block rounded-full border-4 border-t-gray-800 animate-spin" />
			<div className="flex flex-col">
				<AlertTitle>Loading</AlertTitle>
				<AlertDescription>Please wait, flamegraph is loading</AlertDescription>
			</div>
		</Alert>
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
				<Alert className="m-4 w-fit">
					<ExclamationTriangleIcon className="h-5 w-5" />
					<AlertTitle>Flamegraph is not supported</AlertTitle>
					<AlertDescription>
						Flamegraph is currently supported for Transactions Version 3 and Sierra version 1.7.0 or
						above. Reach out if you need support for lower versions.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
