import { copyToClipboard } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import CopyToClipboardElement from './copy-to-clipboard';

export interface InfoBoxItem {
	name: string;
	value: React.ReactNode;
	isCopyable?: boolean;
	valueToCopy?: string;
}

export function InfoBox({ details }: { details: InfoBoxItem[] }) {
	return (
		<Card>
			<CardContent className="p-2 text-xs flex gap-x-3 flex-wrap leading-loose">
				{details.map(
					({ name, value, isCopyable, valueToCopy }) =>
						value && (
							<span key={name} className="whitespace-nowrap">
								<span className="text-neutral-500">{name}:</span>{' '}
								<CopyToClipboardElement
									value={
										isCopyable && valueToCopy
											? valueToCopy
											: typeof value === 'string'
											? value
											: null
									}
									toastDescription={`${name} has been copied.`}
									className={`rounded-sm font-mono px-1 ${
										isCopyable ? 'cursor-pointer hover:bg-black/10' : ''
									}`}
								>
									{value}
								</CopyToClipboardElement>
							</span>
						)
				)}
			</CardContent>
		</Card>
	);
}
