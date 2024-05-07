import { copyToClipboard } from '@/lib/utils';

export function CallDetails({
	details,
	isTraceElement
}: {
	details: { name: string; value: string; isCopyable?: boolean; valueToCopy?: string }[];
	isTraceElement?: boolean;
}) {
	return (
		<div
			className={`flex flex-col  py-1 px-4 mb-2 ${
				isTraceElement ? 'bg-sky-50 border-y border-blue-400' : ''
			}`}
		>
			<div className="max-w-[90vw]">
				<div className="rounded text-xs flex flex-row gap-x-3 flex-wrap leading-loose">
					{details.map(
						({ name, value, isCopyable, valueToCopy }) =>
							value && (
								<span key={name} className="whitespace-nowrap">
									<span className="text-neutral-500">{name}:</span>{' '}
									<span
										onClick={() =>
											isCopyable && valueToCopy
												? copyToClipboard(valueToCopy)
												: typeof value === 'string'
												? copyToClipboard(value)
												: () => {}
										}
										className={`rounded-sm font-mono px-1 ${
											isCopyable ? 'cursor-pointer hover:bg-black/10' : ''
										}`}
									>
										{value}
									</span>
								</span>
							)
					)}
				</div>
			</div>
		</div>
	);
}
