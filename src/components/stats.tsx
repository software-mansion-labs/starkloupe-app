import { Stats } from '@/lib/simulation';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import {
	ExclamationTriangleIcon,
	CubeTransparentIcon,
	WalletIcon
} from '@heroicons/react/24/outline';

export function Stats({ stats }: { stats: Stats }) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total simulations</CardTitle>
					<CubeTransparentIcon className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.total_simulations}</div>
					{/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Failure simulations</CardTitle>
					<ExclamationTriangleIcon className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.failure_simulations}</div>
					{/* <p className="text-xs text-muted-foreground">+180.1% from last month</p> */}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Unique wallets</CardTitle>
					<WalletIcon className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.unique_wallet_count}</div>
					{/* <p className="text-xs text-muted-foreground">+19% from last month</p> */}
				</CardContent>
			</Card>
		</div>
	);
}
