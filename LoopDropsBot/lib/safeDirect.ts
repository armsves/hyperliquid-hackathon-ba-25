import { ethers } from "ethers";
import { Address, WalletClient } from "viem";

// ERC20 ABI for transfer function
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

// Safe contract ABI (minimal - just what we need)
const SAFE_ABI = [
  "function nonce() external view returns (uint256)",
  "function getThreshold() external view returns (uint256)",
  "function getOwners() external view returns (address[])",
  "function getTransactionHash(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) external view returns (bytes32)",
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) external payable returns (bool success)",
];

/**
 * Get Safe nonce directly from contract
 */
export async function getSafeNonce(
  safeAddress: Address,
  provider: ethers.Provider
): Promise<number> {
  const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, provider);
  const nonce = await safeContract.nonce();
  return Number(nonce);
}

/**
 * Create EIP-712 typed data for Safe transaction
 */
export function createSafeTypedData(
  safeAddress: Address,
  chainId: number,
  transaction: {
    to: string;
    value: string;
    data: string;
    operation: number;
    safeTxGas: number;
    baseGas: number;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    nonce: number;
  }
) {
  const domain = {
    chainId: BigInt(chainId), // viem expects BigInt for chainId
    verifyingContract: safeAddress.toLowerCase() as `0x${string}`,
  };

  const types = {
    EIP712Domain: [
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    SafeTx: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const message = {
    to: transaction.to.toLowerCase() as `0x${string}`,
    value: BigInt(transaction.value),
    data: transaction.data as `0x${string}`,
    operation: transaction.operation as number,
    safeTxGas: BigInt(transaction.safeTxGas),
    baseGas: BigInt(transaction.baseGas),
    gasPrice: BigInt(transaction.gasPrice),
    gasToken: transaction.gasToken.toLowerCase() as `0x${string}`,
    refundReceiver: transaction.refundReceiver.toLowerCase() as `0x${string}`,
    nonce: BigInt(transaction.nonce),
  };

  return {
    domain,
    types,
    primaryType: "SafeTx" as const,
    message,
  };
}

/**
 * Calculate Safe transaction hash (EIP-712 hash)
 */
export function calculateSafeTxHash(typedData: ReturnType<typeof createSafeTypedData>): string {
  // This matches the Safe contract's getTransactionHash implementation
  // The hash is keccak256(encodePacked("bytes32", domainSeparator, "bytes32", structHash))
  
  // For now, we'll use a simpler approach - the wallet will calculate it when signing
  // But we can also calculate it manually if needed
  return ""; // Will be calculated by the wallet during signing
}

/**
 * Create a Safe transaction directly (without SDK)
 * Uses WalletClient for signing instead of ethers signer
 */
export async function createSafeTransactionDirect(
  safeAddress: Address,
  tokenAddress: Address,
  recipients: Array<{ address: string; amount: string }>,
  walletClient: WalletClient,
  chainId: number = 999
): Promise<{
  safeTxHash: string;
  transaction: {
    to: string;
    value: string;
    data: string;
    operation: number;
    safeTxGas: number;
    baseGas: number;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    nonce: number;
  };
  signature: string;
}> {
  // Create provider for reading from chain
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  
  // Get Safe nonce
  const nonce = await getSafeNonce(safeAddress, provider);
  
  // Encode ERC20 transfer for first recipient (for single transfer)
  // For multiple recipients, we'd need to batch them
  const recipient = recipients[0]; // For now, handle single transfer
  const erc20Interface = new ethers.Interface(ERC20_ABI);
  const data = erc20Interface.encodeFunctionData("transfer", [
    recipient.address,
    ethers.parseUnits(recipient.amount, 18),
  ]);
  
  // Create transaction data
  const transaction = {
    to: tokenAddress.toLowerCase(),
    value: "0",
    data,
    operation: 0, // CALL
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: "0",
    gasToken: "0x0000000000000000000000000000000000000000",
    refundReceiver: "0x0000000000000000000000000000000000000000",
    nonce,
  };
  
  // Create EIP-712 typed data
  const typedData = createSafeTypedData(safeAddress, chainId, transaction);
  
  // Debug: Log the typed data to verify it matches expected format
  console.log("Typed Data for signing:", JSON.stringify(typedData, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }, 2));
  
  // Get signer address from wallet
  const [signerAddress] = await walletClient.getAddresses();
  if (!signerAddress) {
    throw new Error("No account found in wallet");
  }
  
  // Sign the typed data using wallet client
  const signature = await walletClient.signTypedData({
    account: signerAddress,
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  });
  
  // Calculate safeTxHash using Safe contract
  const safeContract = new ethers.Contract(safeAddress, [
    "function getTransactionHash(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) external view returns (bytes32)",
  ], provider);
  
  const safeTxHashBytes32 = await safeContract.getTransactionHash(
    transaction.to,
    transaction.value,
    transaction.data,
    transaction.operation,
    transaction.safeTxGas,
    transaction.baseGas,
    transaction.gasPrice,
    transaction.gasToken,
    transaction.refundReceiver,
    transaction.nonce
  );
  
  // Convert bytes32 to hex string
  const safeTxHash = typeof safeTxHashBytes32 === "string" 
    ? safeTxHashBytes32 
    : ethers.hexlify(safeTxHashBytes32);
  
  return {
    safeTxHash,
    transaction,
    signature,
  };
}

/**
 * Pack signatures for Safe execTransaction
 * Safe expects signatures sorted by signer address (matching owner order)
 * Each signature is 65 bytes: r (32 bytes) + s (32 bytes) + v (1 byte)
 */
function packSignatures(signatures: Array<{ signer: string; signature: string }>, owners: string[]): string {
  // Sort signatures by signer address (matching owner order)
  const sortedSignatures = signatures
    .map(sig => ({
      ...sig,
      ownerIndex: owners.findIndex(owner => owner.toLowerCase() === sig.signer.toLowerCase()),
    }))
    .filter(sig => sig.ownerIndex !== -1)
    .sort((a, b) => a.ownerIndex - b.ownerIndex);
  
  // Pack signatures: each signature is 65 bytes (r: 32 bytes, s: 32 bytes, v: 1 byte)
  // Safe expects them concatenated
  let packed = "0x";
  for (const sig of sortedSignatures) {
    // Remove 0x prefix and ensure it's 130 hex chars (65 bytes)
    const sigData = sig.signature.startsWith("0x") ? sig.signature.slice(2) : sig.signature;
    if (sigData.length === 130) {
      packed += sigData;
    } else {
      throw new Error(`Invalid signature length for ${sig.signer}: expected 130 hex chars, got ${sigData.length}`);
    }
  }
  
  return packed;
}

/**
 * Execute a Safe transaction directly (without SDK)
 * Requires enough signatures to meet the threshold
 */
export async function executeSafeTransactionDirect(
  safeAddress: Address,
  transaction: {
    to: string;
    value: string;
    data: string;
    operation: number;
    safeTxGas: number;
    baseGas: number;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    nonce: number;
  },
  signatures: Array<{ signer: string; signature: string }>,
  walletClient: WalletClient,
  chainId: number = 999
): Promise<{ txHash: string }> {
  // Create provider for reading from chain
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  
  // Get Safe contract instance
  const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, provider);
  
  // Get threshold and owners
  const threshold = Number(await safeContract.getThreshold());
  const owners = await safeContract.getOwners();
  
  // Check we have enough signatures
  if (signatures.length < threshold) {
    throw new Error(`Not enough signatures. Have ${signatures.length}, need ${threshold}`);
  }
  
  // Pack signatures in the format Safe expects
  const packedSignatures = packSignatures(signatures, owners);
  
  // Get the account that will execute
  const [account] = await walletClient.getAddresses();
  if (!account) {
    throw new Error("No account found in wallet");
  }
  
  // Encode the execTransaction call
  const execTxInterface = new ethers.Interface(SAFE_ABI);
  const execTxData = execTxInterface.encodeFunctionData("execTransaction", [
    transaction.to,
    transaction.value,
    transaction.data,
    transaction.operation,
    transaction.safeTxGas,
    transaction.baseGas,
    transaction.gasPrice,
    transaction.gasToken,
    transaction.refundReceiver,
    packedSignatures,
  ]);
  
  console.log("Executing Safe transaction:", {
    to: safeAddress,
    data: execTxData,
    signatures: signatures.length,
    threshold,
  });
  
  // Send transaction using wallet client
  const txHash = await walletClient.sendTransaction({
    to: safeAddress,
    value: BigInt(0),
    data: execTxData as `0x${string}`,
    account,
  });
  
  return { txHash };
}

