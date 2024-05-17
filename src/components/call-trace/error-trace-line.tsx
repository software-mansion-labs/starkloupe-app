import React from 'react';
import { CallTrace } from '@/lib/simulation';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';

export function ErrorTraceLine({ call, nestingLevel }: { call: CallTrace; nestingLevel: number }) {
	return (
		<React.Fragment>
			{call.additionalInfo.errorMessage && (
				<TraceLine className={`border-y-2 cursor-pointer border-transparent trace-line--selected`}>
					{CallTypeChip('Error')}
					<div
						style={{ marginLeft: nestingLevel * CALL_NESTING_SPACE_BUMP }}
						className="flex flex-row items-center"
					>
						<div className={`w-5 h-5 p-1 mr-1`}></div>
						<span className="text-red-600">Error message: {call.additionalInfo.errorMessage}</span>
					</div>
				</TraceLine>
			)}
		</React.Fragment>
	);
}
