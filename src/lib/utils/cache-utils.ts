import { logger } from './logger';

export const CACHE_TTL_MS = 15 * 60 * 1000; //cache time

export const CUSTOM_SETTINGS_KEY = 'contract_custom_settings';

const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024;

export const compressData = (data: any): string => {
	try {
		const jsonString = JSON.stringify(data);
		return btoa(encodeURIComponent(jsonString));
	} catch (error) {
		logger.error('Compression error:', error);
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
		logger.error('Decompression error:', error);
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

	logger.warn(`Custom settings cleanup: removed ${entries.length - keepCount} old entries`);

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
		logger.error('Error loading custom settings:', error);
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
			logger.warn('Custom settings data too large, cleaning up...');

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

				logger.warn(`Critical cleanup: kept only ${keepCount} entries`);
				localStorage.setItem(CUSTOM_SETTINGS_KEY, compressData(finalSettings));
			} else {
				localStorage.setItem(CUSTOM_SETTINGS_KEY, compressData(cleanedSettings));
			}
		} else {
			localStorage.setItem(CUSTOM_SETTINGS_KEY, compressData(settings));
		}
	} catch (error) {
		if ((error as Error).name === 'QuotaExceededError') {
			logger.error('localStorage quota exceeded, emergency cleanup...');

			const entries = Object.entries(settings);
			const emergencySettings = Object.fromEntries(entries.slice(-20));

			if (Object.keys(emergencySettings).length === 0) {
				resetStorage(CUSTOM_SETTINGS_KEY);
				return;
			}

			try {
				localStorage.setItem(CUSTOM_SETTINGS_KEY, compressData(emergencySettings));
				logger.warn('Emergency cleanup completed, kept 20 entries');
			} catch (finalError) {
				logger.error('Failed to save after emergency cleanup:', finalError);
				resetStorage(CUSTOM_SETTINGS_KEY);
			}
		} else {
			logger.error('Error saving custom settings:', error);
		}
	}
};

export function cleanupCategory() {
	const txRegex = /^[^:]+:0x[0-9a-fA-F]+$/;

	const keysToDelete: string[] = [];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key) continue;

		const isTx = txRegex.test(key);
		const isSimulation = key.startsWith('simulation:');
		const isDebugger = key.startsWith('debugger:');

		if (isTx || isSimulation || isDebugger) {
			keysToDelete.push(key);
		}
	}

	keysToDelete.forEach((key) => {
		localStorage.removeItem(key);
	});
}
