import React from 'react';
import clsx from 'clsx';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js';
import { CallType } from '@/lib/simulation';
export * from './root';

export const CALL_NESTING_SPACE_BUMP: number = 16; // in pixels

export const TraceLine = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<'div'> & {
		isUnclickable?: boolean;
		isActive?: boolean;
		previewMod?: boolean;
	}
>(({ className, isUnclickable, isActive, previewMod = false, ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={clsx(
				`${previewMod ? '' : 'py-0.5'} px-4 flex flex-row items-center font-mono border-y-2 ${
					isActive ? 'border-neutral-300 trace-line--selected' : 'border-transparent'
				} ${isUnclickable ? '' : 'hover:bg-neutral-100 cursor-pointer'}`,
				className
			)}
			{...props}
		/>
	);
});
TraceLine.displayName = 'TraceLine';

type CallTypeChipKind = CallType | 'Function' | 'Error' | 'Event';
export function CallTypeChip(kind: CallTypeChipKind) {
	let callTypeCellClass: { [key: string]: string } = {
		['Call']: 'bg-green-100 border-green-400 text-green-900',
		['Delegate']: 'bg-blue-100 border-blue-400 text-blue-900',
		['Event']: 'bg-blue-100 border-blue-400 text-blue-900',
		['Error']: 'border-red-900 text-red-900',
		['Function']: 'bg-purple-100 border-purple-400 text-purple-900'
	};

	return (
		<>
			<div className="w-20 flex-none flex relative">
				<div
					className={`${callTypeCellClass[kind]} flex-auto border text-center rounded-sm inline-block px-1.5 py-0.5 mr-1`}
				>
					{kind.toUpperCase()}
				</div>
			</div>
		</>
	);
}
