import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Button } from '../ui/button';
import { validateType } from '../../lib/utils/validation-utils';
import {
	getDefaultValue,
	getInitialEnumVariant,
	isPrimitiveCompoundType,
	parseTupleType,
	parseArrayType,
	hasNestedStructure,
	hasComplexArrayElements,
	extractStructMembers
} from '../../lib/utils/parameter-utils';

interface ParameterInputProps {
	parameter: {
		name: string;
		type_name: string;
		value: any;
	};
	onValueChange: (newValue: any) => void;
	onValidationChange?: (isValid: boolean) => void;
	functionInput?: any;
}

export const ParameterInput = ({
	parameter,
	onValueChange,
	onValidationChange,
	functionInput
}: ParameterInputProps) => {
	const [enumVariant, setEnumVariant] = useState<string>(() =>
		getInitialEnumVariant(parameter, functionInput)
	);
	const [isValid, setIsValid] = useState<boolean>(true);
	const [childrenValidation, setChildrenValidation] = useState<Map<string, boolean>>(new Map());

	useEffect(() => {
		if (parameter.type_name.includes('::')) {
			const variantFromType = parameter.type_name.split('::')[1];
			if (variantFromType !== enumVariant) {
				setEnumVariant(variantFromType);
			}
		} else if (
			typeof parameter.value === 'object' &&
			parameter.value !== null &&
			'__enum_variant' in parameter.value &&
			parameter.value.__enum_variant !== enumVariant
		) {
			setEnumVariant(parameter.value.__enum_variant);
		}
	}, [parameter.type_name, parameter.value, enumVariant]);
	useEffect(() => {
		if (typeof parameter.value === 'string') {
			const valid = validateType(parameter.value, parameter.type_name);
			setIsValid(valid);
			onValidationChange?.(valid);
		}
	}, [parameter.value, parameter.type_name]);

	useEffect(() => {
		const allChildrenValid = Array.from(childrenValidation.values()).every((v) => v);
		const currentValid = isValid && (childrenValidation.size === 0 || allChildrenValid);
		onValidationChange?.(currentValid);
	}, [childrenValidation, isValid]);

	const _isPrimitiveCompoundType = isPrimitiveCompoundType(functionInput);

	const tupleTypes = parseTupleType(parameter.type_name);
	if (tupleTypes && Array.isArray(parameter.value)) {
		return (
			<div className="space-y-3 border col-span-3 rounded-lg p-4 ">
				<div className="flex items-center justify-between">
					<Label className="font-medium">{parameter.name}</Label>
					<span className="text-xs text-muted-foreground">{parameter.type_name}</span>
				</div>

				<div className="space-y-3 pl-4 ">
					{parameter.value.map((item: any, idx: number) => {
						const elementType = tupleTypes[idx] || 'felt252';
						const itemValid = validateType(item || '', elementType);

						return (
							<div key={idx} className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-sm">[{idx}]</Label>
									<div className="text-xs text-muted-foreground">{elementType}</div>
								</div>

								<Input
									value={item || ''}
									onChange={(e) => {
										const newArray = [...parameter.value];
										newArray[idx] = e.target.value;
										onValueChange(newArray);

										const valid = validateType(e.target.value, elementType);
										setChildrenValidation((prev) => {
											const next = new Map(prev);
											next.set(`tuple-${idx}`, valid);
											return next;
										});
									}}
									className={`font-mono text-sm ${
										!itemValid ? 'border-red-500 focus-visible:ring-red-500' : ''
									}`}
									placeholder={`Enter ${elementType}...`}
								/>
								<span
									className={`text-xs ${!itemValid ? 'text-red-500' : 'text-muted-foreground'}`}
								>
									{!itemValid && 'Invalid format'}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	const elementType = parseArrayType(parameter.type_name);
	if (elementType) {
		const arrayValue = Array.isArray(parameter.value) ? parameter.value : [];

		const hasStructMembers =
			functionInput?.struct_members && functionInput.struct_members.length > 0;

		const _hasComplexElements = hasComplexArrayElements(arrayValue);

		if (_hasComplexElements || hasStructMembers) {
			return (
				<div className="space-y-3 border col-span-3 rounded-lg p-4 ">
					<div className="flex items-center justify-between">
						<Label className="font-medium">{parameter.name}</Label>
						<span className="text-xs text-muted-foreground">{parameter.type_name}</span>
					</div>

					<div className="space-y-3 pl-4 ">
						{arrayValue.map((item: any, idx: number) => {
							let structMembers: any[] = [];

							if (hasStructMembers) {
								structMembers = functionInput.struct_members.map(
									(member: any, memberIdx: number) => {
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
									}
								);
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

							return (
								<div key={idx} className="space-y-2 border rounded-lg p-3">
									<div className="flex items-center justify-between border-b pb-2">
										<Label className="text-sm font-medium">
											[{idx}] {elementType}
										</Label>
									</div>
									<Label className="text-sm text-muted-foreground">Struct members</Label>
									<div className="space-y-3 pl-4 ">
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

														newItem[memberIdx.toString()] = {
															name: member.name,
															type_name: member.type_name,
															value: newFieldValue
														};

														newArray[idx] = newItem;
														onValueChange(newArray);
													}}
													onValidationChange={(valid) => {
														setChildrenValidation((prev) => {
															const next = new Map(prev);
															next.set(`array-${idx}-${memberIdx}`, valid);
															return next;
														});
													}}
												/>
											);
										})}
									</div>
								</div>
							);
						})}

						<div className="flex gap-2 items-center">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									let newStructItem: any = {};

									if (functionInput?.struct_members && functionInput.struct_members.length > 0) {
										functionInput.struct_members.forEach((member: any, idx: number) => {
											newStructItem[idx.toString()] = {
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
													if (
														existingMember &&
														typeof existingMember === 'object' &&
														'name' in existingMember
													) {
														newStructItem[key] = {
															name: existingMember.name,
															type_name: existingMember.type_name,
															value: getDefaultValue(existingMember.type_name)
														};
													}
												});
										}
									} else {
										newStructItem = getDefaultValue(elementType, functionInput);
									}

									const newArray = [...arrayValue, newStructItem];
									onValueChange(newArray);
								}}
							>
								Add element
							</Button>

							{arrayValue.length > 0 && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										const newArray = arrayValue.slice(0, -1);
										onValueChange(newArray);
									}}
								>
									Remove last
								</Button>
							)}
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="space-y-3 border col-span-3 rounded-lg p-4 ">
				<div className="flex items-center justify-between">
					<Label className="font-medium">{parameter.name}</Label>
					<span className="text-xs text-muted-foreground">{parameter.type_name}</span>
				</div>

				<div className="space-y-3 pl-4 ">
					{arrayValue.map((item: any, idx: number) => {
						const itemValid = validateType(item || '', elementType);

						return (
							<div key={idx} className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-sm">[{idx}]</Label>
									<div className="text-xs text-muted-foreground"> {elementType}</div>
								</div>

								<Input
									value={item || ''}
									onChange={(e) => {
										const newArray = [...arrayValue];
										newArray[idx] = e.target.value;
										onValueChange(newArray);

										const valid = validateType(e.target.value, elementType);
										setChildrenValidation((prev) => {
											const next = new Map(prev);
											next.set(`array-${idx}`, valid);
											return next;
										});
									}}
									className={`font-mono text-sm ${
										!itemValid ? 'border-red-500 focus-visible:ring-red-500' : ''
									}`}
									placeholder={`Enter ${elementType}...`}
								/>
								<span
									className={`text-xs ${!itemValid ? 'text-red-500' : 'text-muted-foreground'}`}
								>
									{!itemValid && 'Invalid format'}
								</span>
							</div>
						);
					})}

					<div className="flex gap-2 items-center">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								const newArray = [...arrayValue, getDefaultValue(elementType)];
								onValueChange(newArray);
							}}
						>
							Add element
						</Button>

						{arrayValue.length > 0 && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									const newArray = arrayValue.slice(0, -1);
									onValueChange(newArray);
								}}
							>
								Remove last
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	}
	if (_isPrimitiveCompoundType) {
		return (
			<div className="space-y-3 border col-span-3 rounded-lg p-4 ">
				<div className="flex items-center justify-between">
					<Label className="font-medium">{parameter.name}</Label>
					<span className="text-xs text-muted-foreground">{functionInput.type}</span>
				</div>

				<div className="space-y-3 pl-4 ">
					{functionInput.struct_members.map((member: any, idx: number) => {
						const fieldValue = parameter.value?.[idx.toString()];
						const fieldValid = validateType(fieldValue?.value || '', member.type);

						return (
							<div key={idx} className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-sm">{member.name}</Label>
									<div className="text-xs text-muted-foreground">{member.type}</div>
								</div>
								<Input
									value={fieldValue?.value || ''}
									onChange={(e) => {
										let newValue: any = {};

										if (
											typeof parameter.value === 'object' &&
											parameter.value !== null &&
											!Array.isArray(parameter.value)
										) {
											newValue = { ...parameter.value };
										} else {
											functionInput.struct_members.forEach((m: any, mIdx: number) => {
												const existingField =
													typeof parameter.value === 'object' && parameter.value?.[mIdx.toString()];
												newValue[mIdx.toString()] = existingField || {
													name: m.name,
													type_name: m.type,
													value: getDefaultValue(m.type, m)
												};
											});
										}
										newValue[idx.toString()] = {
											name: member.name,
											type_name: member.type,
											value: e.target.value
										};

										onValueChange(newValue);

										const valid = validateType(e.target.value, member.type);
										setChildrenValidation((prev) => {
											const next = new Map(prev);
											next.set(`compound-${idx}`, valid);
											return next;
										});
									}}
									className={`font-mono text-sm ${
										!fieldValid ? 'border-red-500 focus-visible:ring-red-500' : ''
									}`}
									placeholder={`Enter ${member.type}...`}
								/>
								<span
									className={`text-xs ${!fieldValid ? 'text-red-500' : 'text-muted-foreground'}`}
								>
									{!fieldValid && 'Invalid format'}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	const hasServerDecodedVariant = parameter.type_name.includes('::');

	if (functionInput?.enum_variants && functionInput.enum_variants.length > 0) {
		if (hasServerDecodedVariant && Array.isArray(parameter.value)) {
			const variantName = parameter.type_name.split('::')[1];
			const variant = functionInput.enum_variants.find((v: any) => v.name === variantName);
			const variantType = variant?.type || '';
			const tupleTypes = parseTupleType(variantType);

			if (tupleTypes && tupleTypes.length > 0) {
				return (
					<div className="space-y-3 border col-span-3 rounded-lg p-4 ">
						<div className="flex items-center justify-between">
							<Label className="font-medium">{parameter.name}</Label>
							<span className="text-xs text-muted-foreground">{parameter.type_name}</span>
						</div>

						<div className="space-y-3 pl-4 ">
							{parameter.value.map((item: any, idx: number) => {
								const elementType = tupleTypes[idx] || 'felt252';
								const itemValid = validateType(item || '', elementType);

								return (
									<div key={idx} className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-sm">[{idx}]</Label>
											<div className="text-xs text-muted-foreground">{elementType}</div>
										</div>

										<Input
											value={item || ''}
											onChange={(e) => {
												const newArray = [...parameter.value];
												newArray[idx] = e.target.value;
												onValueChange(newArray);

												const valid = validateType(e.target.value, elementType);
												setChildrenValidation((prev) => {
													const next = new Map(prev);
													next.set(`tuple-${idx}`, valid);
													return next;
												});
											}}
											className={`font-mono text-sm ${
												!itemValid ? 'border-red-500 focus-visible:ring-red-500' : ''
											}`}
											placeholder={`Enter ${elementType}...`}
										/>
										<span
											className={`text-xs ${!itemValid ? 'text-red-500' : 'text-muted-foreground'}`}
										>
											{!itemValid && 'Invalid format'}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				);
			}
		}

		const currentVariant = functionInput.enum_variants.find((v: any) => v.name === enumVariant);
		const hasStructMembers =
			currentVariant?.struct_members && currentVariant.struct_members.length > 0;
		const hasType = currentVariant?.type && currentVariant.type !== '';
		const needsValueInput = hasType && !hasStructMembers;

		let actualValue = parameter.value;
		if (needsValueInput) {
			if (
				typeof parameter.value === 'object' &&
				parameter.value !== null &&
				'__enum_value' in parameter.value
			) {
				actualValue = parameter.value.__enum_value;
			} else if (typeof parameter.value === 'string') {
				const isJustVariantName = functionInput.enum_variants.some(
					(v: any) => v.name === parameter.value
				);
				if (isJustVariantName) {
					actualValue = '0';
					setTimeout(() => {
						onValueChange({
							__enum_variant: enumVariant,
							__enum_value: '0'
						});
					}, 0);
				}
			}
		}

		return (
			<div className="space-y-3 col-span-3 border rounded-lg p-4">
				<div className="flex items-center justify-between">
					<Label className="font-medium">{parameter.name}</Label>
					<span className="text-xs text-muted-foreground">{functionInput.type}</span>
				</div>

				<div className="space-y-2">
					<Label className="text-xs">Variant</Label>
					<Select
						value={enumVariant}
						onValueChange={(newVariant) => {
							setEnumVariant(newVariant);
							const variant = functionInput.enum_variants.find((v: any) => v.name === newVariant);

							if (variant.struct_members && variant.struct_members.length > 0) {
								let newValue: any = {
									__enum_variant: variant.name
								};
								variant.struct_members.forEach((member: any, idx: number) => {
									newValue[idx.toString()] = {
										name: member.name,
										type_name: member.type,
										value: getDefaultValue(member.type)
									};
								});
								onValueChange(newValue);
								return;
							}

							if (variant.type && variant.type !== '') {
								const defaultVal = getDefaultValue(variant.type);
								onValueChange({
									__enum_variant: variant.name,
									__enum_value: defaultVal
								});
								return;
							}
							onValueChange({
								__enum_variant: variant.name
							});
						}}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{functionInput.enum_variants.map((variant: any) => (
								<SelectItem key={variant.name} value={variant.name}>
									{variant.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{needsValueInput && (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-sm">Value</Label>
							<span className="text-xs text-muted-foreground">{currentVariant.type}</span>
						</div>
						<Input
							value={actualValue || ''}
							onChange={(e) => {
								onValueChange({
									__enum_variant: enumVariant,
									__enum_value: e.target.value
								});
							}}
							className={`font-mono text-sm ${
								!validateType(actualValue || '', currentVariant.type)
									? 'border-red-500 focus-visible:ring-red-500'
									: ''
							}`}
							placeholder={`Enter ${currentVariant.type}...`}
						/>
						<span
							className={`text-xs ${
								!validateType(actualValue || '', currentVariant.type)
									? 'text-red-500'
									: 'text-muted-foreground'
							}`}
						>
							{!validateType(actualValue || '', currentVariant.type) && 'Invalid format'}
						</span>
					</div>
				)}

				{hasStructMembers && (
					<div className="space-y-3 pl-4 ">
						{currentVariant.struct_members.map((member: any, idx: number) => {
							const fieldValue = parameter.value?.[idx.toString()];

							return (
								<ParameterInput
									key={idx}
									parameter={{
										name: member.name,
										type_name: member.type,
										value: fieldValue?.value ?? getDefaultValue(member.type)
									}}
									functionInput={member}
									onValueChange={(newFieldValue) => {
										let newValue: any = {
											__enum_variant: enumVariant
										};

										if (
											typeof parameter.value === 'object' &&
											parameter.value !== null &&
											!Array.isArray(parameter.value)
										) {
											newValue = { ...parameter.value, __enum_variant: enumVariant };
										} else {
											currentVariant.struct_members.forEach((m: any, mIdx: number) => {
												const existingField =
													typeof parameter.value === 'object' && parameter.value?.[mIdx.toString()];
												newValue[mIdx.toString()] = existingField || {
													name: m.name,
													type_name: m.type,
													value: getDefaultValue(m.type, m)
												};
											});
										}

										newValue[idx.toString()] = {
											name: member.name,
											type_name: member.type,
											value: newFieldValue
										};

										onValueChange(newValue);
									}}
									onValidationChange={(valid) => {
										setChildrenValidation((prev) => {
											const next = new Map(prev);
											next.set(`enum-variant-${idx}`, valid);
											return next;
										});
									}}
								/>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	const _hasNestedStructure = hasNestedStructure(parameter.value);

	if (_hasNestedStructure) {
		const structMembers = extractStructMembers(parameter.value);

		return (
			<div className="space-y-3 col-span-3 border rounded-lg p-4">
				<div className="flex items-center justify-between">
					<Label className="font-medium">{parameter.name}</Label>
					<span className="text-xs text-muted-foreground">{parameter.type_name}</span>
				</div>

				<Label className="text-sm text-muted-foreground">Struct members</Label>
				<div className="space-y-3 pl-4 ">
					{structMembers.map((member: any, idx: number) => {
						return (
							<ParameterInput
								key={idx}
								parameter={{
									name: member.name,
									type_name: member.type_name,
									value: member.value
								}}
								functionInput={undefined}
								onValueChange={(newFieldValue) => {
									let newValue: any = {};

									if (
										typeof parameter.value === 'object' &&
										parameter.value !== null &&
										!Array.isArray(parameter.value)
									) {
										newValue = { ...parameter.value };
									} else {
										structMembers.forEach((m: any, mIdx: number) => {
											newValue[mIdx.toString()] = {
												name: m.name,
												type_name: m.type_name,
												value: m.value
											};
										});
									}

									newValue[idx.toString()] = {
										name: member.name,
										type_name: member.type_name,
										value: newFieldValue
									};

									onValueChange(newValue);
								}}
								onValidationChange={(valid) => {
									setChildrenValidation((prev) => {
										const next = new Map(prev);
										next.set(`struct-${idx}`, valid);
										return next;
									});
								}}
							/>
						);
					})}
				</div>
			</div>
		);
	}

	if (functionInput?.struct_members && functionInput.struct_members.length > 0) {
		return (
			<div className="space-y-3 col-span-3 border rounded-lg p-4">
				<div className="flex items-center justify-between">
					<Label className="font-medium">{parameter.name}</Label>
					<span className="text-xs text-muted-foreground">{parameter.type_name}</span>
				</div>

				<Label className="text-sm text-muted-foreground">Struct members</Label>
				<div className="space-y-3 pl-4 ">
					{functionInput.struct_members.map((member: any, idx: number) => {
						const fieldValue = parameter.value?.[idx.toString()];

						return (
							<ParameterInput
								key={idx}
								parameter={{
									name: member.name,
									type_name: member.type,
									value: fieldValue?.value ?? getDefaultValue(member.type)
								}}
								functionInput={member}
								onValueChange={(newFieldValue) => {
									let newValue: any = {};

									if (
										typeof parameter.value === 'object' &&
										parameter.value !== null &&
										!Array.isArray(parameter.value)
									) {
										newValue = { ...parameter.value };
									} else {
										functionInput.struct_members.forEach((m: any, mIdx: number) => {
											const existingField =
												typeof parameter.value === 'object' && parameter.value?.[mIdx.toString()];
											newValue[mIdx.toString()] = existingField || {
												name: m.name,
												type_name: m.type,
												value: getDefaultValue(m.type, m)
											};
										});
									}
									newValue[idx.toString()] = {
										name: member.name,
										type_name: member.type,
										value: newFieldValue
									};

									onValueChange(newValue);
								}}
								onValidationChange={(valid) => {
									setChildrenValidation((prev) => {
										const next = new Map(prev);
										next.set(`struct-${idx}`, valid);
										return next;
									});
								}}
							/>
						);
					})}
				</div>
			</div>
		);
	}

	if (parameter.type_name === 'bool') {
		return (
			<div className="space-y-2 col-span-3">
				<div className="flex items-center justify-between">
					<Label className="text-sm">{parameter.name}</Label>
					<span className="text-xs text-muted-foreground">{parameter.type_name}</span>
				</div>

				<Select
					value={parameter.value === true ? 'true' : parameter.value === false ? 'false' : ''}
					onValueChange={(value) => onValueChange(value === 'true')}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select value" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="true">true</SelectItem>
						<SelectItem value="false">false</SelectItem>
					</SelectContent>
				</Select>
			</div>
		);
	}

	return (
		<div className="space-y-2 col-span-3">
			<div className="flex items-center justify-between">
				<Label className="text-sm">{parameter.name}</Label>
				<div className="text-xs text-muted-foreground"> {parameter.type_name}</div>
			</div>
			<Input
				value={parameter.value || ''}
				onChange={(e) => onValueChange(e.target.value)}
				className={`font-mono text-sm ${
					!isValid ? 'border-red-500 focus-visible:ring-red-500' : ''
				}`}
				placeholder={`Enter ${parameter.type_name}...`}
			/>
			<span className={`text-xs ${!isValid ? 'text-red-500' : 'text-muted-foreground'}`}>
				{!isValid && 'Invalid format'}
			</span>
		</div>
	);
};
