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
	CALL = 'Call',
	DELEGATE = 'Delegate',
	DCALL = 'DCall'
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

export interface DebuggerExecutionTraceEntryWithContractCall {
	contractCall: { contractAddress: string; functionSelector: string };
	contractCallId: string;
}

export interface DebuggerExecutionTraceEntryWithLocation {
	sierraIndex: number;
	results: InternalFnCallIO[];
	arguments: InternalFnCallIO[];
	locationIndex: number;
}

export type DebuggerExecutionTraceEntry =
	| { withContractCall: DebuggerExecutionTraceEntryWithContractCall; withLocation?: undefined }
	| { withLocation: DebuggerExecutionTraceEntryWithLocation; withContractCall?: undefined };

export interface CallDebuggerData {
	executionTrace: DebuggerExecutionTraceEntry[];
}

export interface CallTrace {
	contractCallId: string;
	entryPoint: EntryPoint;
	result: CallResult;
	fnCalls: InternalFnCallTrace[];
	nestedCalls: CallTrace[];
	additionalInfo: {
		contractName: string | null;
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
		cairoLocation?: CodeLocation; // Added on client side
		callDebuggerData?: CallDebuggerData;
		classHash: string; // 66 symbols format
		cairoVersion: string;
	};
	nestedCallsIds: string[]; // Added on client side, list of function call id and contract call id
}

export interface EventTrace {
	contractName: string | null;
	eventName: string;
	eventArgumentsNames: string[];
	eventKeys: string[];
	eventDatas: string[];
}

export interface ExecutionResultSucceeded {
	executionStatus: 'SUCCEEDED';
}

export interface ExecutionResultReverted {
	executionStatus: 'REVERTED';
	revertReason: string;
}

export interface ClassDebuggerData {
	sierraStatementsToCairoInfo: {
		[key: number]: {
			cairoLocations: CodeLocation[];
		};
	};
	sourceCode: {
		[key: string]: string;
	};
}

export interface SimulationDebuggerData {
	classesDebuggerData: {
		[key: string]: ClassDebuggerData;
	};
}

export type CallsMap = Map<
	string,
	| { contractCall: CallTrace; fnCall?: undefined }
	| { fnCall: InternalFnCallTrace; contractCall?: undefined }
>;

export interface SimulationResult {
	callTrace: CallTrace;
	eventsTrace: EventTrace[];
	executionResult: ExecutionResultSucceeded | ExecutionResultReverted;
	simulationDebuggerData: SimulationDebuggerData;
}

export interface TextPosition {
	line: number;
	col: number;
}

export interface CodeLocation {
	start: TextPosition;
	end: TextPosition;
	filePath: string;
}

export interface InternalFnCallIO {
	typeName: string | null;
	value: string[];
}

export interface InternalFnCallTrace {
	data: {
		id: string; // Function call id
		fnName: string | null;
		fp: number;
		cairoLocation: CodeLocation | null;
		arguments: InternalFnCallIO[];
		results: InternalFnCallIO[];
		isPanicResult: boolean;
		debuggerExecutionTraceStepIndex: number;
		nestedCallsIds: string[]; // List of function call id and contract call id
	};
	nestedCalls: InternalFnCallTrace[];
	isHidden?: boolean; // Added on client side to hide duplicated function calls
}

export interface TransactionSimulationResult {
	simulationResult: SimulationResult;
	blockNumber: number;
	blockTimestamp: number;
	nonce: number;
	senderAddress: string;
	calldata: string[];
	transactionVersion: number;
	transactionType: string;
	chainId?: string;
}

export interface SimulationPayloadWithCalldata {
	senderAddress: string;
	calldata: string[];
	blockNumber?: number;
	transactionVersion: number;
	nonce?: number;
	// Either chainId or rpcUrl should be provided
	chainId?: string;
	rpcUrl?: string;
}
