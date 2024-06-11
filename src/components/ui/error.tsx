import * as React from 'react';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { Button } from './button';

export function SimulationError({ message }: { message: string }) {
	const [copyToastVisible, setCopyToastVisible] = React.useState(false);

	const onCopyToClipboardClick = () => {
		navigator.clipboard.writeText(message);
		setCopyToastVisible(true);

		setTimeout(() => {
			setCopyToastVisible(false);
		}, 3000);
	};

	let copyButton;
	if (copyToastVisible) {
		copyButton = <span className="text-xs font-medium mr-3">Copied!</span>;
	} else {
		copyButton = (
			<Button variant="ghost" size="sm" onClick={onCopyToClipboardClick}>
				<ClipboardDocumentIcon className="mr-2 h-4 w-4" /> Copy
			</Button>
		);
	}

	return (
		<div className="my-8">
			<h3 className="text-md mb-4 font-medium text-gray-800 whitespace-pre-line">
				Oops! Something went nuts. Try again.
			</h3>

			<div className="rounded-md border">
				<div className="flex items-center justify-between border-b p-2 pl-4 text-neutral-800 bg-neutral-100">
					<p className="text-sm">Walnut server error</p>

					<div className="flex items-center h-8">{copyButton}</div>
				</div>

				<ScrollArea className="h-fit whitespace-nowrap bg-neutral-50">
					<div className="flex w-max space-x-4 p-4">
						<pre className="text-red-700 text-xs">{message}</pre>
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
		</div>
	);
}
