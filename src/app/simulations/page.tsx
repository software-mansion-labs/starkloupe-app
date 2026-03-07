'use client';

export const runtime = 'edge';

import { Suspense } from 'react';
import { SimulationPage } from '@/components/simulation-page';
import { extractSimulationPayloadWithCalldata } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

function SimulationsContent() {
	const searchParams = useSearchParams();
	const simulationPayload = extractSimulationPayloadWithCalldata(searchParams);
	return <SimulationPage simulationPayload={simulationPayload} />;
}

export default function Page() {
	return (
		<Suspense>
			<SimulationsContent />
		</Suspense>
	);
}
