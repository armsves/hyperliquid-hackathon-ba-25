"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { formatEther } from "ethers";
import { useNetwork } from "@/lib/networkContext";

interface TransactionLookupProps {
  selectedHash?: string;
  onHashChange?: (hash: string) => void;
}

export default function TransactionLookup({ selectedHash, onHashChange }: TransactionLookupProps) {
  const { network } = useNetwork();
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState("");
  const [functionSignatures, setFunctionSignatures] = useState<string[]>([]);
  const [loadingSignature, setLoadingSignature] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle external hash selection (from table clicks)
  useEffect(() => {
    if (selectedHash && selectedHash !== hash) {
      setHash(selectedHash);
      // Trigger search with the new hash
      searchTransactionWithHash(selectedHash);
      // Scroll to this component
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedHash]);

  const searchTransactionWithHash = async (txHash: string) => {
    if (!txHash || !txHash.startsWith("0x")) {
      setError("Please enter a valid transaction hash");
      return;
    }

    setLoading(true);
    setError("");
    setTransaction(null);
    setFunctionSignatures([]);

    try {
      const response = await fetch(`/api/hyperliquid/transaction/${txHash}?network=${network}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Transaction not found");
      }

      setTransaction(result.data);
      
      // If there's input data, try to fetch function signature
      if (result.data.input && result.data.input !== "0x" && result.data.input.length >= 10) {
        const methodId = result.data.input.slice(0, 10);
        fetchFunctionSignature(methodId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch transaction");
    } finally {
      setLoading(false);
    }
  };

  const fetchFunctionSignature = async (methodId: string) => {
    setLoadingSignature(true);
    try {
      const response = await fetch(`/api/hyperliquid/function-signature/${methodId}`);
      const result = await response.json();
      
      if (result.success && result.data.signatures) {
        setFunctionSignatures(result.data.signatures);
      }
    } catch (err) {
      console.error("Failed to fetch function signature:", err);
    } finally {
      setLoadingSignature(false);
    }
  };

  const searchTransaction = async () => {
    await searchTransactionWithHash(hash);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchTransaction();
    }
  };

  const handleHashChange = (newHash: string) => {
    setHash(newHash);
    if (onHashChange) {
      onHashChange(newHash);
    }
  };

  return (
    <div ref={containerRef} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold mb-4">Transaction Lookup</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={hash}
          onChange={(e) => handleHashChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter transaction hash (0x...)"
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={searchTransaction}
          disabled={loading || !hash}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Search size={18} />
          )}
          Search
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {transaction && (
        <div className="space-y-4">
          {/* Transaction Type Summary */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-800/50">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {getTransactionIcon(transaction)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{getTransactionType(transaction)}</h3>
                <p className="text-sm text-gray-300">{getTransactionDescription(transaction)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-green-500" size={20} />
              <h3 className="text-lg font-semibold">Transaction Details</h3>
            </div>

            <div className="space-y-3">
              <DetailRow label="Hash" value={transaction.hash} copyable />
              <DetailRow label="Block" value={parseInt(transaction.blockNumber, 16).toLocaleString()} />
              <DetailRow label="From" value={transaction.from} copyable />
              <DetailRow label="To" value={transaction.to || "Contract Creation"} copyable={!!transaction.to} />
              <DetailRow 
                label="Value" 
                value={`${formatEther(transaction.value || "0")} HYPE`} 
              />
              <DetailRow 
                label="Gas Limit" 
                value={parseInt(transaction.gas, 16).toLocaleString()} 
              />
              <DetailRow 
                label="Gas Price" 
                value={`${(parseInt(transaction.gasPrice, 16) / 1e9).toFixed(2)} gwei`} 
              />
              <DetailRow label="Nonce" value={parseInt(transaction.nonce, 16).toString()} />
              
              {/* Transaction Input Data */}
              {transaction.input && transaction.input !== "0x" && (
                <div className="pt-3 border-t border-gray-700">
                  <div className="mb-2">
                    <span className="text-gray-400 text-sm font-semibold">Contract Interaction:</span>
                  </div>
                  
                  {/* Function Signature Display */}
                  {loadingSignature ? (
                    <div className="bg-gray-900 rounded p-3 mb-2 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                      <span className="text-sm text-gray-400">Looking up function signature...</span>
                    </div>
                  ) : functionSignatures.length > 0 ? (
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-3 mb-3 border border-purple-700/50">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-lg">🔧</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">Function Called:</p>
                          <p className="font-mono text-sm text-green-400 font-semibold break-all">
                            {functionSignatures[0]}
                          </p>
                          {functionSignatures.length > 1 && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                                {functionSignatures.length - 1} other possible signature{functionSignatures.length > 2 ? 's' : ''}
                              </summary>
                              <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-700">
                                {functionSignatures.slice(1).map((sig, idx) => (
                                  <p key={idx} className="font-mono text-xs text-gray-400 break-all">
                                    {sig}
                                  </p>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded p-3 mb-2">
                      <p className="text-xs text-gray-400">
                        ⚠️ Function signature not found in database
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-gray-900 rounded p-3 font-mono text-xs break-all max-h-32 overflow-y-auto">
                    <span className="text-blue-400 font-bold">{transaction.input.slice(0, 10)}</span>
                    <span className="text-gray-500">{transaction.input.slice(10, 74)}</span>
                    {transaction.input.length > 74 && (
                      <span className="text-gray-600">...{transaction.input.length - 74} more bytes</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Method ID: <span className="text-blue-400 font-mono">{transaction.input.slice(0, 10)}</span>
                    {" "}• Data Length: <span className="text-gray-400">{(transaction.input.length - 2) / 2} bytes</span>
                  </p>
                </div>
              )}
            </div>

            {transaction.receipt && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="font-semibold mb-3">Receipt</h4>
                <div className="space-y-3">
                  <DetailRow 
                    label="Status" 
                    value={
                      <span className={`px-2 py-1 rounded text-sm ${
                        transaction.receipt.status === "0x1" 
                          ? "bg-green-900/30 text-green-400" 
                          : "bg-red-900/30 text-red-400"
                      }`}>
                        {transaction.receipt.status === "0x1" ? "✓ Success" : "✗ Failed"}
                      </span>
                    } 
                  />
                  <DetailRow 
                    label="Gas Used" 
                    value={`${parseInt(transaction.receipt.gasUsed, 16).toLocaleString()} (${((parseInt(transaction.receipt.gasUsed, 16) / parseInt(transaction.gas, 16)) * 100).toFixed(1)}%)`}
                  />
                  <DetailRow 
                    label="Transaction Fee" 
                    value={`${formatEther((BigInt(transaction.receipt.gasUsed) * BigInt(transaction.gasPrice)).toString())} HYPE`}
                  />
                  {transaction.receipt.logs?.length > 0 && (
                    <>
                      <DetailRow 
                        label="Events Emitted" 
                        value={`${transaction.receipt.logs.length} event${transaction.receipt.logs.length !== 1 ? 's' : ''}`} 
                      />
                      <div className="pt-3 border-t border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Event Logs:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {transaction.receipt.logs.map((log: any, idx: number) => (
                            <div key={idx} className="bg-gray-900 rounded p-3 text-xs">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-purple-400 font-semibold">Event #{idx + 1}</span>
                                <span className="text-gray-500">{log.topics?.length || 0} topics</span>
                              </div>
                              <div className="font-mono text-gray-400 break-all">
                                Contract: <span className="text-blue-400">{log.address}</span>
                              </div>
                              {log.topics && log.topics.length > 0 && (
                                <div className="font-mono text-gray-500 mt-1">
                                  Topic 0: <span className="text-green-400">{log.topics[0].slice(0, 18)}...</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions to determine transaction type and description
function getTransactionType(tx: any): string {
  const value = BigInt(tx.value || "0");
  const hasInput = tx.input && tx.input !== "0x";
  const isContractCreation = !tx.to;
  
  if (isContractCreation) {
    return "📝 Contract Creation";
  }
  
  if (value > 0n && hasInput) {
    return "🔄 Token Transfer + Contract Call";
  }
  
  if (value > 0n) {
    return "💸 Native Token Transfer";
  }
  
  if (hasInput) {
    const methodId = tx.input.slice(0, 10);
    // Common method IDs
    if (methodId === "0xa9059cbb") return "🪙 Token Transfer";
    if (methodId === "0x095ea7b3") return "✅ Token Approval";
    if (methodId === "0x23b872dd") return "🔀 Token Transfer From";
    if (methodId === "0x7ff36ab5") return "💱 Swap Exact ETH";
    if (methodId === "0x38ed1739") return "💱 Swap Exact Tokens";
    if (methodId === "0xe8e33700") return "➕ Add Liquidity";
    if (methodId === "0xbaa2abde") return "➖ Remove Liquidity";
    return "🔧 Contract Interaction";
  }
  
  return "📤 Simple Transaction";
}

function getTransactionDescription(tx: any): string {
  const value = BigInt(tx.value || "0");
  const hasInput = tx.input && tx.input !== "0x";
  const isContractCreation = !tx.to;
  
  if (isContractCreation) {
    return "Deploying a new smart contract to the blockchain";
  }
  
  if (value > 0n && hasInput) {
    return `Sending ${formatEther(value.toString())} HYPE while calling a contract function`;
  }
  
  if (value > 0n) {
    return `Direct transfer of ${formatEther(value.toString())} HYPE to another address`;
  }
  
  if (hasInput) {
    const methodId = tx.input.slice(0, 10);
    const dataLength = (tx.input.length - 2) / 2;
    
    if (methodId === "0xa9059cbb") return "Transferring ERC20 tokens to another address";
    if (methodId === "0x095ea7b3") return "Granting permission for a contract to spend tokens";
    if (methodId === "0x23b872dd") return "Transferring tokens on behalf of another address";
    if (methodId === "0x7ff36ab5") return "Swapping native tokens for other tokens on a DEX";
    if (methodId === "0x38ed1739") return "Swapping tokens for other tokens on a DEX";
    if (methodId === "0xe8e33700") return "Adding liquidity to a liquidity pool";
    if (methodId === "0xbaa2abde") return "Removing liquidity from a liquidity pool";
    
    return `Calling a smart contract function with ${dataLength} bytes of data`;
  }
  
  return "A simple transaction without additional data";
}

function getTransactionIcon(tx: any): string {
  const value = BigInt(tx.value || "0");
  const hasInput = tx.input && tx.input !== "0x";
  const isContractCreation = !tx.to;
  
  if (isContractCreation) return "📝";
  if (value > 0n && hasInput) return "🔄";
  if (value > 0n) return "💸";
  if (hasInput) {
    const methodId = tx.input.slice(0, 10);
    if (methodId === "0xa9059cbb" || methodId === "0x23b872dd") return "🪙";
    if (methodId === "0x095ea7b3") return "✅";
    if (methodId === "0x7ff36ab5" || methodId === "0x38ed1739") return "💱";
    if (methodId === "0xe8e33700") return "➕";
    if (methodId === "0xbaa2abde") return "➖";
    return "🔧";
  }
  return "📤";
}

function DetailRow({ 
  label, 
  value, 
  copyable = false 
}: { 
  label: string; 
  value: React.ReactNode; 
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof value === "string") {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-400 text-sm flex-shrink-0">{label}:</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="text-white text-sm font-mono break-all text-right">
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <ExternalLink size={16} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

