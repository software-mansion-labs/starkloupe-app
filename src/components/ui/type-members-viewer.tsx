import React, { useState } from 'react';
import { TriangleRightIcon, TriangleDownIcon } from '@radix-ui/react-icons';
import { FunctionInput, FunctionOutput } from '@/lib/contracts';

const TypeMembersViewer = ({
	data,
	entrypointAddress
}: {
	data: FunctionInput | FunctionOutput;
	entrypointAddress: string;
}) => {
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	const toggleExpand = (key: string): void => {
		setExpanded((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(key)) newSet.delete(key);
			else newSet.add(key);
			return newSet;
		});
	};

	const renderMember = (
		member: FunctionInput | FunctionOutput,
		path: string,
		isRoot = false,
		isVariant = false
	) => {
		const key = path;
		const hasMembers = member.struct_members && member.struct_members.length > 0;
		const hasVariants = member.enum_variants && member.enum_variants.length > 0;

		if (hasMembers || hasVariants) {
			const childItems = hasMembers ? member.struct_members! : member.enum_variants!;
			return (
				<div className={`font-mono ${isRoot ? '' : 'ml-2'}`}>
					<div
						className="flex items-center cursor-pointer w-fit select-none hover:bg-accent pr-1 rounded-sm transition-all delay-75 ease-out mb-1.5 mr-2"
						onClick={() => toggleExpand(key)}
					>
						<span className="-m-1">
							{expanded.has(key) ? (
								<TriangleDownIcon className="h-4 w-4 mr-1" />
							) : (
								<TriangleRightIcon className="h-4 w-4 mr-1" />
							)}
						</span>
						<span className={`font-semibold text-pink-900 dark:text-keys`}>{member.name}</span>
						{member.type && member.type !== '' && (
							<span>
								:<span className="ml-1 text-typeColor">{member.type}</span>
							</span>
						)}
						{!expanded.has(key) && (
							<span className="italic font-normal ml-1">
								[{hasVariants ? 'enum_variants...' : '{...}'}]
							</span>
						)}
					</div>

					{expanded.has(key) && (
						<div className="ml-2 mb-1.5 pl-2">
							<div className={`text-xs italic tracking-wider font-bold mb-2 `}>
								{hasVariants ? 'enum_variants:' : 'struct_members:'}
							</div>

							{childItems.map((childMember, idx) => (
								<div key={idx} className="whitespace-pre mb-1.5">
									{renderMember(childMember, `${key}.${childMember.name}`, false, hasVariants)}
								</div>
							))}
						</div>
					)}
				</div>
			);
		}

		return (
			<div className={`${isRoot ? '' : 'ml-2'} mb-1.5 font-mono`}>
				<span className={`font-semibold text-pink-900 dark:text-keys`}>{member.name}</span>
				{member.type && member.type !== '' && (
					<span>
						:<span className="ml-1 text-typeColor">{member.type}</span>
					</span>
				)}
			</div>
		);
	};

	const renderRootType = () => {
		const rootKey = data.name || `${data.type}-${entrypointAddress}`;
		const hasMembers = data.struct_members && data.struct_members.length > 0;
		const hasVariants = data.enum_variants && data.enum_variants.length > 0;

		if (!hasMembers && !hasVariants) {
			return (
				<div className="font-mono px-2 my-2">
					{data.name && <span className="font-semibold">{data.name}:</span>}
					<span className="ml-1 text-typeColor">{data.type}</span>
				</div>
			);
		}

		const childItems = hasMembers ? data.struct_members! : data.enum_variants!;

		return (
			<div className="font-mono px-2 my-2">
				<div
					className="flex items-center cursor-pointer w-fit select-none hover:bg-accent pr-1 rounded-sm transition-all delay-75 ease-out mb-1.5 mr-2"
					onClick={() => toggleExpand(rootKey)}
				>
					<span className="-m-1">
						{expanded.has(rootKey) ? (
							<TriangleDownIcon className="h-4 w-4 mr-1" />
						) : (
							<TriangleRightIcon className="h-4 w-4 mr-1" />
						)}
					</span>
					{data.name && <span className="font-semibold">{data.name}:</span>}
					<span className="ml-1 text-typeColor">{data.type}</span>
					{!expanded.has(rootKey) && (
						<span className="italic font-normal ml-1">
							[{hasVariants ? 'enum_variants...' : '{...}'}]
						</span>
					)}
				</div>

				{expanded.has(rootKey) && (
					<div className="ml-2 mb-1.5  pl-2">
						<div className={`text-xs italic tracking-wider font-bold mb-1 `}>
							{hasVariants ? 'enum_variants:' : 'struct_members:'}
						</div>

						{childItems.map((member, idx) => (
							<div key={idx} className="whitespace-pre mb-1.5">
								{renderMember(member, `${rootKey}.${member.name}`, false, hasVariants)}
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	return renderRootType();
};

export default TypeMembersViewer;
