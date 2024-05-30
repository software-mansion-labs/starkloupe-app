import { CallTrace } from '@/lib/simulation';
import { shortenHash } from '@/lib/utils';
import React from 'react';

export function Arguments({ call }: { call: CallTrace }) {
	return (
		<>
			<span className="text-yellow-900">{'('}</span>
			{call.additionalInfo?.functionArgumentsNames ? (
				<span className="text-orange-500">
					{call.additionalInfo.functionArgumentsNames.join(', ')}
				</span>
			) : hardcodedArgumentsNames(call) ? (
				<span className="text-orange-500">{(hardcodedArgumentsNames(call) ?? []).join(', ')}</span>
			) : (
				call.additionalInfo?.functionArguments && (
					<span className="text-orange-500">
						{call.additionalInfo.functionArguments.map((arg) => shortenHash(arg)).join(', ')}
					</span>
				)
			)}
			<span className="text-yellow-900">{')'}</span>
		</>
	);
}

function hardcodedArgumentsNames(call: CallTrace): string[] | null {
	if (
		call.entryPoint.storageAddress ===
		'0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b'
	) {
		if (
			call.entryPoint.entryPointSelector ===
			'0x3fa2ea83f0780e0525f99583b868dd6a31fc799b6a9dbc30c1a8bb00bca1c3d'
		) {
			return ['data_type', 'timestamp', 'aggregation_mode'];
		} else if (
			call.entryPoint.entryPointSelector ===
			'0x16d9d5d83f8eecc5d7450519aad7e6e649be1a6c9d6df85bd0b177cc59a926a'
		) {
			return ['data_type'];
		}
	} else if (
		call.entryPoint.storageAddress ===
		'0x72596826fafc98dfb9d00646dfc16d086d9bae58ee0164ff0f9308d5eee25d8'
	) {
		if (
			call.entryPoint.entryPointSelector ===
			'0x35a73cd311a05d46deda634c5ee045db92f811b4e74bca4437fcb5302b7af33'
		) {
			return ['account'];
		}
	}
	return null;
}
