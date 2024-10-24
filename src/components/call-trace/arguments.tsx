import { ContractCall } from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';
import React from 'react';

export function Arguments({ call }: { call: ContractCall }) {
	return (
		<>
			<span className="text-yellow-900">{'('}</span>
			{call?.argumentsNames ? (
				<span className="text-orange-500">{call.argumentsNames.join(', ')}</span>
			) : (
				call.argumentsNames && (
					<span className="text-orange-500">
						{call.argumentsNames.map((arg) => shortenHash(arg)).join(', ')}
					</span>
				)
			)}
			<span className="text-yellow-900">{')'}</span>
		</>
	);
}
