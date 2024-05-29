import React from 'react';
import { CallTrace } from '@/lib/simulation';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';

export function ErrorTraceLine({
	errorMessage,
	nestingLevel
}: {
	errorMessage: string;
	nestingLevel: number;
}) {
	return (
		<React.Fragment>
			{
				<TraceLine className={`border-y-2 border-transparent bg-red-200 hover:bg-red-200`}>
					{CallTypeChip('Error')}
					<div
						style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
						className="flex flex-row items-center"
					>
						<div className={`w-5 h-5 p-1 mr-1`}></div>
						<span className="text-red-900">Error message: {errorMessage}</span>
					</div>
				</TraceLine>
			}
		</React.Fragment>
	);
}
