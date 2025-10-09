export function getDefaultValue(type: string, inputDef?: any): any {
	if (type === 'bool') return false;
	if (type.startsWith('Array<')) return [];
	if (type.startsWith('Span<')) return [];
	if (inputDef?.enum_variants && inputDef.enum_variants.length > 0) {
		return inputDef.enum_variants[0]?.name || '';
	}
	if (inputDef?.struct_members && inputDef.struct_members.length > 0) {
		const structObj: any = {};
		inputDef.struct_members.forEach((member: any, idx: number) => {
			structObj[idx.toString()] = {
				name: member.name,
				type_name: member.type,
				value: getDefaultValue(member.type, member)
			};
		});
		return structObj;
	}
	if (type.match(/^u\d+$/)) return '0';
	if (type.match(/^i\d+$/)) return '0';
	if (type.includes('felt') || type === 'ContractAddress') return '0x0';
	return '';
}

export function getInitialEnumVariant(
	parameter: { type_name: string; value: any },
	functionInput?: any
): string {
	if (parameter.type_name.includes('::')) {
		return parameter.type_name.split('::')[1];
	}

	if (typeof parameter.value === 'object' && parameter.value !== null) {
		if ('__enum_variant' in parameter.value) {
			return parameter.value.__enum_variant;
		}

		if (functionInput?.enum_variants) {
			for (const variant of functionInput.enum_variants) {
				if (variant.struct_members && variant.struct_members.length > 0) {
					const hasMatchingStructure = variant.struct_members.every((member: any, idx: number) => {
						return parameter.value[idx.toString()]?.name === member.name;
					});
					if (hasMatchingStructure) {
						return variant.name;
					}
				}
			}
		}
		return functionInput?.enum_variants?.[0]?.name || '';
	}

	if (typeof parameter.value === 'string' && functionInput?.enum_variants) {
		// Check if the string value is a variant name
		const variantMatch = functionInput.enum_variants.find((v: any) => v.name === parameter.value);
		if (variantMatch) {
			return parameter.value;
		}
	}

	return functionInput?.enum_variants?.[0]?.name || '';
}

export function isPrimitiveCompoundType(functionInput?: any): boolean {
	const typeMatch = functionInput?.type?.match(/^u(\d+)$/);
	const bitSize = typeMatch ? parseInt(typeMatch[1]) : 0;
	return bitSize > 128 && functionInput?.struct_members && functionInput.struct_members.length > 0;
}

export function parseTupleType(typeName: string): string[] | null {
	const tupleMatch = typeName?.match(/^\((.+)\)$/);
	if (tupleMatch) {
		return tupleMatch[1].split(',').map((t) => t.trim());
	}
	return null;
}

export function parseArrayType(typeName: string): string | null {
	const arrayMatch = typeName?.match(/^Array<(.+)>$/) || typeName?.match(/^Span<(.+)>$/);
	return arrayMatch ? arrayMatch[1] : null;
}

export function hasNestedStructure(value: any): boolean {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.keys(value).some(
			(key) =>
				value[key] &&
				typeof value[key] === 'object' &&
				'name' in value[key] &&
				'type_name' in value[key] &&
				'value' in value[key]
		)
	);
}

export function hasComplexArrayElements(arrayValue: any[]): boolean {
	return (
		arrayValue.length > 0 &&
		arrayValue.some(
			(item: any) =>
				typeof item === 'object' &&
				item !== null &&
				!Array.isArray(item) &&
				Object.keys(item).some(
					(key) =>
						item[key] &&
						typeof item[key] === 'object' &&
						'name' in item[key] &&
						'type_name' in item[key] &&
						'value' in item[key]
				)
		)
	);
}

export function extractStructMembers(value: any): any[] {
	return Object.keys(value)
		.sort()
		.map((key) => value[key])
		.filter(
			(item) =>
				item && typeof item === 'object' && 'name' in item && 'type_name' in item && 'value' in item
		);
}

export function flattenParameters(
	inputs: any[],
	prefix: string = '',
	structInfo?: { name: string; type: string }
): any[] {
	const result: any[] = [];

	for (const input of inputs) {
		const paramName = prefix ? `${prefix}_${input.name}` : input.name;

		if (input.struct_members && input.struct_members.length > 0) {
			result.push(
				...flattenParameters(input.struct_members, paramName, {
					name: paramName,
					type: input.type
				})
			);
		} else {
			const defaultValue = getDefaultValue(input.type, input);
			const type_name =
				input.enum_variants && input.enum_variants.length > 0 && typeof defaultValue === 'string'
					? `${input.type}::${defaultValue}`
					: input.type;

			result.push({
				name: paramName,
				type_name,
				value: defaultValue,
				...(structInfo && { _struct_info: structInfo })
			});
		}
	}

	return result;
}
