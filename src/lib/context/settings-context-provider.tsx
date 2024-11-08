'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Network {
	rpcUrl: string;
	networkName: string;
}

type SettingsContextType = {
	networks: Network[];
	addNetwork: (network: Network) => void;
	removeNetwork: (network: Network) => void;
	getNetworkByRpcUrl: (rpcUrl: string) => Network | undefined;
	isSettingsLoaded: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const NETWORKS_STORAGE_KEY = 'networks';

export const SettingsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
	const [networks, setNetworks] = useState<Network[]>([]);

	useEffect(() => {
		if (isSettingsLoaded) return;
		const storedNetworks = localStorage.getItem(NETWORKS_STORAGE_KEY);
		if (storedNetworks) {
			setNetworks(JSON.parse(storedNetworks));
		}
		setIsSettingsLoaded(true);
	}, [isSettingsLoaded]);

	const addNetwork = (network: Network) => {
		const updatedNetworks = [...networks, network];
		setNetworks(updatedNetworks);
		localStorage.setItem(NETWORKS_STORAGE_KEY, JSON.stringify(updatedNetworks));
	};

	const removeNetwork = (network: Network) => {
		const updatedNetworks = networks.filter((n) => n.rpcUrl !== network.rpcUrl);
		setNetworks(updatedNetworks);
		localStorage.setItem(NETWORKS_STORAGE_KEY, JSON.stringify(updatedNetworks));
	};

	const getNetworkByRpcUrl = (rpcUrl: string): Network | undefined => {
		return networks.find((network) => network.rpcUrl === rpcUrl);
	};

	return (
		<SettingsContext.Provider
			value={{ networks, addNetwork, removeNetwork, getNetworkByRpcUrl, isSettingsLoaded }}
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
