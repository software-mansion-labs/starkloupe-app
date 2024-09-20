export interface VerificationStatusResponse {
	verificationStatuses: VerificationStatusRow[];
	errorMessage?: string;
}

export interface VerificationStatusRow {
	primaryId: number;
	id: string;
	network?: string;
	classHash?: string;
	status: VerificationStatus;
	message?: string;
	projectId?: number;
	createdAt: string;
	updatedAt: string;
}

export enum VerificationStatus {
	pending = 'Pending',
	success = 'Success',
	failed = 'Failed'
}
