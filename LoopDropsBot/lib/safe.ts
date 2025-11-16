import Safe, { SafeAccountConfig, PredictedSafeProps } from "@safe-global/protocol-kit";
import { ethers } from "ethers";
import { Address } from "viem";
import axios from "axios";
import { getSafeProviderConfig } from "./safeHelpers";

// ERC20 ABI for transfer function
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

/**
 * Create a batch transfer transaction for multiple recipients
 * Uses individual transfers instead of MultiSend for better compatibility
 */
export async function createBatchTransferTransaction(
  safeAddress: Address,
  tokenAddress: Address,
  recipients: Array<{ address: string; amount: string }>,
  signer: ethers.Signer,
  walletClient?: any // WalletClient from wagmi
): Promise<string> {
  // Use direct contract interaction instead of SDK
  const { createSafeTransactionDirect } = await import("./safeDirect");
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "999", 10);
  
  // If walletClient is not provided, try to get it from the signer
  // The signer was created from WalletClient, so we need to pass it separately
  if (!walletClient) {
    throw new Error("WalletClient is required for signing. Please pass it as a parameter.");
  }
  
  try {
    const result = await createSafeTransactionDirect(
      safeAddress,
      tokenAddress,
      recipients,
      walletClient,
      chainId
    );
    
    // Store transaction data for manual approval
    const { storeSafeTransaction } = await import("./safeTransactionStore");
    const [signerAddress] = await walletClient.getAddresses();
    if (!signerAddress) {
      throw new Error("No signer address found");
    }
    
    const transactionData = {
      safeTxHash: result.safeTxHash,
      safeAddress,
      transaction: result.transaction,
      signatures: [{
        signer: signerAddress,
        signature: result.signature,
      }],
      createdAt: new Date().toISOString(),
    };
    
    storeSafeTransaction(transactionData);
    console.log("Transaction stored successfully:", {
      safeTxHash: result.safeTxHash,
      safeAddress,
      signer: signerAddress,
      signaturesCount: 1,
    });
    
    // Generate OnchainDen URL (OnchainDen will auto-index from blockchain)
    // No need to submit via API - they index transactions automatically
    try {
      const { submitToOnchainDen } = await import("./onchainden");
      await submitToOnchainDen(
        safeAddress,
        result.safeTxHash,
        result.transaction,
        [{
          signer: signerAddress,
          signature: result.signature,
        }]
      );
    } catch (onchainDenError: any) {
      // Silent fail - OnchainDen will index from blockchain automatically
    }
    
    return result.safeTxHash;
  } catch (error: any) {
    console.error("Error creating Safe transaction (direct):", error);
    throw error;
  }
}

// Old SDK-based implementation (kept for reference, but not used)
export async function createBatchTransferTransaction_SDK(
  safeAddress: Address,
  tokenAddress: Address,
  recipients: Array<{ address: string; amount: string }>,
  signer: ethers.Signer
): Promise<string> {
  try {
    // Initialize Safe SDK with contract networks configuration
    const { provider, signer: safeSigner, contractNetworks } = await getSafeProviderConfig(signer);

    // Verify Safe address has code (is a contract)
    const providerForCheck = signer.provider || new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const code = await providerForCheck.getCode(safeAddress);
    if (!code || code === "0x") {
      throw new Error(`Safe address ${safeAddress} does not have contract code. Please verify this is a valid Safe wallet address.`);
    }

    // Check if we have required contract addresses
    const safeProxyFactoryAddress = process.env.NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS;
    const safeSingletonAddress = process.env.NEXT_PUBLIC_SAFE_SINGLETON_ADDRESS;
    
    if (!contractNetworks || (!safeProxyFactoryAddress && !safeSingletonAddress)) {
      throw new Error(
        "Safe contracts are not configured. " +
        "To use an existing Safe wallet, you need to configure at least the SafeProxyFactory address. " +
        "Set NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS in your .env.local file. " +
        "Even if you're not creating new Safes, the SDK needs the factory address for initialization. " +
        "See DEPLOY_SAFE_CONTRACTS.md for deployment instructions."
      );
    }

    let safeSdk: Safe;
    try {
      safeSdk = await Safe.init({
        provider,
        signer: safeSigner, // Use the actual signer object, not just the address
        safeAddress,
        contractNetworks,
      });
    } catch (initError: any) {
      // Provide helpful error message for common issues
      if (initError.message?.includes("SafeProxy") || initError.message?.includes("not deployed")) {
        throw new Error(
          `Failed to initialize Safe SDK: ${initError.message}\n\n` +
          `This usually means the SafeProxyFactory contract is not deployed or not configured correctly. ` +
          `Please ensure NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS is set to a valid deployed contract address. ` +
          `See DEPLOY_SAFE_CONTRACTS.md for instructions.`
        );
      }
      throw initError;
    }

    // Create transactions for each recipient
    const transactions = recipients.map((recipient) => {
      const erc20Interface = new ethers.Interface(ERC20_ABI);
      const data = erc20Interface.encodeFunctionData("transfer", [
        recipient.address,
        ethers.parseUnits(recipient.amount, 18), // Assuming 18 decimals
      ]);

      return {
        to: tokenAddress,
        value: "0",
        data,
      };
    });

    // Check if MultiSend is configured (and not a placeholder)
    const multiSendAddress = process.env.NEXT_PUBLIC_MULTISEND_ADDRESS;
    const isValidMultiSend = multiSendAddress && 
                             multiSendAddress !== "0x..." && 
                             !multiSendAddress.includes("...") &&
                             multiSendAddress.length === 42 &&
                             /^0x[0-9a-fA-F]{40}$/.test(multiSendAddress);
    
    let safeTransaction;
    if (isValidMultiSend) {
      // Use MultiSend for gas-efficient batch transfers
      const multiSendData = encodeMultiSend(transactions);
      safeTransaction = await safeSdk.createTransaction({
        transactions: [{
          to: multiSendAddress as `0x${string}`,
          value: "0",
          data: multiSendData,
          operation: 1, // DELEGATE_CALL for MultiSend
        }],
      });
    } else {
      // Fallback to individual transactions if MultiSend not configured
      safeTransaction = await safeSdk.createTransaction({
        transactions,
      });
    }

    // Get transaction hash and sign the transaction
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
    const senderAddress = await signer.getAddress();
    
    // Sign the transaction
    const signedTransaction = await safeSdk.signTransaction(safeTransaction);
    
    // Store transaction data for manual approval (since Safe Transaction Service may not be available)
    // This allows other signers to approve the transaction
    const { storeSafeTransaction } = await import("./safeTransactionStore");
    storeSafeTransaction({
      safeTxHash,
      safeAddress,
      transaction: {
        to: signedTransaction.data.to,
        value: signedTransaction.data.value,
        data: signedTransaction.data.data,
        operation: signedTransaction.data.operation,
        safeTxGas: signedTransaction.data.safeTxGas || 0,
        baseGas: signedTransaction.data.baseGas || 0,
        gasPrice: signedTransaction.data.gasPrice || "0",
        gasToken: signedTransaction.data.gasToken || "0x0000000000000000000000000000000000000000",
        refundReceiver: signedTransaction.data.refundReceiver || "0x0000000000000000000000000000000000000000",
        nonce: signedTransaction.data.nonce,
      },
      signatures: [{
        signer: senderAddress,
        signature: signedTransaction.signatures.get(senderAddress) || "",
      }],
      createdAt: new Date().toISOString(),
    });
    
    // Try to propose transaction via Safe Transaction Service API (optional)
    // If service is not available, transaction is still created and signed
    // Other signers can approve it manually
    try {
      const serviceUrl = getSafeServiceUrl();
      if (!serviceUrl) {
        console.warn("Safe Transaction Service URL not configured. Transaction created and signed, but not proposed to service.");
        console.log("Safe Tx Hash:", safeTxHash);
        console.log("Other signers can approve this transaction manually using their wallets.");
        return safeTxHash;
      }
      
      await axios.post(
        `${serviceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/`,
        {
          to: signedTransaction.data.to,
          value: signedTransaction.data.value,
          data: signedTransaction.data.data,
          operation: signedTransaction.data.operation,
          safeTxGas: signedTransaction.data.safeTxGas || 0,
          baseGas: signedTransaction.data.baseGas || 0,
          gasPrice: signedTransaction.data.gasPrice || "0",
          gasToken: signedTransaction.data.gasToken || "0x0000000000000000000000000000000000000000",
          refundReceiver: signedTransaction.data.refundReceiver || "0x0000000000000000000000000000000000000000",
          nonce: signedTransaction.data.nonce,
          safeTxHash: safeTxHash,
          sender: senderAddress,
          signature: signedTransaction.signatures.get(senderAddress) || "",
        }
      );
    } catch (serviceError: any) {
      // Safe Transaction Service might not be available for Hyperliquid
      // This is okay - the transaction is still created and signed
      // Users can approve it manually from their wallets
      console.warn("Safe Transaction Service not available:", serviceError.message);
      console.log("Transaction created and signed. Safe Tx Hash:", safeTxHash);
      console.log("Other signers can approve this transaction manually using the Safe Tx Hash.");
    }

    return safeTxHash;
  } catch (error: any) {
    console.error("Error creating Safe transaction:", error);
    console.error("Error details:", {
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack,
    });
    // Log the full error chain if available
    if (error?.cause) {
      console.error("Caused by:", error.cause);
    }
    throw error;
  }
}

/**
 * Encode multiple transactions into a multiSend call
 * This is a simplified version - in production, use the actual MultiSend contract
 */
function encodeMultiSend(transactions: Array<{ to: string; value: string; data: string }>): string {
  // MultiSend contract ABI
  const MULTISEND_ABI = [
    "function multiSend(bytes transactions) external payable",
  ];

  // Encode transactions as packed bytes
  // Format: to (20 bytes) + value (32 bytes) + dataLength (32 bytes) + data (variable)
  let transactionsData = "0x";
  
  for (const tx of transactions) {
    const to = tx.to.slice(2).padStart(40, "0"); // Remove 0x and pad to 20 bytes
    const value = BigInt(tx.value).toString(16).padStart(64, "0"); // 32 bytes
    const data = tx.data.slice(2); // Remove 0x
    const dataLength = (data.length / 2).toString(16).padStart(64, "0"); // 32 bytes
    
    transactionsData += to + value + dataLength + data;
  }

  const multiSendInterface = new ethers.Interface(MULTISEND_ABI);
  return multiSendInterface.encodeFunctionData("multiSend", [transactionsData]);
}

/**
 * Get Safe Transaction Service URL based on chain
 * 
 * REQUIRED CONFIGURATION:
 * Set NEXT_PUBLIC_SAFE_SERVICE_URL in your .env.local file
 * 
 * For supported chains, see: https://docs.safe.global/safe-core-api/available-services
 * For HyperEVM, you may need to self-host or use a custom service URL
 */
function getSafeServiceUrl(): string | undefined {
  const serviceUrl = process.env.NEXT_PUBLIC_SAFE_SERVICE_URL;
  return serviceUrl || undefined;
}

/**
 * Get MultiSend contract address (optional)
 * 
 * If MultiSend is deployed and configured, it can be used for gas optimization.
 * Otherwise, individual transfers are used.
 */
function getMultiSendAddress(): string | null {
  return process.env.NEXT_PUBLIC_MULTISEND_ADDRESS || null;
}

/**
 * Get Safe instance for a given address
 */
export async function getSafeInstance(
  safeAddress: Address,
  signer: ethers.Signer
): Promise<Safe> {
  const { provider, signer: signerAddress, contractNetworks } = await getSafeProviderConfig(signer);

  return Safe.init({
    provider,
    signer: signerAddress,
    safeAddress,
    contractNetworks,
  });
}

/**
 * Propose a transaction to Safe
 */
export async function proposeSafeTransaction(
  safeAddress: Address,
  safeTransaction: any,
  signer: ethers.Signer
): Promise<string> {
  const { provider, signer: signerAddress, contractNetworks } = await getSafeProviderConfig(signer);

  const safeSdk = await Safe.init({
    provider,
    signer: signerAddress,
    safeAddress,
    contractNetworks,
  });

  // Sign the transaction
  const signedTransaction = await safeSdk.signTransaction(safeTransaction);
  
  // Try to propose transaction via Safe Transaction Service API (optional)
  const serviceUrl = getSafeServiceUrl();
  const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
  const senderAddress = await signer.getAddress();
  
  if (!serviceUrl) {
    console.warn("Safe Transaction Service URL not configured. Transaction signed but not proposed to service.");
    return safeTxHash;
  }
  
  try {
    await axios.post(
      `${serviceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/`,
    {
      to: signedTransaction.data.to,
      value: signedTransaction.data.value,
      data: signedTransaction.data.data,
      operation: signedTransaction.data.operation,
      safeTxGas: signedTransaction.data.safeTxGas || 0,
      baseGas: signedTransaction.data.baseGas || 0,
      gasPrice: signedTransaction.data.gasPrice || "0",
      gasToken: signedTransaction.data.gasToken || "0x0000000000000000000000000000000000000000",
      refundReceiver: signedTransaction.data.refundReceiver || "0x0000000000000000000000000000000000000000",
      nonce: signedTransaction.data.nonce,
      safeTxHash: safeTxHash,
      sender: senderAddress,
      signature: signedTransaction.signatures.get(senderAddress) || "",
    }
    );
  } catch (error: any) {
    console.warn("Failed to propose to Safe Transaction Service:", error.message);
    // Transaction is still signed, can be approved manually
  }

  return safeTxHash;
}

/**
 * Create a new Safe wallet
 * Based on Safe SDK Starter Kit: https://docs.safe.global/sdk/starter-kit
 */
export async function createSafeWallet(
  owners: Address[],
  threshold: number,
  signer: ethers.Signer
): Promise<{ safeAddress: Address; safeSdk: Safe }> {
  if (owners.length === 0) {
    throw new Error("At least one owner is required");
  }

  if (threshold < 1 || threshold > owners.length) {
    throw new Error(`Threshold must be between 1 and ${owners.length}`);
  }

  const { provider, signer: signerAddress, contractNetworks } = await getSafeProviderConfig(signer);

  // Check if Safe contracts are configured
  // Safe contracts are NOT deployed on Hyperliquid by default
  // They need to be deployed manually or configured via environment variables
  if (!contractNetworks) {
    throw new Error(
      "Safe contracts are not deployed on Hyperliquid. " +
      "You need to deploy Safe contracts (SafeProxyFactory, SafeSingleton, MultiSend) first. " +
      "See SAFE_CONFIGURATION.md for deployment instructions. " +
      "Alternatively, set NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS, NEXT_PUBLIC_SAFE_SINGLETON_ADDRESS, " +
      "and NEXT_PUBLIC_MULTISEND_ADDRESS environment variables with deployed contract addresses."
    );
  }

  // Configure Safe account
  const safeAccountConfig: SafeAccountConfig = {
    owners: owners.map(o => o.toLowerCase()),
    threshold,
  };

  // Create predicted Safe (not yet deployed)
  const predictedSafe: PredictedSafeProps = {
    safeAccountConfig,
  };

  try {
    // Initialize Safe SDK with predicted Safe
    const safeSdk = await Safe.init({
      provider,
      signer: signerAddress,
      predictedSafe,
      contractNetworks,
    });

    // Create deployment transaction
    const deploymentTx = await safeSdk.createSafeDeploymentTransaction();
    
    // Execute deployment transaction
    const txResponse = await signer.sendTransaction(deploymentTx);
    await txResponse.wait();

    // Get deployed Safe address
    const safeAddress = await safeSdk.getAddress() as Address;

    // Connect to the deployed Safe
    const deployedSafe = await safeSdk.connect({
      safeAddress,
    });

    return { safeAddress, safeSdk: deployedSafe };
  } catch (error: any) {
    // Provide helpful error message if MultiSend validation fails
    if (error.message?.includes("multiSend") || error.message?.includes("MultiSend")) {
      throw new Error(
        "Safe MultiSend contract validation failed. " +
        "Safe contracts need to be deployed on Hyperliquid first. " +
        "The MultiSend contract address must be valid and deployed. " +
        "See SAFE_CONFIGURATION.md for deployment instructions. " +
        "Original error: " + error.message
      );
    }
    throw error;
  }
}

/**
 * Add an owner to an existing Safe
 */
export async function addSafeOwner(
  safeAddress: Address,
  newOwner: Address,
  signer: ethers.Signer
): Promise<string> {
  const { provider, signer: signerAddress, contractNetworks } = await getSafeProviderConfig(signer);

  const safeSdk = await Safe.init({
    provider,
    signer: signerAddress,
    safeAddress,
    contractNetworks,
  });

  // Create transaction to add owner
  const safeTransaction = await safeSdk.createAddOwnerTx({
    ownerAddress: newOwner,
  });

  // Sign the transaction
  const signedTransaction = await safeSdk.signTransaction(safeTransaction);

  // Execute the transaction (or propose it if threshold not met)
  const executeTxResponse = await safeSdk.executeTransaction(signedTransaction);
  if (executeTxResponse.transactionResponse && typeof executeTxResponse.transactionResponse === 'object') {
    const txResponse = executeTxResponse.transactionResponse as any;
    if (txResponse.wait) {
      await txResponse.wait();
    }
  }

  return executeTxResponse.hash;
}

/**
 * Remove an owner from Safe
 */
export async function removeSafeOwner(
  safeAddress: Address,
  ownerToRemove: Address,
  signer: ethers.Signer
): Promise<string> {
  const { provider, signer: signerAddress, contractNetworks } = await getSafeProviderConfig(signer);

  const safeSdk = await Safe.init({
    provider,
    signer: signerAddress,
    safeAddress,
    contractNetworks,
  });

  // Create transaction to remove owner
  const safeTransaction = await safeSdk.createRemoveOwnerTx({
    ownerAddress: ownerToRemove,
  });

  // Sign and execute
  const signedTransaction = await safeSdk.signTransaction(safeTransaction);
  const executeTxResponse = await safeSdk.executeTransaction(signedTransaction);
  if (executeTxResponse.transactionResponse && typeof executeTxResponse.transactionResponse === 'object') {
    const txResponse = executeTxResponse.transactionResponse as any;
    if (txResponse.wait) {
      await txResponse.wait();
    }
  }

  return executeTxResponse.hash;
}

/**
 * Change the threshold of a Safe
 */
export async function changeSafeThreshold(
  safeAddress: Address,
  newThreshold: number,
  signer: ethers.Signer
): Promise<string> {
  const { provider, signer: signerAddress, contractNetworks } = await getSafeProviderConfig(signer);

  const safeSdk = await Safe.init({
    provider,
    signer: signerAddress,
    safeAddress,
    contractNetworks,
  });

  // Get current owners
  const owners = await safeSdk.getOwners();
  
  if (newThreshold < 1 || newThreshold > owners.length) {
    throw new Error(`Threshold must be between 1 and ${owners.length}`);
  }

  // Create transaction to change threshold
  const safeTransaction = await safeSdk.createChangeThresholdTx(newThreshold);

  // Sign and execute
  const signedTransaction = await safeSdk.signTransaction(safeTransaction);
  const executeTxResponse = await safeSdk.executeTransaction(signedTransaction);
  if (executeTxResponse.transactionResponse && typeof executeTxResponse.transactionResponse === 'object') {
    const txResponse = executeTxResponse.transactionResponse as any;
    if (txResponse.wait) {
      await txResponse.wait();
    }
  }

  return executeTxResponse.hash;
}

/**
 * Get Safe configuration (owners and threshold)
 */
export async function getSafeConfig(
  safeAddress: Address,
  signer: ethers.Signer
): Promise<{ owners: Address[]; threshold: number }> {
  const { provider, signer: signerAddress, contractNetworks } = await getSafeProviderConfig(signer);

  const safeSdk = await Safe.init({
    provider,
    signer: signerAddress,
    safeAddress,
    contractNetworks,
  });

  const owners = await safeSdk.getOwners();
  const threshold = await safeSdk.getThreshold();

  return {
    owners: owners as Address[],
    threshold,
  };
}

