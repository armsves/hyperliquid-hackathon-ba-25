// Store Safe transaction data for manual approval
// In production, use a database

export interface SafeTransactionData {
  safeTxHash: string;
  safeAddress: string;
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
  signatures: Array<{
    signer: string;
    signature: string;
  }>;
  createdAt: string;
}

let transactions: SafeTransactionData[] = [];

export function storeSafeTransaction(data: SafeTransactionData): void {
  // Find existing transaction (case-insensitive match)
  const existing = transactions.find(tx => 
    tx.safeTxHash.toLowerCase() === data.safeTxHash.toLowerCase()
  );
  
  if (existing) {
    // Update existing transaction with new signatures
    existing.signatures = data.signatures;
    console.log("Updated existing transaction:", data.safeTxHash, "with", data.signatures.length, "signatures");
  } else {
    // Store new transaction (keep original hash format)
    transactions.push(data);
    console.log("Stored new transaction:", data.safeTxHash, "Total transactions:", transactions.length);
  }
}

export function getSafeTransaction(safeTxHash: string): SafeTransactionData | undefined {
  // Try exact match first
  let tx = transactions.find(tx => tx.safeTxHash === safeTxHash);
  
  // If not found, try case-insensitive match
  if (!tx) {
    tx = transactions.find(tx => tx.safeTxHash.toLowerCase() === safeTxHash.toLowerCase());
  }
  
  return tx;
}

export function getAllSafeTransactions(safeAddress?: string): SafeTransactionData[] {
  if (safeAddress) {
    return transactions.filter(tx => tx.safeAddress.toLowerCase() === safeAddress.toLowerCase());
  }
  return transactions;
}

export function addSignature(safeTxHash: string, signer: string, signature: string): boolean {
  const tx = getSafeTransaction(safeTxHash);
  if (!tx) {
    return false;
  }
  
  // Check if signer already signed
  if (tx.signatures.some(sig => sig.signer.toLowerCase() === signer.toLowerCase())) {
    return false;
  }
  
  tx.signatures.push({ signer, signature });
  return true;
}

