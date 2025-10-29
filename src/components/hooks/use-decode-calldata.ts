import { useState } from 'react';
import { StarknetTransactionData } from '@/lib/contracts';

export function useDecodeCalldata() {
	const [decodeCalldata, setDecodeCalldata] = useState<StarknetTransactionData>();

	return { decodeCalldata, setDecodeCalldata };
}
