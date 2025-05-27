import { useContext } from 'react';
import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import { Loader } from '@/components/ui/loader';
import { DebuggerView } from './view';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { WALNUT_VERIFY_DOCS_URL } from '@/lib/config';

export function DebuggerWithContext() {
	const context = useContext(DebuggerContext);

	if (!context) {
		return (
			<div className="flex items-center justify-center w-full h-full">
				<Loader />
			</div>
		);
	}

	const { currentStep, loading, error, hasDebuggableContract } = context;

	if (loading) {
		return (
			<Alert className="flex items-center justify-center w-full h-full">
				<AlertDescription>
					<Loader />
				</AlertDescription>
			</Alert>
		);
	}

	if (error) {
		throw new Error('Failed to fetch debugger data');
	}

	if (!hasDebuggableContract) {
		return (
			<Alert className="m-4 w-fit">
				<ExclamationTriangleIcon className="h-5 w-5" />
				<AlertTitle>No Source Code Available</AlertTitle>
				<AlertDescription>
					<p>
						The source code for the contract is missing. To enable the step-by-step debugger, verify
						the contract on Walnut by following{' '}
						<Link
							className="underline-offset-4 hover:underline text-pink-500"
							href={WALNUT_VERIFY_DOCS_URL}
						>
							this guide
						</Link>
						.
					</p>
				</AlertDescription>
			</Alert>
		);
	}

	if (!currentStep) return null;

	return <DebuggerView />;
}
