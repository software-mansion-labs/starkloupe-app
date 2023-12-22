import { API_URL, SIMULATIONS_API_URL } from './config';
import { Call } from './transaction';
import { fetchApi } from './utils';

export interface SimulationListItem {
	wallet_address: string;
	created_at: number;
	chain_id: string;
	id: string;
	status: 'success' | 'failure' | 'simulating';
}

export interface Stats {
	failure_simulations: number;
	total_simulations: number;
	unique_wallet_count: number;
}

export interface SimulationsResponse {
	simulations: SimulationListItem[];
	stats: Stats;
	project: { id: number; name: string; slug: string };
}

export interface Simulation {
	id: string;
	team_id: number;
	chain_id: string;
	block_at: number;
	transaction_version: number;
	nonce: number;
	max_fee: string;
	cairo_version: string;
	wallet_address: string;
	calldata: string[];
	created_at: number;
	updated_at: number;
	status: string;
}

export interface SimulationResponse {
	trace: { execute_invocation: Call };
	simulation: Simulation;
	classes: { [key: string]: { code: string } };
}

export function fetchSimulations(projectSlug?: string) {
	const queryParams: { project_slug?: string } = {};
	if (projectSlug) queryParams.project_slug = projectSlug;
	return fetchApi<SimulationsResponse | null>('/v1/simulations', { queryParams });
}

export async function fetchSimulation(simulationId: string) {
	const res = await fetch(`${API_URL}/simulation/${simulationId}`);
	if (!res.ok) throw new Error('Failed to fetch data');
	return (await res.json()) as SimulationResponse;
}
