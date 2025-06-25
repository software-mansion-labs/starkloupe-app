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

export function GasProfiler({
	l2Flamegraph,
	l1DataFlamegraph
}: {
	l2Flamegraph: FlameNode | undefined;
	l1DataFlamegraph: FlameNode | undefined;
}) {
	const { chosenCallName } = useCallTrace();
	const isL2FlamegraphEmpty =
		!l2Flamegraph || !l2Flamegraph.children || l2Flamegraph.children.length === 0;
	const isL1DataFlamegraphEmpty =
		!l1DataFlamegraph || !l1DataFlamegraph.children || l1DataFlamegraph.children.length === 0;
	const isBothEmpty = isL2FlamegraphEmpty && isL1DataFlamegraphEmpty;

	return (
		<div className="flex flex-col">
			{!isL2FlamegraphEmpty && (
				<div className="pt-2 px-4 pb-0">
					<FlameGraph data={l2Flamegraph} activeName={chosenCallName} />
				</div>
			)}
			{isL2FlamegraphEmpty && !isL1DataFlamegraphEmpty && (
				<Alert className="m-4 w-fit">
					<ExclamationTriangleIcon className="h-5 w-5" />
					<AlertTitle>L2 Gas Profiling is not supported</AlertTitle>
					<AlertDescription>
						L2 Gas Profiling is available for the Transaction Version 3 and Sierra version 1.7.0 and
						above. Please upgrade your contract or transaction to a supported Sierra version to
						enable L2 Flamegraph visualization.
					</AlertDescription>
				</Alert>
			)}

			{!isL1DataFlamegraphEmpty && (
				<div className="pt-2 px-4 pb-0">
					<FlameGraph data={l1DataFlamegraph} activeName={chosenCallName} />
				</div>
			)}
			{isL1DataFlamegraphEmpty && !isL2FlamegraphEmpty && (
				<Alert className="m-4 w-fit">
					<ExclamationTriangleIcon className="h-5 w-5" />
					<AlertTitle>L1 Data Gas Profiling is not supported</AlertTitle>
					<AlertDescription>
						L1 Data Gas Profiling is available for Transactions Version 3 and when data are provided
						as a blob. Please ensure your transaction meets these requirements to view the L1
						DataFlamegraph visualization.
					</AlertDescription>
				</Alert>
			)}

			{isBothEmpty && (
				<Alert className="m-4 w-fit">
					<ExclamationTriangleIcon className="h-5 w-5" />
					<AlertTitle>Flamegraph is not supported</AlertTitle>
					<AlertDescription>
						Flamegraph is currently supported for Transactions Version 3. L2 Flamegraph is supported
						only for Sierra version 1.7.0 and above. L1 Data Flamegraph is supported only for
						transactions with version 3 and when data is provided as a blob. Please check your
						transaction version and data format.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
