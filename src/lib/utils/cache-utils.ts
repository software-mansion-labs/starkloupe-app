export const CACHE_TTL_MS = 15 * 60 * 1000; //cache time

export function safeStringify(value: any): string {
	return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v));
}

export function safeParse<T = any>(value: string): T {
	return JSON.parse(value, (_, v) => {
		if (typeof v === 'string' && /^\d+n$/.test(v)) {
			return BigInt(v.slice(0, -1));
		}
		return v;
	});
}

function cleanupCategory(keyPrefix: string | null, maxItems: number) {
	const now = Date.now();
	const txRegex = /^[^:]+:0x[0-9a-fA-F]+$/;

	if (keyPrefix === null) {
		cleanupCategory('simulation:', maxItems);
		cleanupCategory('tx', maxItems);
		return;
	}

	const isSimulation = keyPrefix === 'simulation:';
	const isDebugger = keyPrefix === 'debugger:';
	const isTx = keyPrefix === 'tx';

	const keys: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const k = localStorage.key(i);
		if (!k) continue;
		if (
			(isSimulation && k.startsWith('simulation:')) ||
			(isDebugger && k.startsWith('debugger:')) ||
			(isTx && txRegex.test(k))
		) {
			keys.push(k);
		}
	}

	if (keys.length <= maxItems) return;

	const items: { key: string; timestamp: number }[] = [];
	for (const k of keys) {
		const raw = localStorage.getItem(k);
		if (!raw) {
			localStorage.removeItem(k);
			continue;
		}
		try {
			const rec = safeParse<{ timestamp: number }>(raw);
			if (!rec.timestamp || now - rec.timestamp > CACHE_TTL_MS) {
				localStorage.removeItem(k);
			} else {
				items.push({ key: k, timestamp: rec.timestamp });
			}
		} catch {
			localStorage.removeItem(k);
		}
	}
	if (items.length > maxItems) {
		items
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(maxItems)
			.forEach((item) => localStorage.removeItem(item.key));
	}
}

export function setCacheWithTTL(key: string, value: any) {
	cleanupCategory(key, 1);

	const record = {
		timestamp: Date.now(),
		data: value
	};
	localStorage.setItem(key, safeStringify(record));
}

export function getCacheWithTTL<T = any>(key: string): T | null {
	cleanupCategory(null, 2);

	const raw = localStorage.getItem(key);
	if (!raw) return null;

	let record: { timestamp: number; data: any };
	try {
		record = safeParse(raw);
	} catch {
		localStorage.removeItem(key);
		return null;
	}

	if (!record.timestamp || !record.data) {
		localStorage.removeItem(key);
		return null;
	}
	if (Date.now() - record.timestamp > CACHE_TTL_MS) {
		localStorage.removeItem(key);
		return null;
	}

	return record.data as T;
}
