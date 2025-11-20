import { copyToClipboard } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import CopyToClipboardElement from './copy-to-clipboard';
import AddressLink from '../address-link';
import { useSettings } from '@/lib/context/settings-context-provider';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export interface InfoBoxItem {
	name: string;
	value: React.ReactNode;
	isCopyable?: boolean;
	linkHref?: string;
	valueToCopy?: string;
}

export function InfoBox({ details }: { details: InfoBoxItem[] }) {
	const { customSettings } = useSettings();
	return (
		<Card className="h-full">
			<CardContent className="p-2 text-xs flex gap-x-3 flex-wrap leading-loose overflow-x-auto">
				{details.map(
					({ name, value, isCopyable, valueToCopy, linkHref }) =>
						value && (
							<span key={name} className="whitespace-nowrap">
								<span className="text-neutral-500">{name}:</span>{' '}
								<span className="inline-block leading-normal align-baseline whitespace-nowrap">
									<div className="flex items-center gap-1">
										<CopyToClipboardElement
											value={
												isCopyable && valueToCopy
													? valueToCopy
													: typeof value === 'string'
													? value
													: null
											}
											toastDescription={`${name} has been copied.`}
											className={`rounded-sm font-mono leading-normal ${
												typeof value === 'string' && value.startsWith('0x')
													? ' px-0  hover:bg-inherit'
													: 'px-1 '
											} ${isCopyable ? 'cursor-pointer' : ''}`}
										>
											{typeof value === 'string' && value.startsWith('0x') ? (
												<AddressLink
													address={value}
													addressClassName="leading-normal"
													customSettings={customSettings}
												>
													{value}
												</AddressLink>
											) : (
												value
											)}
										</CopyToClipboardElement>
										{linkHref && (
											<Link
												href={linkHref}
												target="_blank"
												className="z-10 bg-accent focus:outline-none hover:bg-accent_2 cursor-pointer p-1 rounded-sm"
											>
												<ArrowTopRightOnSquareIcon className="w-3 h-3" />
											</Link>
										)}
									</div>
								</span>
							</span>
						)
				)}
			</CardContent>
		</Card>
	);
}
