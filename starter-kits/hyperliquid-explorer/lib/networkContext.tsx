"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Network = "mainnet" | "testnet";

interface NetworkContextType {
  network: Network;
  setNetwork: (network: Network) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<Network>("mainnet");

  // Load network from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem("hyperliquid-network") as Network;
    if (savedNetwork === "mainnet" || savedNetwork === "testnet") {
      setNetworkState(savedNetwork);
    }
  }, []);

  const setNetwork = (newNetwork: Network) => {
    setNetworkState(newNetwork);
    localStorage.setItem("hyperliquid-network", newNetwork);
  };

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

