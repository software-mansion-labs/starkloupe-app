export function FnName({
	fnName,
	variant = 'trace-line'
}: {
	fnName: string | null;
	variant?: 'trace-line' | 'search-result';
}) {
	if (fnName) {
		const splittedFnName = fnName.split('::');
		return (
			<>
				{splittedFnName.length >= 2 ? (
					<>
						<span className={`${variant === 'trace-line' && 'text-purple-600 dark:text-function'}`}>
							{splittedFnName[splittedFnName.length - 2]}
						</span>
						::
						<span className={`${variant === 'trace-line' && 'text-pink-500 dark:text-function_2'}`}>
							{splittedFnName[splittedFnName.length - 1]}
						</span>
					</>
				) : (
					<span className={`${variant === 'trace-line' && 'text-pink-500 dark:text-function_2'}`}>
						{fnName}
					</span>
				)}
			</>
		);
	} else {
		return (
			<span
				className={`${
					variant === 'search-result' ? 'text-gray-500' : 'text-pink-500 dark:text-function_2'
				}`}
			>
				Unknown function
			</span>
		);
	}
}
