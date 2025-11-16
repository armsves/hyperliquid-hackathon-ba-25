import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { defineChain } from "viem";

// Hyperliquid Testnet
const hyperliquidTestnet = defineChain({
  id: 998,
  name: "Hyperliquid Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid-testnet.xyz/evm"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hyperliquid Explorer",
      url: "https://explorer.hyperliquid-testnet.xyz",
    },
  },
});

// Hyperliquid Mainnet
const hyperliquid = defineChain({
  id: 999,
  name: "Hyperliquid",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hyperliquid Explorer",
      url: "https://explorer.hyperliquid.xyz",
    },
  },
});

export const config = getDefaultConfig({
  appName: "Yield Optimizer Dashboard",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "default",
  chains: [hyperliquidTestnet, hyperliquid],
  transports: {
    [hyperliquidTestnet.id]: http(),
    [hyperliquid.id]: http(),
  },
});

