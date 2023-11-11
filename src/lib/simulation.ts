import { API_URL, SIMULATIONS_API_URL } from './config';
import { Call } from './transaction';

export interface SimulationListItem {
	wallet_address: string;
	created_at: number;
	chain_id: string;
	id: string;
	status: 'success' | 'failure' | 'simulating';
}

export interface SimulationsResponse {
	simulations: SimulationListItem[];
}

export interface SimulationResponse {
	trace: { execute_invocation: Call };
}

export async function fetchSimulations(teamId?: number, walletAddress?: string) {
	let url = `${SIMULATIONS_API_URL}/v1/simulations`;
	const params = new URLSearchParams();

	if (teamId) params.append('team_id', teamId.toString());
	if (walletAddress) params.append('wallet_address', walletAddress);
	if (params.toString()) url = `${url}?${params.toString()}`;
	console.log(url);
	const res = await fetch(url);
	if (!res.ok) throw new Error('Failed to fetch data');
	const simulationsResponse = (await res.json()) as SimulationsResponse;
	// simulationsResponse.simulations = simulationsResponse.simulations.map((s) => ({
	// 	...s,
	// 	status: s.created_at % 2 === 0 ? 'success' : 'failure'
	// }));
	return simulationsResponse;
}

export async function fetchSimulation(simulationId: string) {
	const res = await fetch(`${API_URL}/simulation/${simulationId}`);
	if (!res.ok) throw new Error('Failed to fetch data');
	return (await res.json()) as SimulationResponse;
}
