import { InternalFnCallIO } from '@/lib/simulation';
import React, { useContext, useEffect, useState } from 'react';
import { TriangleRightIcon, TriangleDownIcon } from '@radix-ui/react-icons';
import { DebuggerContext } from '@/lib/context/debugger-context-provider';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';

interface FilteredStepInfo {
	function: string | undefined;
	args: InternalFnCallIO[];
	result: InternalFnCallIO[];
}

const FunctionCallViewer = ({ data }: { data: FilteredStepInfo }) => {
	const { sourceCode, activeFile, currentStep, codeLocation } = useContext(DebuggerContext);
	const { simulationResult } = useCallTrace();
	const stepWithLocation = currentStep?.withLocation;
	const functionCallDetails =
		stepWithLocation && simulationResult.functionCallsMap[stepWithLocation.functionCallId];
	const [results, setResults] = useState(functionCallDetails?.resultsDecoded);
	console.log('functionCallDetails?.fnName', functionCallDetails?.fnName);
	const [args, setArgs] = useState(functionCallDetails?.argumentsDecoded);
	console.log('args', args);
	console.log('results', results);
	const [expression, setExpression] = useState<string>('');

	useEffect(() => {
		setResults(currentStep?.withLocation?.results);
		setArgs(currentStep?.withLocation?.arguments);
	}, [currentStep]);

	function extractCodeFragment(
		sourceCode: string,
		start: { line: number; col: number },
		end: { line: number; col: number }
	): string {
		const lines = sourceCode.split('\n');

		const startLine = start.line;
		const endLine = end.line;
		if (startLine === endLine) {
			return lines[startLine].substring(start.col, end.col);
		}

		let fragment = [];

		fragment.push(lines[startLine].substring(start.col));

		for (let i = startLine + 1; i < endLine; i++) {
			fragment.push(lines[i]);
		}

		fragment.push(lines[endLine].substring(0, end.col));

		return fragment.join('\n');
	}

	function truncateString(str: string, maxLength: number): string {
		if (!str) return '';

		const cleanedStr = str.replace(/\s+/g, ' ').trim();

		if (cleanedStr.length <= maxLength) return cleanedStr;
		return cleanedStr.substring(0, maxLength) + '...';
	}

	useEffect(() => {
		if (activeFile && codeLocation?.start && codeLocation?.end) {
			setExpression(
				truncateString(
					extractCodeFragment(sourceCode[activeFile], codeLocation.start, codeLocation.end),
					50
				)
			);
		}
	}, [activeFile, codeLocation, sourceCode]);

	const CollapsibleArray = ({
		value,
		name
	}: {
		value: string[] | InternalFnCallIO[];
		name: string | null;
	}) => {
		const isSimpleArray =
			Array.isArray(value) &&
			value.every((item) => typeof item === 'string' || typeof item === 'number');

		if (!isSimpleArray) {
			return null;
		}

		return (
			<div className="font-mono">
				<div
					className="flex items-center cursor-pointer hover:bg-slate-50 pr-1 rounded-sm transition-all delay-75 ease-out mb-1 mr-2"
					onClick={() => toggleExpand(name + value.length.toString())}
				>
					{isExpanded.includes(name + value.length.toString()) ? (
						<>
							<span className="-m-1">
								<TriangleDownIcon className="h-4 w-4 mr-1" />
							</span>
							<span className="text-pink-900 font-semibold">{name}: </span>
						</>
					) : (
						<>
							<span className="-m-1">
								<TriangleRightIcon className="h-4 w-4 mr-1" />
							</span>
							<span>
								<span className="text-pink-900 font-semibold ">{name}:</span>
								<span className="italic">
									({value.length}){' '}
									{`[${value.length > 0 ? (value.length === 1 ? value.join(', ') : '...') : ''}]`}
								</span>
							</span>
						</>
					)}
				</div>

				{isExpanded.includes(name + value.length.toString()) && (
					<div className="ml-2 mb-1">
						{value.map((item, index) => (
							<div key={index} className="whitespace-pre">
								<span className="text-pink-900 font-semibold">{index}: </span>
								{`${item}`}
							</div>
						))}
					</div>
				)}
			</div>
		);
	};
	const [isExpanded, setIsExpanded] = useState<string[]>([]);
	const toggleExpand = (typeName: string) => {
		setIsExpanded((prev) =>
			prev.includes(typeName) ? prev.filter((name) => name !== typeName) : [...prev, typeName]
		);
	};
	const renderValue = (value: InternalFnCallIO | string | string[], path: string = '') => {
		if (value && typeof value === 'object' && 'typeName' in value && 'value' in value) {
			if (
				Array.isArray(value.value) &&
				value.value.every((item) => typeof item === 'string' || typeof item === 'number')
			) {
				if (value.typeName?.includes('PanicResult') && Array.isArray(value.value)) {
					value = { ...value, value: value.value.slice(2) };
				}
				return <CollapsibleArray value={value.value} name={value.typeName} />;
			}

			if (typeof value.value === 'object' && value.value !== null && value.typeName) {
				const isArray = Array.isArray(value.value);
				const arrayLength = Object.keys(value.value).length;
				const uniqueId = `${path}_${value.typeName}`;

				if (value.typeName?.includes('PanicResult') && Array.isArray(value.value)) {
					value.value = value.value.slice(2);
				}
				return (
					<div>
						<div
							className="flex items-center cursor-pointer hover:bg-slate-50 pr-1 rounded-sm transition-all delay-75 ease-out mb-1"
							onClick={() =>
								typeof value === 'object' &&
								'typeName' in value &&
								value.typeName &&
								toggleExpand(uniqueId)
							}
						>
							{value.typeName}
							{isExpanded.includes(uniqueId) ? (
								<span className="-m-1">
									<TriangleDownIcon className="h-4 w-4 mr-1" />
								</span>
							) : (
								<span className="-m-1">
									<TriangleRightIcon className="h-4 w-4 mr-1" />
								</span>
							)}
							<span className="text-pink-900 font-semibold">{value.typeName}: </span>
							{!isExpanded.includes(uniqueId) && (
								<span className="ml-1 italic">
									{arrayLength === 1
										? `${typeof value.value[0] === 'string' ? `"${value.value[0]}"` : '{...}'}`
										: '{...}'}
								</span>
							)}
						</div>
						{isExpanded.includes(uniqueId) && (
							<div className="ml-2">
								{isArray
									? value.value.map((val, index) => (
											<div key={index} className="mb-1">
												<div className="flex items-center">
													{typeof val === 'object' && !('typeName' in val) ? (
														<div className="flex-1">
															<div
																className="flex items-center cursor-pointer hover:bg-slate-50 pr-1 rounded-sm transition-all delay-75 ease-out"
																onClick={() => toggleExpand(`${uniqueId}_array-item-${index}`)}
															>
																{isExpanded.includes(`${uniqueId}_array-item-${index}`) ? (
																	<span className="flex items-center -ml-1">
																		<TriangleDownIcon className="h-4 w-4 mr-1" />
																		<span className="text-pink-900 font-semibold">{index}: </span>
																	</span>
																) : (
																	<span className="flex items-center -ml-1">
																		<TriangleRightIcon className="h-4 w-4 mr-1" />
																		<span className="text-pink-900 font-semibold">{index}: </span>
																		<span className="ml-1 italic">{'{...}'}</span>
																	</span>
																)}
															</div>
															{isExpanded.includes(`${uniqueId}_array-item-${index}`) && (
																<div className="ml-2">
																	{Object.values(val).map((nestedVal, i) => (
																		<div className="mb-1" key={i}>
																			{renderValue(
																				nestedVal as InternalFnCallIO | string | string[],
																				`${uniqueId}_${index}_${i}`
																			)}
																		</div>
																	))}
																</div>
															)}
														</div>
													) : (
														<span>
															<span className="text-pink-900 font-semibold">{index}: </span>
															<span>
																{renderValue(
																	val as InternalFnCallIO | string | string[],
																	`${uniqueId}_${index}`
																)}
															</span>
														</span>
													)}
												</div>
											</div>
									  ))
									: Object.values(value.value).map((val, index) => (
											<div key={index} className="mb-1">
												{renderValue(
													val as InternalFnCallIO | string | string[],
													`${uniqueId}_${index}`
												)}
											</div>
									  ))}
							</div>
						)}
					</div>
				);
			}
			if (value.typeName?.includes('PanicResult') && Array.isArray(value.value)) {
				value = { ...value, value: value.value.slice(2) };
			}
			return (
				<span className={`${value.typeName === 'Panic' && '!text-red-600'} mb-1`}>
					<span
						className={`${
							value.typeName === 'Panic' ? '!text-red-600' : 'text-pink-900'
						} font-semibold`}
					>
						{value.typeName}:{' '}
					</span>
					{typeof value.value === 'boolean' ? (value.value ? 'true' : 'false') : value.value}
				</span>
			);
		}

		if (typeof value === 'object' && value !== null) {
			const isArray = Array.isArray(value);
			return (
				<div>
					{isArray
						? value.map((val, index) => (
								<div key={index} className="ml-2 mb-1">
									<span className="text-pink-900 font-semibold">{index}: </span>
									{renderValue(val as InternalFnCallIO | string | string[], `${path}_${index}`)}
								</div>
						  ))
						: Object.values(value).map((val, index) => (
								<div key={index} className="ml-2 mb-1">
									{renderValue(val as InternalFnCallIO | string | string[], `${path}_${index}`)}
								</div>
						  ))}
				</div>
			);
		}

		return value !== null && value !== undefined ? value.toString() : '';
	};
	const RenderArgs = ({ args, isResult }: { args: InternalFnCallIO[]; isResult?: boolean }) => {
		return (
			<div>
				<div className="flex items-center mb-1">
					<span className="font-semibold ">{isResult ? 'result: ' : 'args: '}</span>
				</div>
				<div>
					{args.map((arg, index) => (
						<div key={index} className=" whitespace-nowrap mb-1">
							<div>
								<div className="ml-2 mb-1">{renderValue(arg)}</div>{' '}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="font-mono px-2 my-2">
			<div className="font-bold mb-1">
				fn: <span className="text-pink-500">{data.function}</span>
			</div>
			<div className="mb-1">
				{data.args.length > 0 ? (
					<RenderArgs args={data.args} />
				) : (
					<span className="font-semibold ">args: </span>
				)}
			</div>
			<div className="mb-1">
				{data.result.length > 0 ? (
					<RenderArgs isResult args={data.result} />
				) : (
					<span className="font-semibold ">result: </span>
				)}
			</div>
			<div>
				<div className="mb-1">
					<span className="font-semibold whitespace-nowrap">
						Expression:{' '}
						<span className="bg-yellow-300 bg-opacity-40 font-normal">{expression}</span>
					</span>
				</div>
				<div className="mb-1">
					<span className="font-semibold whitespace-nowrap">
						Line:{' '}
						<span className="font-normal">
							{codeLocation?.start.line && codeLocation?.start.line + 1}
						</span>
					</span>
				</div>
				<div className="mb-1">
					{args && args.length > 0 ? (
						<RenderArgs args={args} />
					) : (
						<span className="font-semibold ">args: </span>
					)}
				</div>
				<div className="mb-1">
					{results && results.length > 0 ? (
						<RenderArgs isResult args={results} />
					) : (
						<span className="font-semibold ">result: </span>
					)}
				</div>
			</div>
		</div>
	);
};

export default FunctionCallViewer;
