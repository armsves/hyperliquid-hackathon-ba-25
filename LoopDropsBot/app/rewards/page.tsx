"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Upload, FileText, CheckCircle, Clock, XCircle, RefreshCw, History, User, ExternalLink } from "lucide-react";
import { uploadDistributionList, getDistributions } from "@/lib/rewards";
import { createBatchTransferTransaction } from "@/lib/safe";
import { walletClientToEthersSigner } from "@/lib/walletToEthers";
import { getOnchainDenTransactionUrl } from "@/lib/onchainden";

const TOKEN_ADDRESSES: Record<string, string> = {
  LOOP: "0x00fdbc53719604d924226215bc871d55e40a1009",
  LEND: "0x0000000000000000000000000000000000000000", // Replace with actual
};

export default function RewardsPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [mounted, setMounted] = useState(false);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [distributionType, setDistributionType] = useState<"loopdrops" | "loyalty">("loopdrops");
  const [safeAddress, setSafeAddress] = useState<string>("0xf61aeCdF5D19ba4E175b5Bf902332870847A987E");
  const [activeTab, setActiveTab] = useState<"distributions" | "entitlements" | "audit">("distributions");
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedDistribution, setSelectedDistribution] = useState<string | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [showTxSuccess, setShowTxSuccess] = useState(false);
  const [createdTxHash, setCreatedTxHash] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected) {
      fetchDistributions();
      fetchEntitlements();
      fetchAuditLogs();
      fetchPendingTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isConnected, address]);

  const fetchPendingTransactions = async () => {
    try {
      const response = await fetch(`/api/safe/transactions?safeAddress=${safeAddress}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPendingTransactions(result.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
    }
  };

  useEffect(() => {
    if (selectedDistribution) {
      fetchAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistribution]);

  const fetchEntitlements = async () => {
    try {
      const response = await fetch(`/api/rewards/entitlements${address ? `?address=${address}` : ""}`);
      const data = await response.json();
      setEntitlements(data || []);
    } catch (error) {
      console.error("Error fetching entitlements:", error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const url = selectedDistribution 
        ? `/api/rewards/audit?distributionId=${selectedDistribution}`
        : "/api/rewards/audit";
      const response = await fetch(url);
      const data = await response.json();
      setAuditLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const data = await getDistributions();
      setDistributions(data || []);
    } catch (error) {
      console.error("Error fetching distributions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    try {
      const text = await uploadedFile.text();
      const data = parseDistributionFile(text, uploadedFile.name);
      
      const result = await uploadDistributionList(data, distributionType, address || undefined);
      alert(`Distribution list uploaded! ID: ${result.id}`);
      fetchDistributions();
      fetchEntitlements();
      fetchAuditLogs();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const parseDistributionFile = (content: string, filename: string) => {
    const lines = content.trim().split("\n");
    const isCSV = filename.endsWith(".csv");
    
    if (isCSV) {
      const headers = lines[0].split(",").map((h) => h.trim());
      const addressIdx = headers.findIndex((h) => h.toLowerCase().includes("address"));
      const amountIdx = headers.findIndex((h) => h.toLowerCase().includes("amount"));
      const tokenIdx = headers.findIndex((h) => h.toLowerCase().includes("token"));

      return lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        return {
          address: values[addressIdx],
          amount: values[amountIdx],
          token: values[tokenIdx] || "LOOP",
        };
      });
    } else {
      // JSON format
      return JSON.parse(content);
    }
  };

  const handlePropose = async (distributionId: string) => {
    if (!isConnected || !walletClient) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      
      // Fetch distribution from API
      const distributions = await getDistributions();
      const distribution = distributions.find(d => d.id === distributionId);
      
      if (!distribution) {
        console.error("Distribution not found:", distributionId);
        console.log("Available distributions:", distributions.map(d => ({ id: d.id, status: d.status })));
        alert(`Distribution not found: ${distributionId}\n\nThis can happen if the server restarted (in-memory store was reset).\n\nPlease create a new distribution or refresh the page.`);
        fetchDistributions(); // Refresh the list
        return;
      }

      if (distribution.status !== "pending") {
        alert("Distribution already processed");
        return;
      }

      // Use provided Safe address
      const safeAddr = safeAddress || "0xf61aeCdF5D19ba4E175b5Bf902332870847A987E";
      if (!safeAddr) {
        alert("Safe address is required");
        return;
      }

      // Get token address
      const tokenAddress = TOKEN_ADDRESSES[distribution.token] || TOKEN_ADDRESSES.LOOP;
      if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
        alert(`Token address not configured for ${distribution.token}`);
        return;
      }

      // Convert wallet client to ethers signer (for provider access)
      const signer = await walletClientToEthersSigner(walletClient);

      // Create batch transfer transaction using direct contract interaction
      // Pass walletClient for signing (not the ethers signer)
      console.log("Creating transaction for distribution:", distributionId);
      const safeTxHash = await createBatchTransferTransaction(
        safeAddr as `0x${string}`,
        tokenAddress as `0x${string}`,
        distribution.recipients,
        signer,
        walletClient // Pass walletClient for signing
      );
      console.log("Transaction created successfully:", safeTxHash);

      // Try to update distribution via API (optional - transaction is already stored)
      try {
        const response = await fetch(`/api/rewards/distributions/${distributionId}/propose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            safeAddress: safeAddr,
            txHash: safeTxHash,
            actor: address || "unknown",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.warn("Failed to update distribution status:", error.error);
          // Don't throw - transaction is already created and stored
        }
      } catch (updateError: any) {
        console.warn("Failed to update distribution status:", updateError.message);
        // Don't throw - transaction is already created and stored
      }

      // Show success message with copyable hash
      setCreatedTxHash(safeTxHash);
      setShowTxSuccess(true);
      
      fetchDistributions();
      fetchAuditLogs();
      fetchPendingTransactions();
    } catch (error: any) {
      console.error("Error proposing distribution:", error);
      alert(`Error: ${error.message || "Failed to propose transaction"}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded text-xs flex items-center gap-1">
            <Clock size={12} />
            Pending
          </span>
        );
      case "proposed":
        return (
          <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs flex items-center gap-1">
            <FileText size={12} />
            Proposed
          </span>
        );
      case "executed":
        return (
          <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs flex items-center gap-1">
            <CheckCircle size={12} />
            Executed
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs flex items-center gap-1">
            <XCircle size={12} />
            Failed
          </span>
        );
      default:
        return <span className="text-xs text-gray-400">{status}</span>;
    }
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">LoopDrops & Loyalty Rewards</h1>
          <p className="text-gray-400">Manage token distributions with multisig integration</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">LoopDrops & Loyalty Rewards</h1>
        <p className="text-gray-400">Manage token distributions with multisig integration</p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
          <p className="text-yellow-200">Connect your wallet to manage distributions</p>
        </div>
      )}

      {showTxSuccess && createdTxHash && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-green-200 font-semibold mb-2">Transaction Created Successfully!</h3>
              <p className="text-green-300 text-sm mb-3">
                Your transaction has been created and signed. Share this hash with other Safe signers to approve.
              </p>
              <p className="text-yellow-300 text-xs mb-3 bg-yellow-900/20 p-2 rounded">
                <strong>Note:</strong> This transaction will only appear on OnchainDen after it's executed on-chain. 
                You need 2 out of 3 signatures to execute. Once executed, OnchainDen will automatically index it.
              </p>
              <div className="bg-gray-900 rounded p-3 mb-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-300 font-mono flex-1 break-all">{createdTxHash}</code>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(createdTxHash);
                        alert("Transaction hash copied to clipboard!");
                      } catch (err) {
                        console.error("Failed to copy:", err);
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm whitespace-nowrap"
                    title="Copy transaction hash"
                  >
                    <FileText size={14} className="inline mr-1" />
                    Copy Hash
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/approve-transaction?txHash=${createdTxHash}`}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Approve with Another Wallet
                </a>
                <a
                  href={`/approve-transaction?txHash=${createdTxHash}`}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  Execute Transaction (after 2 signatures)
                </a>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                OnchainDen link will be available after execution. Transactions are indexed from the blockchain automatically.
              </p>
            </div>
            <button
              onClick={() => {
                setShowTxSuccess(false);
                setCreatedTxHash(null);
              }}
              className="text-gray-400 hover:text-gray-200 ml-4"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Upload Distribution List</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Safe Wallet Address (Optional)</label>
              <input
                type="text"
                value={safeAddress}
                onChange={(e) => setSafeAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set your Safe wallet address to reuse for proposals
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Distribution Type</label>
              <select
                value={distributionType}
                onChange={(e) => setDistributionType(e.target.value as "loopdrops" | "loyalty")}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="loopdrops">LoopDrops</option>
                <option value="loyalty">Loyalty Rewards</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Upload File (CSV or JSON)</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-gray-300">Click to upload or drag and drop</span>
                  <span className="text-xs text-gray-500">CSV or JSON format</span>
                </label>
              </div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Expected format:</p>
              <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded">
{`CSV: address,amount,token
JSON: [{"address": "...", "amount": "100", "token": "LOOP"}]`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Distribution Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Total Distributions</span>
              <span className="text-xl font-bold">{distributions.length}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Pending</span>
              <span className="text-xl font-bold text-yellow-400">
                {distributions.filter((d) => d.status === "pending").length}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Executed</span>
              <span className="text-xl font-bold text-green-400">
                {distributions.filter((d) => d.status === "executed").length}
              </span>
            </div>
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Distributions are executed via multisig wallet (Safe/Onchainden) for security.
              </p>
            </div>
            <button
              onClick={async () => {
                if (!isConnected) {
                  alert("Please connect your wallet first");
                  return;
                }
                try {
                  setLoading(true);
                  // Create test distribution with your Safe owners as recipients
                  const testRecipients = [
                    { address: "0x6BbFd1F6dC17322a6e8923cf8072a735A081a975", amount: "1000", token: "LOOP" },
                    { address: "0x0DBA585a86bb828708b14d2F83784564Ae03a5d0", amount: "2000", token: "LOOP" },
                    { address: "0xB3D6f8C9BE8c7c4aE9aE5f124f7a70C285d3c076", amount: "1500", token: "LOOP" },
                  ];
                  const result = await uploadDistributionList(testRecipients, "loopdrops", address || undefined);
                  alert(`Test distribution created! ID: ${result.id}\n\nYou can now propose this transaction.`);
                  fetchDistributions();
                  fetchEntitlements();
                  fetchAuditLogs();
                } catch (error: any) {
                  alert(`Error: ${error.message}`);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !isConnected}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 text-sm font-semibold mb-2"
            >
              Create Test Distribution (3 recipients)
            </button>
            <button
              onClick={async () => {
                if (!isConnected) {
                  alert("Please connect your wallet first");
                  return;
                }
                try {
                  setLoading(true);
                  // Create single-recipient test: 0.02 LOOP to one address
                  const testRecipients = [
                    { address: "0x6BbFd1F6dC17322a6e8923cf8072a735A081a975", amount: "0.02", token: "LOOP" },
                  ];
                  const result = await uploadDistributionList(testRecipients, "loopdrops", address || undefined);
                  alert(`Test distribution created! ID: ${result.id}\n\nYou can now propose this transaction.`);
                  fetchDistributions();
                  fetchEntitlements();
                  fetchAuditLogs();
                } catch (error: any) {
                  alert(`Error: ${error.message}`);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !isConnected}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 text-sm font-semibold"
            >
              Quick Test: Send 0.02 LOOP
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 mb-6">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => { setActiveTab("distributions"); setSelectedDistribution(null); fetchAuditLogs(); }}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === "distributions"
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FileText size={18} className="inline mr-2" />
            Distributions
          </button>
          <button
            onClick={() => { setActiveTab("entitlements"); fetchEntitlements(); }}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === "entitlements"
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <User size={18} className="inline mr-2" />
            Entitlements
          </button>
          <button
            onClick={() => { setActiveTab("audit"); fetchAuditLogs(); }}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === "audit"
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <History size={18} className="inline mr-2" />
            Audit Trail
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        {activeTab === "distributions" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Distribution History</h2>
              <button
                onClick={fetchDistributions}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : distributions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400">ID</th>
                  <th className="text-left py-3 px-4 text-gray-400">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400">Recipients</th>
                  <th className="text-left py-3 px-4 text-gray-400">Total Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400">Transaction</th>
                  <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((dist) => (
                  <tr key={dist.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono text-sm">{dist.id}</td>
                    <td className="py-3 px-4 capitalize">{dist.type}</td>
                    <td className="py-3 px-4">{dist.recipientCount || 0}</td>
                    <td className="py-3 px-4">
                      {dist.totalAmount} {dist.token || "LOOP"}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(dist.status)}</td>
                    <td className="py-3 px-4">
                      {dist.safeTxHash ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-400">
                            {dist.safeTxHash.slice(0, 8)}...{dist.safeTxHash.slice(-6)}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(dist.safeTxHash);
                                alert("Transaction hash copied to clipboard!");
                              } catch (err) {
                                console.error("Failed to copy:", err);
                              }
                            }}
                            className="text-gray-500 hover:text-gray-300"
                            title="Copy transaction hash"
                          >
                            <FileText size={12} />
                          </button>
                          <span 
                            className="text-xs text-gray-500" 
                            title="OnchainDen only shows executed transactions. Link will work after execution."
                          >
                            (OnchainDen after exec)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {dist.status === "pending" && (
                          <button
                            onClick={() => handlePropose(dist.id)}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
                          >
                            Propose
                          </button>
                        )}
                        {dist.safeTxHash && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedDistribution(dist.id);
                                setActiveTab("audit");
                                fetchAuditLogs();
                              }}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                              title="View audit trail"
                            >
                              <History size={14} />
                            </button>
                            <a
                              href={`/approve-transaction?txHash=${dist.safeTxHash}`}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                              title="Approve transaction"
                            >
                              Approve
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No distributions yet</p>
        )}
          </>
        )}

        {activeTab === "entitlements" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {address ? "Your Entitlements" : "All Entitlements"}
              </h2>
              <button
                onClick={fetchEntitlements}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            {entitlements.length > 0 ? (
              <div className="space-y-4">
                {entitlements.map((entitlement, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm text-gray-300">{entitlement.address}</p>
                        <div className="flex gap-4 mt-2">
                          <div>
                            <span className="text-xs text-gray-400">Pending: </span>
                            <span className="text-yellow-400 font-semibold">
                              {entitlement.totalPending} LOOP
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">Earned: </span>
                            <span className="text-green-400 font-semibold">
                              {entitlement.totalEarned} LOOP
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">Distributions ({entitlement.distributions.length}):</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {entitlement.distributions.map((dist: any, dIdx: number) => (
                          <div key={dIdx} className="flex justify-between text-xs">
                            <span className="text-gray-300">
                              {dist.type} - {getStatusBadge(dist.status)}
                            </span>
                            <span className="text-gray-400">{dist.amount} {dist.token}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No entitlements found</p>
            )}
          </>
        )}

        {activeTab === "audit" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Audit Trail {selectedDistribution && `- ${selectedDistribution}`}
              </h2>
              <div className="flex gap-2">
                {selectedDistribution && (
                  <button
                    onClick={() => {
                      setSelectedDistribution(null);
                      fetchAuditLogs();
                    }}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    Clear Filter
                  </button>
                )}
                <button
                  onClick={fetchAuditLogs}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.action === "created" ? "bg-blue-900/30 text-blue-400" :
                            log.action === "proposed" ? "bg-purple-900/30 text-purple-400" :
                            log.action === "executed" ? "bg-green-900/30 text-green-400" :
                            log.action === "failed" ? "bg-red-900/30 text-red-400" :
                            "bg-gray-700 text-gray-300"
                          }`}>
                            {log.action.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-1">{log.details}</p>
                        <p className="text-xs text-gray-500 font-mono">Distribution: {log.distributionId}</p>
                        <p className="text-xs text-gray-500 font-mono">Actor: {log.actor}</p>
                        {log.txHash && (
                          <p className="text-xs text-blue-400 font-mono mt-1">
                            Tx: {log.txHash.slice(0, 10)}...{log.txHash.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No audit logs found</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

