"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader, Copy, ExternalLink, Play } from "lucide-react";
import { approveSafeTransaction, executeSafeTransaction } from "@/lib/approveTransaction";
// Note: safeTransactionStore is server-side only, use API endpoints instead
import { getOnchainDenTransactionUrl } from "@/lib/onchainden";

const DEFAULT_SAFE_ADDRESS = "0xf61aeCdF5D19ba4E175b5Bf902332870847A987E";

export default function ApproveTransactionPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const searchParams = useSearchParams();
  const [safeAddress, setSafeAddress] = useState(DEFAULT_SAFE_ADDRESS);
  const [safeTxHash, setSafeTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [txDetails, setTxDetails] = useState<any>(null);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);

  useEffect(() => {
    const txHash = searchParams.get("txHash");
    if (txHash) {
      setSafeTxHash(txHash);
    }
  }, [searchParams]);

  const fetchTxDetails = async () => {
    if (!safeTxHash) {
      setTxDetails(null);
      return;
    }
    
    try {
      // Fetch from API endpoint (server-side store)
      const response = await fetch(`/api/safe/transactions?safeTxHash=${safeTxHash}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const tx = result.data;
          setTxDetails({
            hash: tx.safeTxHash,
            status: tx.signatures.length >= 2 ? "ready" : "pending",
            confirmations: tx.signatures.length,
            needed: 2, // Your Safe threshold
            signatures: tx.signatures,
          });
          setError("");
        } else {
          setTxDetails(null);
          setError("Transaction not found. Make sure the transaction was proposed first.");
        }
      } else {
        const errorData = await response.json();
        setTxDetails(null);
        let errorMsg = "Transaction not found. Make sure the transaction was proposed first.";
        if (errorData.debug) {
          errorMsg += `\n\nDebug: Looking for ${errorData.debug.searchedHash}, found ${errorData.debug.availableCount} transactions.`;
          if (errorData.debug.availableHashes && errorData.debug.availableHashes.length > 0) {
            errorMsg += `\nAvailable hashes: ${errorData.debug.availableHashes.slice(0, 3).join(", ")}...`;
          }
        }
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Error fetching transaction details:", err);
      setTxDetails(null);
      setError("Failed to fetch transaction details.");
    }
  };

  const fetchPendingTransactions = async () => {
    if (!safeAddress) {
      setPendingTransactions([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/safe/transactions?safeAddress=${safeAddress}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPendingTransactions(result.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching pending transactions:", err);
    }
  };

  useEffect(() => {
    if (safeAddress) {
      fetchPendingTransactions();
    }
  }, [safeAddress, success]);

  useEffect(() => {
    if (safeTxHash) {
      fetchTxDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTxHash]);

  const handleApprove = async () => {
    if (!isConnected || !walletClient || !safeTxHash) {
      setError("Please connect wallet and enter Safe transaction hash");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Approve using walletClient directly (no need for ethers signer)
      const result = await approveSafeTransaction(safeTxHash, walletClient);
      
      if (result.success) {
        setSuccess(result.message);
        // Refresh transaction details
        await fetchTxDetails();
        // Refresh pending transactions
        await fetchPendingTransactions();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve transaction");
      console.error("Error approving transaction:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!isConnected || !walletClient || !safeTxHash) {
      setError("Please connect wallet and enter Safe transaction hash");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Execute using walletClient directly (no need for ethers signer)
      const result = await executeSafeTransaction(safeTxHash, walletClient);
      
      const onchainDenUrl = getOnchainDenTransactionUrl(safeAddress || DEFAULT_SAFE_ADDRESS, safeTxHash);
      setSuccess(`Transaction executed! Hash: ${result.txHash}\n\nView on OnchainDen: ${onchainDenUrl}`);
      
      // Refresh transaction details
      fetchTxDetails();
      
      // Update distribution status if this is a distribution transaction
      // This would need to be linked to the distribution ID
    } catch (err: any) {
      setError(err.message || "Failed to execute transaction");
      console.error("Error executing transaction:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Approve Safe Transaction</h1>
        <p className="text-gray-400">
          Approve pending Safe multisig transactions (requires 2 of 3 signatures)
        </p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
          <p className="text-yellow-200">Connect your wallet to approve transactions</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6 flex items-start gap-3">
          <XCircle className="text-red-400 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-400">Error</p>
            <p className="text-red-200 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="text-green-400 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-semibold text-green-400">Success</p>
            <p className="text-green-200 text-sm mt-1 whitespace-pre-line">{success}</p>
            {success.includes("executed") && safeTxHash && (
              <a
                href={getOnchainDenTransactionUrl(safeAddress || DEFAULT_SAFE_ADDRESS, safeTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
              >
                <ExternalLink size={16} />
                View on OnchainDen
              </a>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Safe Address</label>
            <input
              type="text"
              value={safeAddress}
              onChange={(e) => setSafeAddress(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Safe Transaction Hash</label>
            <input
              type="text"
              value={safeTxHash}
              onChange={(e) => setSafeTxHash(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the Safe transaction hash from the distribution proposal
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchTxDetails}
              disabled={loading || !safeTxHash}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Check Status
            </button>
            <button
              onClick={handleApprove}
              disabled={loading || !isConnected || !safeTxHash}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Approve Transaction
                </>
              )}
            </button>
          </div>

          {txDetails && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Transaction Status:</p>
                  <p className="text-white font-semibold">
                    {txDetails.confirmations} of {txDetails.needed} confirmations
                  </p>
                  {txDetails.confirmations >= txDetails.needed && (
                    <p className="text-green-400 text-sm mt-2">✓ Ready to execute</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <a
                    href={getOnchainDenTransactionUrl(safeAddress, safeTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
                    title="OnchainDen only shows executed transactions"
                  >
                    <ExternalLink size={16} />
                    View on OnchainDen
                  </a>
                  <p className="text-xs text-gray-500 text-center">
                    (Available after execution)
                  </p>
                </div>
              </div>
              {txDetails.signatures && txDetails.signatures.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Signatures:</p>
                  <div className="space-y-1">
                    {txDetails.signatures.map((sig: any, idx: number) => (
                      <div key={idx} className="text-xs font-mono text-gray-300">
                        {sig.signer.slice(0, 10)}...{sig.signer.slice(-8)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {txDetails.confirmations >= txDetails.needed && (
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Execute Transaction
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {pendingTransactions.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-3">Pending Transactions:</p>
              <div className="space-y-2">
                {pendingTransactions.map((tx) => (
                  <div
                    key={tx.safeTxHash}
                    className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                    onClick={async () => {
                      setSafeTxHash(tx.safeTxHash);
                      // Fetch transaction details via API
                      const response = await fetch(`/api/safe/transactions?safeTxHash=${tx.safeTxHash}`);
                      if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                          const txData = result.data;
                          setTxDetails({
                            hash: txData.safeTxHash,
                            status: txData.signatures.length >= 2 ? "ready" : "pending",
                            confirmations: txData.signatures.length,
                            needed: 2,
                            signatures: txData.signatures,
                          });
                        }
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-gray-300">
                        {tx.safeTxHash.slice(0, 10)}...{tx.safeTxHash.slice(-8)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {tx.signatures.length}/2 signatures
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Instructions:</strong>
            </p>
            <ol className="text-sm text-blue-200 mt-2 space-y-1 list-decimal list-inside">
              <li>Get the Safe transaction hash from the distribution proposal</li>
              <li>Connect one of your Safe owner wallets</li>
              <li>Enter the transaction hash and click "Approve Transaction"</li>
              <li>Repeat with a second wallet to meet the 2-of-3 threshold</li>
              <li>Once threshold is met, the transaction can be executed</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

