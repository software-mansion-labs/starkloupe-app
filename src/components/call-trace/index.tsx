import React from 'react';
import clsx from 'clsx';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js';
import { CallType } from '@/lib/simulation';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
export * from './root';

export const CALL_NESTING_SPACE_BUMP: number = 16; // in pixels

export function TraceLine({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
	return (
		<div
			className={clsx(
				'py-0.5 px-4 flex flex-row items-center hover:bg-neutral-100 font-mono',
				className
			)}
			{...props}
		/>
	);
}

type CallTypeChipKind = CallType | 'Function' | 'Error';
export function CallTypeChip(kind: CallTypeChipKind, isError = false) {
	let callTypeCellClass: { [key: string]: string } = {
		['Call']: 'bg-green-100 border-green-400 text-green-900',
		['Call Delegate']: 'bg-green-100 border-green-400 text-green-900',
		['Delegate']: 'bg-blue-100 border-blue-400 text-blue-900',
		['Event']: 'bg-purple-100 border-purple-400 text-purple-900',
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
				{isError && (
					<ExclamationTriangleIcon className="w-4 h-4 text-red-600 absolute -right-5 top-1" />
				)}
			</div>
		</>
	);
}

// const BRACKETS_COLORS = ['text-lime-600', 'text-red-500', 'text-purple-500'];
// function CallInputs(inputs?: CallIoDecoded[], isShorten = false, nestingLevel = 0) {
// 	const BRACKETS_COLOR = BRACKETS_COLORS.at(nestingLevel % BRACKETS_COLORS.length);

// 	return inputs?.map((i, index) => (
// 		<span key={index}>
// 			{i.name && <span className="text-sky-900">{i.name}=</span>}
// 			{typeof i.value === 'string' ? (
// 				<span className="text-orange-800">{isShorten ? shortenHash(i.value) : i.value}</span>
// 			) : i.value_formats && i.value_formats.DECIMAL ? (
// 				<span className="text-green-700">{i.value_formats.DECIMAL}</span>
// 			) : (
// 				<span>
// 					<span className={BRACKETS_COLOR}>{'{'}</span>
// 					{CallInputs(i.value, isShorten, ++nestingLevel)}
// 					<span className={BRACKETS_COLOR}>{'}'}</span>
// 				</span>
// 			)}
// 			{index + 1 < inputs.length ? ',\u00A0' : ''}
// 		</span>
// 	));
// }

// function CallDetailsIo(tables: { name: string; io: CallIoDecoded[] }[]) {
// 	return (
// 		tables.some((t) => t.io.length > 0) && (
// 			<div className="border border-neutral-300 rounded-sm my-2 overflow-hidden">
// 				<Table className="text-xs">
// 					<TableBody>
// 						{tables.map(
// 							(t, index) =>
// 								t.io.length > 0 && (
// 									<React.Fragment key={index}>
// 										<TableRow className="bg-neutral-100">
// 											<TableHead>{t.name}</TableHead>
// 											<TableHead>Type</TableHead>
// 											<TableHead>Value</TableHead>
// 										</TableRow>
// 										{t.io.map((i, index) => (
// 											<TableRow key={index}>
// 												<TableCell>{i.name}</TableCell>
// 												<TableCell>{i.type}</TableCell>
// 												<TableCell>
// 													{typeof i.value === 'string' ? (
// 														<span>{i.value}</span>
// 													) : i.type && i.type.slice(-1) === '*' ? (
// 														<span>[{CallInputs(i.value)}]</span>
// 													) : i.value_formats && i.value_formats.DECIMAL ? (
// 														<span>{i.value_formats.DECIMAL}</span>
// 													) : (
// 														<span>
// 															{'{ '}
// 															{CallInputs(i.value)}
// 															{' }'}
// 														</span>
// 													)}
// 												</TableCell>
// 											</TableRow>
// 										))}
// 									</React.Fragment>
// 								)
// 						)}
// 					</TableBody>
// 				</Table>
// 			</div>
// 		)
// 	);
// }
