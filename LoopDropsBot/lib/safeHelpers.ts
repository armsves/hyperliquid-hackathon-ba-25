import { ethers } from "ethers";
import { ContractNetworksConfig } from "@safe-global/protocol-kit";

/**
 * Get chain ID from environment or default to Hyperliquid Testnet (998)
 * Testnet = 998, Mainnet = 999
 */
function getChainId(): number {
  return parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "998", 10);
}

/**
 * Get contract networks configuration for Safe SDK
 * This allows specifying custom contract addresses for MultiSend, Safe Factory, etc.
 */
function getContractNetworks(): ContractNetworksConfig | undefined {
  const chainId = getChainId();
  const multiSendAddress = process.env.NEXT_PUBLIC_MULTISEND_ADDRESS;
  const safeProxyFactoryAddress = process.env.NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS;
  const safeSingletonAddress = process.env.NEXT_PUBLIC_SAFE_SINGLETON_ADDRESS;
  const multiSendCallOnlyAddress = process.env.NEXT_PUBLIC_MULTISEND_CALL_ONLY_ADDRESS;

  // If no custom contracts configured, return undefined to use SDK defaults
  if (!multiSendAddress && !safeProxyFactoryAddress && !safeSingletonAddress) {
    return undefined;
  }

  // Helper to validate address format
  const isValidAddress = (addr: string | undefined): boolean => {
    if (!addr) return false;
    // Reject placeholder addresses
    if (addr === "0x..." || addr.includes("...") || addr.length < 42) {
      return false;
    }
    return addr.length === 42 && 
           addr.startsWith("0x") && 
           /^0x[0-9a-fA-F]{40}$/.test(addr) &&
           addr !== "0x0000000000000000000000000000000000000000";
  };

  const contractNetworks: ContractNetworksConfig = {
    [chainId]: {
      // Only include addresses that are valid
      ...(isValidAddress(multiSendAddress) && { 
        multiSendAddress: multiSendAddress as `0x${string}` 
      }),
      ...(isValidAddress(multiSendCallOnlyAddress) && { 
        multiSendCallOnlyAddress: multiSendCallOnlyAddress as `0x${string}` 
      }),
      ...(isValidAddress(safeProxyFactoryAddress) && { 
        safeProxyFactoryAddress: safeProxyFactoryAddress as `0x${string}` 
      }),
      ...(isValidAddress(safeSingletonAddress) && { 
        safeSingletonAddress: safeSingletonAddress as `0x${string}` 
      }),
    },
  };

  // Only return if at least one address is configured
  const hasAnyAddress = Object.values(contractNetworks[chainId]).some(v => v !== undefined);
  return hasAnyAddress ? contractNetworks : undefined;
}

/**
 * Get current block number from RPC
 */
async function getCurrentBlockNumber(rpcUrl: string): Promise<string> {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.result || "0x0";
  } catch (error) {
    console.warn("Failed to get block number:", error);
    return "0x0";
  }
}

/**
 * Create a custom EIP-1193 provider that handles Hyperliquid RPC quirks
 * Hyperliquid RPC doesn't support "latest" block tag, so we convert it to block number
 */
function createHyperliquidProvider(rpcUrl: string): any {
  let cachedBlockNumber: string | null = null;
  let cacheTime = 0;
  const CACHE_DURATION = 5000; // 5 seconds

  return {
    request: async (args: { method: string; params?: readonly unknown[] | object }) => {
      // Note: Signing methods should be handled by the wallet provider, not this RPC provider
      // This provider only handles RPC calls, signing is delegated to the signer's provider
      
      // Handle different parameter formats
      let params: any[] = [];
      if (args.params) {
        if (Array.isArray(args.params)) {
          params = [...args.params];
        } else if (typeof args.params === 'object') {
          // Handle object params (some RPC methods use objects)
          params = [args.params];
        }
      }

      // Methods that commonly use "latest" block tag
      const methodsNeedingBlockNumber = [
        "eth_getCode",
        "eth_getBalance",
        "eth_getTransactionCount",
        "eth_call",
        "eth_getStorageAt",
        "eth_getBlockByNumber",
        "eth_estimateGas",
        "eth_getLogs",
      ];

      if (methodsNeedingBlockNumber.includes(args.method)) {
        // Refresh cache if expired
        const now = Date.now();
        if (!cachedBlockNumber || (now - cacheTime) > CACHE_DURATION) {
          cachedBlockNumber = await getCurrentBlockNumber(rpcUrl);
          cacheTime = now;
        }

        // For eth_getCode, Hyperliquid might not accept block parameter
        // Try removing it if it's "latest" or use block number if it's a specific block
        if (args.method === "eth_getCode") {
          if (params.length === 2) {
            const lastParam = params[1];
            if (typeof lastParam === "string") {
              // If it's "latest" or "pending", remove the block parameter entirely
              // Hyperliquid seems to work better with just the address
              if (lastParam === "latest" || lastParam === "pending") {
                params = [params[0]]; // Keep only the address
              } else if (lastParam === "earliest") {
                params[1] = "0x0"; // Use genesis block
              } else if (lastParam.startsWith("0x")) {
                // It's already a hex block number, keep it
                params[1] = lastParam;
              } else {
                // Unknown format, try to convert or remove
                params = [params[0]];
              }
            } else {
              // Non-string block param, remove it
              params = [params[0]];
            }
          }
        } else {
          // For other methods, replace "latest" or "pending" with actual block number
          params = params.map((param: any, index: number) => {
            if (typeof param === "string") {
              // Check if it's a block tag (usually the last parameter)
              const isLastParam = index === params.length - 1;
              if (isLastParam && (param === "latest" || param === "pending" || param === "earliest")) {
                return cachedBlockNumber || "0x0";
              }
              // Also check if it's a block tag in the middle (for some methods)
              if (param === "latest" || param === "pending" || param === "earliest") {
                return cachedBlockNumber || "0x0";
              }
            }
            // Handle object params that might contain block tags
            if (typeof param === "object" && param !== null && !Array.isArray(param)) {
              const modified: any = { ...param };
              if (modified.blockTag === "latest" || modified.blockTag === "pending") {
                modified.blockTag = cachedBlockNumber || "0x0";
              }
              if (modified.blockNumber === "latest" || modified.blockNumber === "pending") {
                modified.blockNumber = cachedBlockNumber || "0x0";
              }
              // Handle fromBlock/toBlock in eth_getLogs
              if (modified.fromBlock === "latest" || modified.fromBlock === "pending") {
                modified.fromBlock = cachedBlockNumber || "0x0";
              }
              if (modified.toBlock === "latest" || modified.toBlock === "pending") {
                modified.toBlock = cachedBlockNumber || "0x0";
              }
              return modified;
            }
            return param;
          });
        }
      }

      // Clean and validate parameters before sending
      const cleanParams = params.map((param: any, paramIndex: number) => {
        // Remove undefined values
        if (param === undefined || param === null) {
          return null;
        }
        
        // Only validate addresses for methods that specifically use addresses
        // For other methods, hex strings might be chain IDs, block numbers, data, etc.
        const addressMethods = ["eth_getCode", "eth_getBalance", "eth_getTransactionCount", "eth_call"];
        const isAddressMethod = addressMethods.includes(args.method);
        // For eth_call, the first param is usually the address (to field)
        const isLikelyAddress = isAddressMethod && paramIndex === 0;
        
        if (typeof param === "string" && param.startsWith("0x")) {
          // Check for invalid placeholder addresses
          const isPlaceholder = param === "0x" || 
                                param === "0x..." || 
                                param.includes("...");
          
          if (isPlaceholder) {
            // For eth_getCode, return "0x" (no contract code) instead of throwing
            if (args.method === "eth_getCode") {
              console.warn(`Invalid address format for eth_getCode: ${param}. Returning "0x" (no contract).`);
              return "0x";
            }
            // For other address methods, throw an error
            if (isLikelyAddress) {
              throw new Error(`Invalid address format: ${param}. Address must be a valid 20-byte hex string (0x followed by 40 hex characters).`);
            }
            // For non-address params, just return as-is (might be data or other hex value)
            return param;
          }
          
          // Only validate address length for actual address parameters
          if (isLikelyAddress) {
            // Check if it looks like an address (20 bytes = 40 hex chars + 0x)
            if (param.length === 42) {
              // Validate hex characters
              const hexPart = param.slice(2);
              if (!/^[0-9a-fA-F]{40}$/.test(hexPart)) {
                // For eth_getCode, return "0x" instead of throwing
                if (args.method === "eth_getCode") {
                  console.warn(`Invalid hex characters in address for eth_getCode: ${param}. Returning "0x" (no contract).`);
                  return "0x";
                }
                throw new Error(`Invalid address format: ${param}. Address contains non-hexadecimal characters.`);
              }
              // Valid address length
              return param.toLowerCase();
            } else if (param.length > 2 && param.length < 42) {
              // Address is too short - for eth_getCode, return "0x", otherwise throw
              if (args.method === "eth_getCode") {
                console.warn(`Short address for eth_getCode: ${param}. Returning "0x" (no contract).`);
                return "0x";
              }
              throw new Error(`Invalid address length: ${param}. Address must be exactly 42 characters (0x + 40 hex chars).`);
            } else if (param.length > 42) {
              // Too long, might be data or something else, keep as-is but lowercase
              return param.toLowerCase();
            }
          } else {
            // Not an address parameter - could be chain ID, block number, data, etc.
            // Just normalize to lowercase and pass through
            return param.toLowerCase();
          }
        }
        // Handle BigInt values (convert to hex string)
        if (typeof param === "bigint") {
          const hex = param.toString(16);
          // Ensure even number of digits
          return "0x" + (hex.length % 2 === 0 ? hex : "0" + hex);
        }
        // Handle number values that should be hex
        if (typeof param === "number" && (args.method.includes("Block") || args.method.includes("Gas"))) {
          const hex = param.toString(16);
          return "0x" + (hex.length % 2 === 0 ? hex : "0" + hex);
        }
        return param;
      }).filter((p: any) => p !== undefined);

      // Make the actual RPC call
      try {
        const requestBody = {
          jsonrpc: "2.0",
          method: args.method,
          params: cleanParams,
          id: Date.now(),
        };

        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          // Log the error for debugging with full details
          console.error("RPC Error Details:", {
            method: args.method,
            originalParams: JSON.stringify(params, null, 2),
            cleanParams: JSON.stringify(cleanParams, null, 2),
            requestBody: JSON.stringify(requestBody, null, 2),
            error: JSON.stringify(data.error, null, 2),
          });
          throw new Error(data.error.message || `RPC error: ${JSON.stringify(data.error)}`);
        }

        return data.result;
      } catch (error: any) {
        console.error("RPC Request failed:", {
          method: args.method,
          params: params,
          cleanParams: cleanParams,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }
    },
    on: () => {},
    removeListener: () => {},
  };
}

/**
 * Convert ethers signer to Safe Protocol Kit compatible provider and signer
 */
export async function getSafeProviderConfig(signer: ethers.Signer) {
  const ethersProvider = signer.provider || new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const signerAddress = await signer.getAddress();

  // Create EIP-1193 compatible provider
  // Safe Protocol Kit expects an EIP-1193 provider or HTTP/WebSocket URL
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  
  if (!rpcUrl) {
    throw new Error("NEXT_PUBLIC_RPC_URL not configured");
  }

  const contractNetworks = getContractNetworks();

  // If the signer has a provider (like BrowserProvider from wallet), use it directly
  // This ensures signing methods go through the wallet, not the RPC
  // Otherwise, create a custom provider for RPC calls only
  let providerToUse: any;
  
  if (ethersProvider && 'request' in ethersProvider) {
    // The signer's provider is an EIP-1193 provider (from wallet)
    // Wrap it to handle Hyperliquid RPC quirks while preserving signing capabilities
    const originalRequest = (ethersProvider as any).request.bind(ethersProvider);
    const customProvider = createHyperliquidProvider(rpcUrl);
    
    providerToUse = {
      request: async (args: { method: string; params?: readonly unknown[] | object }) => {
        // Signing methods: use the original provider (wallet)
        const signingMethods = [
          "eth_sign",
          "eth_signTransaction",
          "eth_signTypedData",
          "eth_signTypedData_v1",
          "eth_signTypedData_v3",
          "eth_signTypedData_v4",
          "personal_sign",
        ];
        
        if (signingMethods.includes(args.method)) {
          return await originalRequest(args);
        }
        
        // RPC methods: use custom provider (handles Hyperliquid quirks)
        return await customProvider.request(args);
      },
      on: (ethersProvider as any).on?.bind(ethersProvider) || (() => {}),
      removeListener: (ethersProvider as any).removeListener?.bind(ethersProvider) || (() => {}),
    };
  } else {
    // Fallback: use custom provider for RPC calls only
    providerToUse = createHyperliquidProvider(rpcUrl);
  }

  return {
    provider: providerToUse,
    signer: signer, // Pass the actual signer object, not just the address
    contractNetworks,
  };
}

