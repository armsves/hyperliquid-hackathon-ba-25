import { ethers } from "ethers";
import Safe from "@safe-global/protocol-kit";
import { Address, WalletClient } from "viem";
import { getSafeProviderConfig } from "./safeHelpers";
import { getSafeTransaction, addSignature } from "./safeTransactionStore";
import { createAuditLog } from "./distributionStore";
import { executeSafeTransactionDirect } from "./safeDirect";

/**
 * Approve a Safe transaction by signing it with the connected wallet
 * Uses direct contract interaction instead of SDK
 */
export async function approveSafeTransaction(
  safeTxHash: string,
  walletClient: WalletClient
): Promise<{ success: boolean; message: string; signatureCount: number }> {
  try {
    // Get stored transaction data
    const txData = getSafeTransaction(safeTxHash);
    if (!txData) {
      throw new Error("Transaction not found. Make sure the transaction was proposed first.");
    }

    const [signerAddress] = await walletClient.getAddresses();
    if (!signerAddress) {
      throw new Error("No account found in wallet");
    }
    
    // Check if already signed
    if (txData.signatures.some(sig => sig.signer.toLowerCase() === signerAddress.toLowerCase())) {
      return {
        success: false,
        message: "You have already signed this transaction",
        signatureCount: txData.signatures.length,
      };
    }

    // Get Safe threshold and owners using direct contract call
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const safeContract = new ethers.Contract(txData.safeAddress, [
      "function getThreshold() external view returns (uint256)",
      "function getOwners() external view returns (address[])",
      "function getTransactionHash(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) external view returns (bytes32)",
    ], provider);
    
    const threshold = Number(await safeContract.getThreshold());
    const owners = await safeContract.getOwners();

    // Create EIP-712 typed data for signing
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "999", 10);
    const { createSafeTypedData } = await import("./safeDirect");
    const typedData = createSafeTypedData(txData.safeAddress as Address, chainId, txData.transaction);

    // Sign the typed data using wallet client
    const signature = await walletClient.signTypedData({
      account: signerAddress,
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });

    // Store the signature
    addSignature(safeTxHash, signerAddress, signature);

    // Get updated transaction data
    const updatedTx = getSafeTransaction(safeTxHash);
    const signatureCount = updatedTx?.signatures.length || 0;

    // OnchainDen will auto-index from blockchain - no API submission needed
    // URL is generated for user convenience
    try {
      const { submitToOnchainDen } = await import("./onchainden");
      if (updatedTx) {
        await submitToOnchainDen(
          txData.safeAddress as Address,
          safeTxHash,
          txData.transaction,
          updatedTx.signatures
        );
      }
    } catch (onchainDenError: any) {
      // Silent fail - OnchainDen indexes from blockchain automatically
    }

    const canExecute = signatureCount >= threshold;

    return {
      success: true,
      message: canExecute
        ? `Transaction approved! You have ${signatureCount} of ${threshold} required signatures. Transaction can now be executed.`
        : `Transaction approved! You have ${signatureCount} of ${threshold} required signatures. Need ${threshold - signatureCount} more approval(s).`,
      signatureCount,
    };
  } catch (error: any) {
    console.error("Error approving transaction:", error);
    throw new Error(`Failed to approve transaction: ${error.message || "Unknown error"}`);
  }
}

/**
 * Execute a Safe transaction once threshold is met
 * Uses direct contract interaction instead of SDK
 */
export async function executeSafeTransaction(
  safeTxHash: string,
  walletClient: WalletClient
): Promise<{ txHash: string }> {
  try {
    const txData = getSafeTransaction(safeTxHash);
    if (!txData) {
      throw new Error("Transaction not found");
    }

    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "999", 10);
    
    // Execute using direct contract interaction
    const result = await executeSafeTransactionDirect(
      txData.safeAddress as Address,
      txData.transaction,
      txData.signatures,
      walletClient,
      chainId
    );
    
    return { txHash: result.txHash };
  } catch (error: any) {
    console.error("Error executing transaction:", error);
    throw new Error(`Failed to execute transaction: ${error.message || "Unknown error"}`);
  }
}

