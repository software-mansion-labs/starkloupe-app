export function getDefaultValue(type: string, inputDef?: any): any {
	if (type === 'bool') return false;
	if (type.startsWith('Array<')) return [];
	if (inputDef?.enum_variants && inputDef.enum_variants.length > 0) {
		return inputDef.enum_variants[0]?.name || '';
	}
	if (type.includes('felt') || type.includes('u') || type.includes('i')) return '0x0';
	if (type === 'ContractAddress') return '0x0';
	return '';
}

export interface ParsedCalldata {
	parameters: any[];
	nextIndex: number;
}

export function parseRawCalldata(
	rawCalldata: string,
	functionInputs: any[],
	startIndex: number = 0
): ParsedCalldata {
	const calldataArray = rawCalldata
		.trim()
		.split(/[\n,]/)
		.map((item) => item.trim())
		.filter((line) => line !== '');

	let index = startIndex;

	const parseValue = (inputDef: any): any => {
		if (index >= calldataArray.length) {
			return getDefaultValue(inputDef.type, inputDef);
		}

		const spanMatch = inputDef.type?.match(/^Span<(.+)>$/);
		if (spanMatch) {
			const elementType = spanMatch[1];
			const arrayLength = parseInt(calldataArray[index++], 16);
			const arrayValues: any[] = [];

			if (elementType.includes('struct_members')) {
				for (let i = 0; i < arrayLength; i++) {
					const structValue: any = {};
					inputDef.struct_members.forEach((member: any, idx: number) => {
						const parsedValue = parseValue(member);
						structValue[idx.toString()] = {
							name: member.name,
							type_name: member.type,
							value: parsedValue
						};
					});
					arrayValues.push(structValue);
				}
			} else {
				for (let i = 0; i < arrayLength; i++) {
					if (index < calldataArray.length) {
						arrayValues.push(calldataArray[index++]);
					}
				}
			}
			return arrayValues;
		}

		const arrayMatch = inputDef.type?.match(/^Array<(.+)>$/);
		if (arrayMatch) {
			const arrayLength = parseInt(calldataArray[index++], 16);
			const arrayValues: string[] = [];

			for (let i = 0; i < arrayLength; i++) {
				if (index < calldataArray.length) {
					arrayValues.push(calldataArray[index++]);
				}
			}

			return arrayValues;
		}

		const tupleMatch = inputDef.type?.match(/^\((.+)\)$/);
		if (tupleMatch || (inputDef.struct_members && inputDef.type?.includes('('))) {
			const value: any = {};
			inputDef.struct_members.forEach((member: any, idx: number) => {
				const parsedValue = parseValue(member);
				value[idx.toString()] = {
					name: member.name,
					type_name: member.type,
					value: parsedValue
				};
			});
			return value;
		}

		const m = (inputDef.type || '').match(/^u(\d+)$/i);
		const isPrimitiveCompoundType = m ? parseInt(m[1], 10) > 128 : false;

		if (isPrimitiveCompoundType && inputDef.struct_members && inputDef.struct_members.length > 0) {
			const value: any = {};
			inputDef.struct_members.forEach((member: any, idx: number) => {
				value[idx.toString()] = {
					name: member.name,
					type_name: member.type,
					value: calldataArray[index++] || '0x0'
				};
			});
			return value;
		}

		if (inputDef.enum_variants && inputDef.enum_variants.length > 0) {
			const rawValue = calldataArray[index++];
			const variantIndex = parseInt(rawValue, 16);
			const variant = inputDef.enum_variants[variantIndex];
			if (!variant) {
				return rawValue;
			}

			if (!variant.struct_members || variant.struct_members.length === 0) {
				return variant.name;
			}

			const value: any = {};
			variant.struct_members.forEach((member: any, idx: number) => {
				const parsedValue = parseValue(member);
				value[idx.toString()] = {
					name: member.name,
					type_name: member.type,
					value: parsedValue
				};
			});
			return value;
		}

		if (inputDef.struct_members && inputDef.struct_members.length > 0) {
			const value: any = {};
			inputDef.struct_members.forEach((member: any, idx: number) => {
				const parsedValue = parseValue(member);
				value[idx.toString()] = {
					name: member.name,
					type_name: member.type,
					value: parsedValue
				};
			});
			return value;
		}

		if (inputDef.type === 'bool') {
			const hexValue = calldataArray[index++];
			return hexValue === '0x1' || hexValue === '0x01';
		}

		return calldataArray[index++];
	};

	const parameters = functionInputs.map((input) => {
		const parsedValue = parseValue(input);
		const type_name =
			input.enum_variants && input.enum_variants.length > 0 && typeof parsedValue === 'string'
				? `${input.type}::${parsedValue}`
				: input.type;

		return {
			name: input.name,
			type_name,
			value: parsedValue
		};
	});

	return { parameters, nextIndex: index };
}

export function parseEnumFromCalldata(
	calldataArray: string[],
	variants: any[]
): { variantName: string; variantData: any } | null {
	if (!calldataArray || calldataArray.length === 0) return null;

	const variantIndex = parseInt(calldataArray[0], 16);
	if (variantIndex >= variants.length) return null;

	const variant = variants[variantIndex];
	return {
		variantName: variant.name,
		variantData: variant
	};
}
