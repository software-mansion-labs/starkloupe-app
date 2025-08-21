export const CACHE_TTL_MS = 15 * 60 * 1000; //cache time

export const CUSTOM_SETTINGS_KEY = 'contract_custom_settings';

const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024;

export const compressData = (data: any): string => {
	try {
		const jsonString = JSON.stringify(data);
		return btoa(encodeURIComponent(jsonString));
	} catch (error) {
		console.error('Error:', error);
		return '';
	}
};

const resetStorage = (key: string) => {
	localStorage.removeItem(key);
};

export const decompressData = (compressedData: string): any => {
	try {
		if (!compressedData) return {};
		const jsonString = decodeURIComponent(atob(compressedData));
		return JSON.parse(jsonString);
	} catch (error) {
		console.error('Error:', error);
		return {};
	}
};

const getCustomSettingsSize = (data: {
	[key: string]: { name: string | null; color: string | null };
}): number => {
	const compressedData = compressData(data);
	return compressedData.length + CUSTOM_SETTINGS_KEY.length;
};

const cleanupCustomSettings = (currentData: {
	[key: string]: { name: string | null; color: string | null };
}): { [key: string]: { name: string | null; color: string | null } } => {
	const entries = Object.entries(currentData);

	if (entries.length <= 10) {
		return currentData;
	}

	const keepCount = Math.floor(entries.length * 0.7);
	const keptEntries = entries.slice(-keepCount);

	console.warn(`Custom settings cleanup: removed ${entries.length - keepCount} old entries`);

	return Object.fromEntries(keptEntries);
};

export const loadCustomSettingsFromStorage = (): {
	[key: string]: { name: string | null; color: string | null };
} => {
	try {
		const compressedData = localStorage.getItem(CUSTOM_SETTINGS_KEY);
		if (compressedData) {
			const settings = decompressData(compressedData);
			if (Object.keys(settings).length === 0) {
				resetStorage(CUSTOM_SETTINGS_KEY);
				return {};
			}

			return settings;
		}
	} catch (error) {
		console.error('Error loading custom settings:', error);
		resetStorage(CUSTOM_SETTINGS_KEY);
	}
	return {};
};

export const saveCustomSettingsToStorage = (settings: {
	[key: string]: { name: string | null; color: string | null };
}) => {
	try {
		if (Object.keys(settings).length === 0) {
			resetStorage(CUSTOM_SETTINGS_KEY);
			return;
		}

		const dataSize = getCustomSettingsSize(settings);

		if (dataSize > MAX_STORAGE_SIZE) {
			console.warn('Custom settings data too large, cleaning up...');

			const cleanedSettings = cleanupCustomSettings(settings);

			if (Object.keys(cleanedSettings).length === 0) {
				resetStorage(CUSTOM_SETTINGS_KEY);
				return;
			}

			const cleanedSize = getCustomSettingsSize(cleanedSettings);

			if (cleanedSize > MAX_STORAGE_SIZE) {
				const entries = Object.entries(cleanedSettings);
				const keepCount = Math.min(50, Math.floor(entries.length * 0.5));
				const finalEntries = entries.slice(-keepCount);
				const finalSettings = Object.fromEntries(finalEntries);

				if (Object.keys(finalSettings).length === 0) {
					resetStorage(CUSTOM_SETTINGS_KEY);
					return;
				}

				console.warn(`Critical cleanup: kept only ${keepCount} entries`);
				localStorage.setItem(CUSTOM_SETTINGS_KEY, compressData(finalSettings));
			} else {
				localStorage.setItem(CUSTOM_SETTINGS_KEY, compressData(cleanedSettings));
			}
		} else {
			localStorage.setItem(CUSTOM_SETTINGS_KEY, compressData(settings));
		}
	} catch (error) {
		if ((error as Error).name === 'QuotaExceededError') {
			console.error('localStorage quota exceeded, emergency cleanup...');

			const entries = Object.entries(settings);
			const emergencySettings = Object.fromEntries(entries.slice(-20));

			if (Object.keys(emergencySettings).length === 0) {
				resetStorage(CUSTOM_SETTINGS_KEY);
				return;
			}

			try {
				localStorage.setItem(CUSTOM_SETTINGS_KEY, compressData(emergencySettings));
				console.warn('Emergency cleanup completed, kept 20 entries');
			} catch (finalError) {
				console.error('Failed to save after emergency cleanup:', finalError);
				resetStorage(CUSTOM_SETTINGS_KEY);
			}
		} else {
			console.error('Error saving custom settings:', error);
		}
	}
};

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
			resetStorage(k);
			continue;
		}
		try {
			const rec = safeParse<{ timestamp: number }>(raw);
			if (!rec.timestamp || now - rec.timestamp > CACHE_TTL_MS) {
				resetStorage(k);
			} else {
				items.push({ key: k, timestamp: rec.timestamp });
			}
		} catch {
			resetStorage(k);
		}
	}
	if (items.length > maxItems) {
		items
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(maxItems)
			.forEach((item) => resetStorage(item.key));
	}
}

export function setCacheWithTTL(key: string, value: any) {
	cleanupCategory(key, 1);

	const record = {
		timestamp: Date.now(),
		data: value
	};
	const serialized = safeStringify(record);

	// Check size limit before attempting to cache
	// Using 100KB as strict limit for localStorage cache
	const MAX_CACHE_SIZE_BYTES = 100 * 1024; // 100KB
	const sizeInBytes = new Blob([serialized]).size;

	if (sizeInBytes > MAX_CACHE_SIZE_BYTES) {
		const sizeKB = sizeInBytes / 1024;
		const limitKB = MAX_CACHE_SIZE_BYTES / 1024;
		console.warn(
			`Response too large to cache (${sizeKB.toFixed(
				1
			)}KB > ${limitKB}KB) for key: ${key}. Skipping cache.`
		);
		return;
	}

	try {
		localStorage.setItem(key, serialized);
	} catch (e) {
		if (e instanceof DOMException && e.name === 'QuotaExceededError') {
			console.warn('localStorage quota exceeded for key:', key);
			// Try to clear expired items and retry
			cleanupCategory(null, 1);
			try {
				localStorage.setItem(key, serialized);
			} catch (e2) {
				console.error('Failed to cache after cleanup:', e2);
			}
		} else {
			console.error('localStorage write failed:', e);
		}
	}
}

export function getCacheWithTTL<T = any>(key: string): T | null {
	cleanupCategory(null, 2);

	const raw = localStorage.getItem(key);
	if (!raw) return null;

	let record: { timestamp: number; data: any };
	try {
		record = safeParse(raw);
	} catch {
		resetStorage(key);
		return null;
	}

	if (!record.timestamp || !record.data) {
		resetStorage(key);
		return null;
	}
	if (Date.now() - record.timestamp > CACHE_TTL_MS) {
		resetStorage(key);
		return null;
	}

	return record.data as T;
}
