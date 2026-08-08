'use client';

import React, {
	createContext,
	MutableRefObject,
	RefObject,
	useContext,
	useEffect,
	useRef,
	useState
} from 'react';
import { toast } from '@/components/hooks/use-toast';
import { isTrackingActive } from '@/app/api/tracking-service';
import { loadCustomSettingsFromStorage, saveCustomSettingsToStorage } from '../utils/cache-utils';
import { logger } from '../utils/logger';
import { chainMapping, normalizeUrl, stackMapping, unknownPrefixesAsStarknet } from '../utils';

export interface Network {
	rpcUrl: string;
	networkName: string;
	id?: string;
}

const CUSTOM_NETWORKS_KEY = 'custom_networks';

const loadNetworksFromStorage = (): Network[] => {
	try {
		const stored = localStorage.getItem(CUSTOM_NETWORKS_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
};

const saveNetworksToStorage = (networks: Network[]) => {
	try {
		localStorage.setItem(CUSTOM_NETWORKS_KEY, JSON.stringify(networks));
	} catch (error) {
		logger.error('Error saving custom networks:', error);
		throw error;
	}
};

const generateNetworkId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `network-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
};

export interface AddNetwork {
	rpcUrl: string;
	networkName: string;
}

type SettingsContextType = {
	networks: Network[];
	addNetwork: (network: AddNetwork) => void;
	removeNetwork: (network: Network) => void;
	getNetworkByRpcUrl: (rpcUrl: string) => Network | undefined;
	trackingActive: boolean;
	// informs if tracking flag was correctly set
	trackingFlagLoaded: boolean;
	customSettings: { [key: string]: { name: string | null; color: string | null } };
	updateContractColor: (contractAddress: string, color: string) => void;
	updateContractName: (contractAddress: string, newContractCallName: string) => void;
	updateContractSettings: (
		contractAddress: string,
		settings: { name?: string | null; color?: string | null } | null
	) => void;
	parseChain: (
		chainString: string
	) => { stack?: string; chain?: string; customNetworkName?: string } | null;
	scrollToEntrypointElement: (key: string) => void;
	contractEntrypointsElementRefs: MutableRefObject<{
		[key: string]: RefObject<HTMLDivElement>;
	}>;
	searchResultAddress: string;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [networks, setNetworks] = useState<Network[]>([]);
	const [trackingActive, setTrackingActive] = useState<boolean>(true);
	const [trackingFlagLoaded, setTrackingFlagLoaded] = useState<boolean>(false);
	const contractEntrypointsElementRefs = useRef<{
		[entrypintAddress: string]: React.RefObject<HTMLDivElement>;
	}>({});
	const [customSettings, setCustomSettings] = useState<{
		[key: string]: { name: string | null; color: string | null };
	}>({});
	const [searchResultAddress, setSearchResultAddress] = useState('');

	useEffect(() => {
		const savedSettings = loadCustomSettingsFromStorage();
		setCustomSettings(savedSettings);
	}, []);

	const updateContractColor = (contractAddress: string, color: string) => {
		setCustomSettings((prevSettings) => {
			const newSettings = {
				...prevSettings,
				[contractAddress]: {
					...prevSettings[contractAddress],
					color: color
				}
			};

			saveCustomSettingsToStorage(newSettings);

			return newSettings;
		});
	};

	const updateContractName = (contractAddress: string, newContractCallName: string) => {
		setCustomSettings((prevSettings) => {
			const newSettings = {
				...prevSettings,
				[contractAddress]: {
					...prevSettings[contractAddress],
					name: newContractCallName
				}
			};

			saveCustomSettingsToStorage(newSettings);

			return newSettings;
		});
	};
	const parseChain = (chainString: string) => {
		const parts = chainString.toLowerCase().split('_');
		let stack: string | undefined;
		let chain: string | undefined;
		let isCustomNetwork = false;

		if (parts.length === 1) {
			const prefix = parts[0];
			stack = stackMapping[prefix];
			chain = chainMapping[prefix];
		} else if (parts.length === 2) {
			const [prefix, chainPart] = parts;

			if (stackMapping[prefix]) {
				stack = stackMapping[prefix];
			} else if (
				unknownPrefixesAsStarknet(prefix) &&
				(chainPart === 'sepolia' || chainPart === 'main' || chainPart === 'mainnet')
			) {
				stack = 'Starknet';
				isCustomNetwork = true;
			}

			chain = chainMapping[chainPart];
		}

		const chainPart = parts.length > 1 ? parts[1] : parts[0];
		const isChainFoundInMapping = chainMapping[chainPart] !== undefined;

		if (!isChainFoundInMapping) {
			const customName = chainString.charAt(0).toUpperCase() + chainString.slice(1);
			return { customNetworkName: customName };
		}

		const result: Record<string, string> = {};

		if (stack) {
			result.stack = stack;
		} else {
			result.stack = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
		}

		if (chain) {
			result.chain = chain;
		} else {
			result.chain = chainPart.charAt(0).toUpperCase() + chainPart.slice(1);
		}

		if (isCustomNetwork && parts.length === 2) {
			const [prefix, chainPart] = parts;
			const formattedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
			const formattedChain =
				chainMapping[chainPart] || chainPart.charAt(0).toUpperCase() + chainPart.slice(1);
			result.customNetworkName = `${formattedPrefix} ${formattedChain}`;
		}
		return Object.keys(result).length > 0 ? result : null;
	};
	const scrollToEntrypointElement = (entrypintAddress: string) => {
		const element = contractEntrypointsElementRefs.current[entrypintAddress]?.current;
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
		setSearchResultAddress(entrypintAddress);
	};

	const updateContractSettings = (
		contractAddress: string,
		settings: { name?: string | null; color?: string | null } | null
	) => {
		setCustomSettings((prevSettings) => {
			if (settings === null) {
				const { [contractAddress]: removed, ...newSettings } = prevSettings;
				saveCustomSettingsToStorage(newSettings);
				return newSettings;
			}

			const newSettings = {
				...prevSettings,
				[contractAddress]: {
					name:
						settings.name !== undefined
							? settings.name
							: prevSettings[contractAddress]?.name || null,
					color:
						settings.color !== undefined
							? settings.color
							: prevSettings[contractAddress]?.color || null
				}
			};

			saveCustomSettingsToStorage(newSettings);

			return newSettings;
		});
	};

	useEffect(() => {
		setTrackingActive(isTrackingActive());
		setTrackingFlagLoaded(true);
	}, []);

	useEffect(() => {
		setNetworks(loadNetworksFromStorage());
	}, []);

	const addNetwork = (network: AddNetwork) => {
		const created: Network = { ...network, id: generateNetworkId() };
		setNetworks((prev) => {
			const updated = [...prev, created];
			try {
				saveNetworksToStorage(updated);
			} catch {
				toast({
					title: 'Failed to add network',
					description:
						'Could not save the network. Your browser storage may be full or unavailable.',
					className: 'text-red-500'
				});
				return prev;
			}
			toast({
				title: `Network ${network.networkName} added!`,
				description: 'Network added successfully.'
			});
			return updated;
		});
	};

	const removeNetwork = (network: Network) => {
		setNetworks((prev) => {
			const updated = prev.filter((n) => n.id !== network.id);
			try {
				saveNetworksToStorage(updated);
			} catch {
				toast({
					title: 'Failed to remove network',
					description: 'Could not update local storage. Please try again.',
					className: 'text-red-500'
				});
				return prev;
			}
			toast({
				title: `Network ${network.networkName} removed!`,
				description: 'Network removed successfully.'
			});
			return updated;
		});
	};

	const getNetworkByRpcUrl = (rpcUrl: string): Network | undefined => {
		return networks.find((network) => normalizeUrl(network.rpcUrl) === normalizeUrl(rpcUrl));
	};

	return (
		<SettingsContext.Provider
			value={{
				networks,
				addNetwork,
				removeNetwork,
				getNetworkByRpcUrl,
				trackingActive,
				trackingFlagLoaded,
				customSettings,
				updateContractColor,
				updateContractName,
				updateContractSettings,
				parseChain,
				contractEntrypointsElementRefs,
				scrollToEntrypointElement,
				searchResultAddress
			}}
		>
			{children}
		</SettingsContext.Provider>
	);
};

export const useSettings = () => {
	const context = useContext(SettingsContext);
	if (!context) {
		throw new Error('useSettings must be used within a SettingsProvider');
	}
	return context;
};
