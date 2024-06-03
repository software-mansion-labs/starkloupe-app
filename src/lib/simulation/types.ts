export type CallResult =
	| {
			Success: {
				retData: {
					value: {
						val: number[];
					};
				}[];
			};
	  }
	| {
			Failure: {
				Panic: {
					panicData: {
						value: {
							val: number[];
						};
					}[];
				};
			};
	  };

export enum EntryPointType {
	EXTERNAL = 'EXTERNAL',
	INTERNAL = 'INTERNAL'
}

export enum CallType {
	CALL = 'Call'
}

export enum DataType {
	INPUT = 'INPUT',
	OUTPUT = 'OUTPUT'
}

export interface EntryPoint {
	classHash: string;
	codeAddress: string;
	entryPointType: EntryPointType;
	entryPointSelector: string;
	calldata: string[];
	storageAddress: string;
	callerAddress: string;
	callType: CallType;
	initialGas: number;
}

export interface DecodedItem {
	type: string;
	name: string;
	value: string | DecodedItem[] | string[];
}

export type CalldataDecoded = DecodedItem[];

export interface CallTrace {
	entryPoint: EntryPoint;
	result: CallResult;
	internalFnCallTrace: InternalFnCallTrace;
	nestedCalls: CallTrace[];
	additionalInfo: {
		entryPointFunctionName: string | null;
		entryPointInterfaceName: string | null;
		isErc20Token: boolean;
		erc20TokenName: string | null;
		erc20TokenSymbol: string | null;
		errorMessage: string | null;
		functionResult: CalldataDecoded | null;
		functionReturnResultTypes: string[] | null;
		functionArguments: string[] | null;
		functionArgumentsNames: string[] | null;
		calldataDecoded: CalldataDecoded | null;
	};
}

export interface ExecutionResultSucceeded {
	executionStatus: 'SUCCEEDED';
}

export interface ExecutionResultReverted {
	executionStatus: 'REVERTED';
	revertReason: string;
}

export interface SimulationResult {
	callTrace: CallTrace;
	executionResult: ExecutionResultSucceeded | ExecutionResultReverted;
}

export interface InternalFnCallTrace {
	data: {
		fnName: string | null;
		fp: number;
		isPanicResult?: boolean;
	};
	nestedCalls: InternalFnCallTrace[];
}
