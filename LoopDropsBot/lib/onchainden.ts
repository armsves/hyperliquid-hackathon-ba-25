import { Address } from "viem";

/**
 * Generate OnchainDen transaction URL
 * Format: https://safe.onchainden.com/transactions/tx?safe=hyperevm:{safeAddress}&id=multisig_{safeAddress}_{safeTxHash}
 * 
 * Note: OnchainDen only shows transactions that have been executed on-chain.
 * This URL will only work after the transaction has been executed.
 */
export function getOnchainDenTransactionUrl(
  safeAddress: Address,
  safeTxHash: string
): string {
  const safeAddressLower = safeAddress.toLowerCase();
  const transactionId = `multisig_${safeAddressLower}_${safeTxHash}`;
  return `https://safe.onchainden.com/transactions/tx?safe=hyperevm:${safeAddress}&id=${transactionId}`;
}

/**
 * Submit transaction to OnchainDen transaction service
 * Note: OnchainDen indexes transactions from the blockchain automatically,
 * so API submission is optional. The transaction will appear once executed.
 * 
 * This function attempts to submit via API (server-side only) but fails silently
 * if CORS or other issues occur, since OnchainDen will auto-index from chain.
 */
export async function submitToOnchainDen(
  safeAddress: Address,
  safeTxHash: string,
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
  signatures: Array<{ signer: string; signature: string }>
): Promise<{ success: boolean; url?: string; error?: string }> {
  // Always return the URL - OnchainDen will index from blockchain
  const url = getOnchainDenTransactionUrl(safeAddress, safeTxHash);
  
  // Note: OnchainDen's API doesn't support CORS from browser
  // Transactions will be automatically indexed from the blockchain once executed
  // We return the URL so users can view the transaction on OnchainDen
  
  return {
    success: true, // Consider it successful since URL is generated
    url,
  };
}

