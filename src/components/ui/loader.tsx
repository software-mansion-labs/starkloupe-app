import * as React from 'react';

import { cn } from '@/lib/utils';

const Loader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, children, ...props }, ref) => (
		<div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
			<span className="h-6 w-6 block rounded-full border-4 border-t-blue-500 animate-spin"></span>
			loading...
		</div>
	)
);
Loader.displayName = 'Loader';

export { Loader };
