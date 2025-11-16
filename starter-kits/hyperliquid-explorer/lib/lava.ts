import axios from "axios";

// Get RPC URL based on network
export function getLavaRpcUrl(network: "mainnet" | "testnet" = "mainnet"): string {
  if (network === "testnet") {
    return process.env.NEXT_PUBLIC_LAVA_RPC_URL_TESTNET || 
           process.env.NEXT_PUBLIC_LAVA_RPC_URL || 
           "https://g.w.lavanet.xyz:443/gateway/hyperliquid/rpc-http/";
  }
  return process.env.NEXT_PUBLIC_LAVA_RPC_URL || 
         "https://g.w.lavanet.xyz:443/gateway/hyperliquid/rpc-http/";
}

// Default RPC URL for backward compatibility
const LAVA_RPC_URL = getLavaRpcUrl("mainnet");

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed?: string;
  input: string;
  nonce: string;
  blockNumber: string;
  blockHash: string;
  transactionIndex: string;
  timestamp?: number;
  type?: string;
}

interface Block {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  transactions: Transaction[] | string[];
  gasUsed: string;
  gasLimit: string;
  miner: string;
}

interface HyperliquidData {
  transactions: Transaction[];
  uniqueUsers: number;
  totalVolume: string;
  avgGasPrice: string;
  latestBlock: number;
  blockTime: number;
  totalGasUsed: string;
}

// Make RPC call with error handling
async function makeRpcCall(method: string, params: any[] = [], network: "mainnet" | "testnet" = "mainnet"): Promise<any> {
  try {
    const rpcUrl = getLavaRpcUrl(network);
    const response = await axios.post(
      rpcUrl,
      {
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message || "RPC error");
    }

    return response.data.result;
  } catch (error: any) {
    console.error(`RPC call failed for ${method}:`, error.message);
    throw error;
  }
}

// Get latest block number
export async function getLatestBlockNumber(network: "mainnet" | "testnet" = "mainnet"): Promise<number> {
  const result = await makeRpcCall("eth_blockNumber", [], network);
  return parseInt(result, 16);
}

// Get block by number
export async function getBlockByNumber(blockNumber: number, fullTransactions: boolean = true, network: "mainnet" | "testnet" = "mainnet"): Promise<Block> {
  const hexBlockNumber = `0x${blockNumber.toString(16)}`;
  return await makeRpcCall("eth_getBlockByNumber", [hexBlockNumber, fullTransactions], network);
}

// Get comprehensive Hyperliquid data
export async function getHyperliquidData(network: "mainnet" | "testnet" = "mainnet"): Promise<HyperliquidData> {
  try {
    const latestBlock = await getLatestBlockNumber(network);
    
    const transactions: Transaction[] = [];
    const uniqueUsers = new Set<string>();
    const blockTimestamps: number[] = [];
    let totalGasUsed = BigInt(0);
    
    // Fetch last 10 blocks for better data
    const blockPromises = [];
    for (let i = 0; i < 10; i++) {
      blockPromises.push(getBlockByNumber(latestBlock - i, true, network));
    }
    
    const blocks = await Promise.allSettled(blockPromises);
    
    blocks.forEach((blockResult, idx) => {
      if (blockResult.status === "fulfilled" && blockResult.value) {
        const block = blockResult.value;
        const blockTimestamp = parseInt(block.timestamp, 16);
        blockTimestamps.push(blockTimestamp);
        
        if (block.gasUsed) {
          totalGasUsed += BigInt(block.gasUsed);
        }
        
        if (Array.isArray(block.transactions)) {
          block.transactions.forEach((tx: any) => {
            if (typeof tx === "object") {
              transactions.push({
                ...tx,
                timestamp: blockTimestamp,
                gasUsed: tx.gas, // Estimate with gas limit if gasUsed not available
              });
              if (tx.from) uniqueUsers.add(tx.from.toLowerCase());
              if (tx.to) uniqueUsers.add(tx.to.toLowerCase());
            }
          });
        }
      }
    });

    // Calculate total volume
    const totalVolume = transactions.reduce((sum, tx) => {
      return sum + BigInt(tx.value || "0");
    }, BigInt(0));

    // Calculate average gas price
    const avgGasPrice = transactions.length > 0
      ? transactions.reduce((sum, tx) => {
          const gasPrice = parseInt(tx.gasPrice || "0", 16);
          return sum + (isNaN(gasPrice) ? 0 : gasPrice);
        }, 0) / transactions.length / 1e9
      : 0;

    // Calculate average block time
    const blockTime = blockTimestamps.length > 1
      ? (Math.max(...blockTimestamps) - Math.min(...blockTimestamps)) / (blockTimestamps.length - 1)
      : 0;

    return {
      transactions: transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
      uniqueUsers: uniqueUsers.size,
      totalVolume: totalVolume.toString(),
      avgGasPrice: avgGasPrice.toFixed(2),
      latestBlock,
      blockTime: Math.round(blockTime),
      totalGasUsed: totalGasUsed.toString(),
    };
  } catch (error: any) {
    console.error("Error fetching Hyperliquid data:", error);
    throw new Error(`Failed to fetch Hyperliquid data from Lava RPC: ${error.message || "Unknown error"}`);
  }
}

// Get transaction by hash with receipt
export async function getTransactionByHash(hash: string, network: "mainnet" | "testnet" = "mainnet") {
  try {
    const [transaction, receipt] = await Promise.all([
      makeRpcCall("eth_getTransactionByHash", [hash], network),
      makeRpcCall("eth_getTransactionReceipt", [hash], network).catch(() => null),
    ]);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return {
      ...transaction,
      receipt,
    };
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    throw new Error(`Failed to fetch transaction: ${error.message || "Unknown error"}`);
  }
}

// Get transaction receipt
export async function getTransactionReceipt(hash: string, network: "mainnet" | "testnet" = "mainnet") {
  try {
    const receipt = await makeRpcCall("eth_getTransactionReceipt", [hash], network);
    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }
    return receipt;
  } catch (error: any) {
    console.error("Error fetching transaction receipt:", error);
    throw new Error(`Failed to fetch receipt: ${error.message || "Unknown error"}`);
  }
}

// Get balance of an address
export async function getBalance(address: string, network: "mainnet" | "testnet" = "mainnet"): Promise<string> {
  try {
    const balance = await makeRpcCall("eth_getBalance", [address, "latest"], network);
    return balance;
  } catch (error: any) {
    console.error("Error fetching balance:", error);
    throw new Error(`Failed to fetch balance: ${error.message || "Unknown error"}`);
  }
}

// Get transaction count (nonce) for an address
export async function getTransactionCount(address: string, network: "mainnet" | "testnet" = "mainnet"): Promise<number> {
  try {
    const count = await makeRpcCall("eth_getTransactionCount", [address, "latest"], network);
    return parseInt(count, 16);
  } catch (error: any) {
    console.error("Error fetching transaction count:", error);
    throw new Error(`Failed to fetch transaction count: ${error.message || "Unknown error"}`);
  }
}

// Get gas price
export async function getGasPrice(network: "mainnet" | "testnet" = "mainnet"): Promise<string> {
  try {
    const gasPrice = await makeRpcCall("eth_gasPrice", [], network);
    return gasPrice;
  } catch (error: any) {
    console.error("Error fetching gas price:", error);
    throw new Error(`Failed to fetch gas price: ${error.message || "Unknown error"}`);
  }
}

// Get network chain ID
export async function getChainId(network: "mainnet" | "testnet" = "mainnet"): Promise<number> {
  try {
    const chainId = await makeRpcCall("eth_chainId", [], network);
    return parseInt(chainId, 16);
  } catch (error: any) {
    console.error("Error fetching chain ID:", error);
    throw new Error(`Failed to fetch chain ID: ${error.message || "Unknown error"}`);
  }
}

// Get recent transactions for an address (last N blocks)
export async function getAddressTransactions(address: string, blockCount: number = 20, network: "mainnet" | "testnet" = "mainnet"): Promise<any[]> {
  try {
    const latestBlockNum = await getLatestBlockNumber(network);
    const transactions: any[] = [];
    
    // Fetch last N blocks and filter for transactions involving this address
    for (let i = 0; i < blockCount && i < latestBlockNum; i++) {
      const blockNum = latestBlockNum - i;
      const block = await getBlockByNumber(blockNum, true, network);
      
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.from?.toLowerCase() === address.toLowerCase() || 
              tx.to?.toLowerCase() === address.toLowerCase()) {
            transactions.push({
              ...tx,
              timestamp: parseInt(block.timestamp, 16),
              blockNumber: blockNum
            });
          }
        }
      }
    }
    
    return transactions;
  } catch (error) {
    console.error("Error getting address transactions:", error);
    return [];
  }
}

// Get code at address to check if it's a contract
export async function getCode(address: string, network: "mainnet" | "testnet" = "mainnet"): Promise<string> {
  try {
    const result = await makeRpcCall("eth_getCode", [address, "latest"], network);
    return result;
  } catch (error) {
    console.error("Error getting code:", error);
    throw error;
  }
}

// Check ERC20 token balance by calling balanceOf
export async function getTokenBalance(tokenAddress: string, walletAddress: string, network: "mainnet" | "testnet" = "mainnet"): Promise<string> {
  try {
    // ERC20 balanceOf method signature: 0x70a08231
    const data = "0x70a08231" + walletAddress.substring(2).padStart(64, "0");
    const result = await makeRpcCall("eth_call", [
      {
        to: tokenAddress,
        data: data
      },
      "latest"
    ], network);
    return result;
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0x0";
  }
}

// Lookup function signature from method ID using 4byte.directory
export async function lookupFunctionSignature(methodId: string): Promise<string[]> {
  try {
    // Remove 0x prefix if present
    const cleanMethodId = methodId.startsWith("0x") ? methodId.slice(2) : methodId;
    
    // Query 4byte.directory API
    const response = await axios.get(
      `https://www.4byte.directory/api/v1/signatures/?hex_signature=0x${cleanMethodId}`,
      { timeout: 5000 }
    );
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results.map((result: any) => result.text_signature);
    }
    
    return [];
  } catch (error) {
    console.error("Error looking up function signature:", error);
    return [];
  }
}

