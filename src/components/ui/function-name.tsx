import { getRawFunctionName } from '@/lib/utils';

export function FnName({
	fnName,
	variant = 'trace-line'
}: {
	fnName: string | null;
	variant?: 'trace-line' | 'search-result';
}) {
	if (fnName) {
		const rawFnName = getRawFunctionName(fnName);
		const splittedFnName = rawFnName.split('::');

		return (
			<>
				{splittedFnName.length >= 2 ? (
					<>
						<span className={`${variant === 'trace-line' && 'text-purple-600'}`}>
							{splittedFnName[splittedFnName.length - 2]}
						</span>
						::
						<span className={`${variant === 'trace-line' && 'text-pink-500'}`}>
							{splittedFnName[splittedFnName.length - 1]}
						</span>
					</>
				) : (
					<span className={`${variant === 'trace-line' && 'text-pink-500'}`}>{rawFnName}</span>
				)}
			</>
		);
	} else {
		return (
			<span className={`${variant === 'search-result' ? 'text-gray-500' : 'text-pink-500'}`}>
				Unknown function
			</span>
		);
	}
}
