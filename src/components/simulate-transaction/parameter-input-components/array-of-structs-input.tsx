import { Label } from '@/components/ui/label';

import { getDefaultValue } from '@/lib/utils/parameter-utils';
import { ParameterInput } from '../parameter-input';
import { ParameterContainer, ParameterHeader, ArrayControls } from './parameter-input-components';

interface ArrayOfStructsInputProps {
	parameter: {
		name: string;
		type_name: string;
		value: any;
	};
	elementType: string;
	arrayValue: any[];
	functionInput?: any;
	hasStructMembers: boolean;
	onValueChange: (newValue: any) => void;
	onChildValidationChange: (key: string, isValid: boolean) => void;
}

export const ArrayOfStructsInput = ({
	parameter,
	elementType,
	arrayValue,
	functionInput,
	hasStructMembers,
	onValueChange,
	onChildValidationChange
}: ArrayOfStructsInputProps) => {
	const hasEnumVariants =
		functionInput?.enum_variants && functionInput.enum_variants.length > 0;

	const detectEnumVariantFromItem = (item: any): string | null => {
		if (!hasEnumVariants || typeof item !== 'object' || item === null) {
			return null;
		}

		if ('__enum_variant' in item) {
			return item.__enum_variant;
		}

		const itemFieldNames = Object.keys(item)
			.filter((key) => /^\d+$/.test(key))
			.sort((a, b) => parseInt(a) - parseInt(b))
			.map((key) => item[key]?.name)
			.filter(Boolean);

		if (itemFieldNames.length === 0) {
			return null;
		}

		for (const variant of functionInput.enum_variants) {
			if (!variant.struct_members || variant.struct_members.length === 0) {
				continue;
			}

			const variantFieldNames = variant.struct_members.map((m: any) => m.name);

			if (
				variantFieldNames.length === itemFieldNames.length &&
				variantFieldNames.every((name: string, idx: number) => name === itemFieldNames[idx])
			) {
				return variant.name;
			}
		}

		return null;
	};

	const getStructMembers = (item: any) => {
		let structMembers: any[] = [];

		if (hasStructMembers) {
			structMembers = functionInput.struct_members.map((member: any, memberIdx: number) => {
				let existingValue;

				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
					const itemMember = item[memberIdx.toString()];
					if (itemMember && typeof itemMember === 'object' && 'value' in itemMember) {
						existingValue = itemMember.value;
					}
				}

				return {
					name: member.name,
					type_name: member.type,
					value: existingValue ?? getDefaultValue(member.type, member)
				};
			});
		} else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
			const hasServerFormat = Object.keys(item).some(
				(key) =>
					item[key] &&
					typeof item[key] === 'object' &&
					'name' in item[key] &&
					'type_name' in item[key] &&
					'value' in item[key]
			);

			if (hasServerFormat) {
				structMembers = Object.keys(item)
					.filter((key) => /^\d+$/.test(key))
					.sort((a, b) => parseInt(a) - parseInt(b))
					.map((key) => item[key])
					.filter(
						(member) =>
							member &&
							typeof member === 'object' &&
							'name' in member &&
							'type_name' in member &&
							'value' in member
					);
			}
		}

		return structMembers;
	};

	const handleAdd = () => {
		let newItem: any = {};

		if (hasEnumVariants) {
			const firstVariant = functionInput.enum_variants[0];
			newItem = {
				__enum_variant: firstVariant.name
			};
			if (firstVariant.struct_members && firstVariant.struct_members.length > 0) {
				firstVariant.struct_members.forEach((member: any, idx: number) => {
					newItem[idx.toString()] = {
						name: member.name,
						type_name: member.type,
						value: getDefaultValue(member.type, member)
					};
				});
			} else if (firstVariant.type && firstVariant.type !== '') {
				newItem.__enum_value = getDefaultValue(firstVariant.type);
			}
		} else if (functionInput?.struct_members && functionInput.struct_members.length > 0) {
			functionInput.struct_members.forEach((member: any, idx: number) => {
				newItem[idx.toString()] = {
					name: member.name,
					type_name: member.type,
					value: getDefaultValue(member.type, member)
				};
			});
		} else if (arrayValue.length > 0) {
			const firstElement = arrayValue[0];
			if (
				typeof firstElement === 'object' &&
				firstElement !== null &&
				!Array.isArray(firstElement)
			) {
				Object.keys(firstElement)
					.filter((key) => /^\d+$/.test(key))
					.sort((a, b) => parseInt(a) - parseInt(b))
					.forEach((key) => {
						const existingMember = firstElement[key];
						if (existingMember && typeof existingMember === 'object' && 'name' in existingMember) {
							newItem[key] = {
								name: existingMember.name,
								type_name: existingMember.type_name,
								value: getDefaultValue(existingMember.type_name)
							};
						}
					});
			}
		} else {
			newItem = getDefaultValue(elementType, functionInput);
		}

		const newArray = [...arrayValue, newItem];
		onValueChange(newArray);
	};

	const handleRemove = () => {
		const newArray = arrayValue.slice(0, -1);
		onValueChange(newArray);
	};

	if (hasEnumVariants) {
		return (
			<ParameterContainer>
				<ParameterHeader name={parameter.name} type={parameter.type_name} />

				<div className="space-y-3 pl-2 md:pl-4">
					{arrayValue.map((item: any, idx: number) => {
						const detectedVariant = detectEnumVariantFromItem(item);
						const enumVariant = detectedVariant || functionInput.enum_variants[0]?.name || '';

						const itemTypeName = enumVariant
							? `${elementType}::${enumVariant}`
							: elementType;

						const itemWithVariant =
							detectedVariant && !('__enum_variant' in item)
								? { ...item, __enum_variant: detectedVariant }
								: item;

						return (
							<div key={idx} className="space-y-2 border md:border rounded-lg p-3">
								<div className="flex items-center justify-between border-b md:border-b pb-2">
									<Label className="text-sm font-medium">
										[{idx}] {elementType}
									</Label>
								</div>
								<ParameterInput
									parameter={{
										name: '',
										type_name: itemTypeName,
										value: itemWithVariant
									}}
									functionInput={functionInput}
									onValueChange={(newValue) => {
										const newArray = [...arrayValue];
										newArray[idx] = newValue;
										onValueChange(newArray);
									}}
									onValidationChange={(valid) => {
										onChildValidationChange(`array-enum-${idx}`, valid);
									}}
								/>
							</div>
						);
					})}

					<ArrayControls
						onAdd={handleAdd}
						onRemove={handleRemove}
						hasElements={arrayValue.length > 0}
					/>
				</div>
			</ParameterContainer>
		);
	}

	return (
		<ParameterContainer>
			<ParameterHeader name={parameter.name} type={parameter.type_name} />

			<div className="space-y-3 pl-2 md:pl-4">
				{arrayValue.map((item: any, idx: number) => {
					const structMembers = getStructMembers(item);

					return (
						<div key={idx} className="space-y-2 border md:border rounded-lg p-3">
							<div className="flex items-center justify-between border-b md:border-b pb-2">
								<Label className="text-sm font-medium">
									[{idx}] {elementType}
								</Label>
							</div>
							<Label className="text-sm text-muted-foreground">Struct members</Label>
							<div className="space-y-3 pl-2 md:pl-4">
								{structMembers.map((member: any, memberIdx: number) => {
									let memberDef: any = undefined;
									if (hasStructMembers) {
										const foundMember = functionInput.struct_members.find(
											(m: any) => m.name === member.name
										);
										if (foundMember) {
											memberDef = {
												type: foundMember.type,
												...foundMember
											};
										}
									}

									return (
										<ParameterInput
											key={memberIdx}
											parameter={{
												name: member.name,
												type_name: member.type_name,
												value: member.value
											}}
											functionInput={memberDef}
											onValueChange={(newFieldValue) => {
												const newArray = [...arrayValue];
												const currentItem = newArray[idx];
												const newItem: any = {};

												structMembers.forEach((m: any, mIdx: number) => {
													const existingField =
														typeof currentItem === 'object' && currentItem?.[mIdx.toString()];
													newItem[mIdx.toString()] = existingField
														? { ...existingField }
														: {
																name: m.name,
																type_name: m.type_name,
																value: getDefaultValue(m.type_name)
														  };
												});

												let newTypeName = member.type_name;
												if (memberDef?.enum_variants && typeof newFieldValue === 'string') {
													const enumBase = member.type_name.includes('::')
														? member.type_name.split('::')[0]
														: memberDef.type || member.type_name;
													newTypeName = `${enumBase}::${newFieldValue}`;
												} else if (
													typeof newFieldValue === 'object' &&
													newFieldValue !== null &&
													'__enum_variant' in newFieldValue
												) {
													const enumBase = member.type_name.includes('::')
														? member.type_name.split('::')[0]
														: memberDef?.type || member.type_name;
													newTypeName = `${enumBase}::${newFieldValue.__enum_variant}`;
												}

												newItem[memberIdx.toString()] = {
													name: member.name,
													type_name: newTypeName,
													value: newFieldValue
												};

												newArray[idx] = newItem;
												onValueChange(newArray);
											}}
											onValidationChange={(valid) => {
												onChildValidationChange(`array-${idx}-${memberIdx}`, valid);
											}}
										/>
									);
								})}
							</div>
						</div>
					);
				})}

				<ArrayControls
					onAdd={handleAdd}
					onRemove={handleRemove}
					hasElements={arrayValue.length > 0}
				/>
			</div>
		</ParameterContainer>
	);
};
