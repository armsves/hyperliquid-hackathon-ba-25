"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Users, Shield, CheckCircle, XCircle, Loader, Copy, RefreshCw } from "lucide-react";
import { getSafeConfig, addSafeOwner, changeSafeThreshold } from "@/lib/safe";
import { walletClientToEthersSigner } from "@/lib/walletToEthers";

// Your existing Safe address
const DEFAULT_SAFE_ADDRESS = "0xf61aeCdF5D19ba4E175b5Bf902332870847A987E";

export default function SafeConfigPage() {
  const { address, isConnected } = useAccount();
  const [safeAddress, setSafeAddress] = useState(DEFAULT_SAFE_ADDRESS);
  const [newOwner, setNewOwner] = useState("");
  const [threshold, setThreshold] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [safeConfig, setSafeConfig] = useState<{ owners: string[]; threshold: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const { data: walletClient } = useWalletClient();

  // Set mounted flag on client side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load Safe config when mounted or safe address changes
  useEffect(() => {
    if (mounted && safeAddress && isConnected) {
      handleLoadConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, safeAddress, isConnected]);

  const handleLoadConfig = async () => {
    if (!safeAddress) {
      setError("Please enter a Safe address");
      return;
    }

    if (!isConnected || !walletClient) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Convert wallet client to ethers signer
      const signer = await walletClientToEthersSigner(walletClient);

      // Get Safe configuration
      const config = await getSafeConfig(safeAddress as `0x${string}`, signer);

      setSafeConfig(config);
      setOwners(config.owners);
      setThreshold(config.threshold);
      setSuccess("Safe configuration loaded");
    } catch (err: any) {
      setError(err.message || "Failed to load Safe config");
      console.error("Error loading Safe config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOwnerToSafe = async () => {
    if (!safeAddress || !newOwner) {
      setError("Safe address and new owner address are required");
      return;
    }

    if (!isConnected || !walletClient) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Convert wallet client to ethers signer
      const signer = await walletClientToEthersSigner(walletClient);

      // Add owner to Safe
      const txHash = await addSafeOwner(
        safeAddress as `0x${string}`,
        newOwner as `0x${string}`,
        signer
      );

      setSuccess(`Owner added. Transaction: ${txHash}`);
      setNewOwner("");
      // Reload config after a delay
      setTimeout(handleLoadConfig, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add owner");
      console.error("Error adding owner:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeThreshold = async () => {
    if (!safeAddress) {
      setError("Safe address is required");
      return;
    }

    if (!isConnected || !walletClient) {
      setError("Please connect your wallet first");
      return;
    }

    if (threshold < 1 || threshold > owners.length) {
      setError(`Threshold must be between 1 and ${owners.length}`);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Convert wallet client to ethers signer
      const signer = await walletClientToEthersSigner(walletClient);

      // Change threshold
      const txHash = await changeSafeThreshold(
        safeAddress as `0x${string}`,
        threshold,
        signer
      );

      setSuccess(`Threshold changed. Transaction: ${txHash}`);
      setTimeout(handleLoadConfig, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to change threshold");
      console.error("Error changing threshold:", err);
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Safe Wallet Configuration</h1>
          <p className="text-gray-400">
            Create and manage Safe multisig wallets for secure token distributions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Safe Wallet Management</h1>
        <p className="text-gray-400">
          View and manage your existing Safe multisig wallet for secure token distributions
        </p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
          <p className="text-yellow-200">Connect your wallet to create or manage Safe wallets</p>
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
          <div>
            <p className="font-semibold text-green-400">Success</p>
            <p className="text-green-200 text-sm mt-1">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safe Information */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield size={24} />
            Safe Wallet Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Safe Address</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={safeAddress}
                  onChange={(e) => setSafeAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(safeAddress);
                    setSuccess("Address copied to clipboard!");
                    setTimeout(() => setSuccess(""), 2000);
                  }}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg"
                  title="Copy address"
                >
                  <Copy size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your existing Safe wallet address
              </p>
            </div>

            <button
              onClick={handleLoadConfig}
              disabled={loading || !safeAddress || !isConnected}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Load Safe Configuration
                </>
              )}
            </button>

            {safeConfig && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Threshold:</span>
                  <span className="ml-2 font-semibold">
                    {safeConfig.threshold} of {safeConfig.owners.length} signers
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-400 block mb-2">Owners:</span>
                  <div className="space-y-2">
                    {safeConfig.owners.map((owner, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-900 rounded">
                        <span className="font-mono text-xs text-gray-300 flex-1">{owner}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(owner);
                            setSuccess("Address copied!");
                            setTimeout(() => setSuccess(""), 2000);
                          }}
                          className="p-1 hover:bg-gray-800 rounded"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manage Safe Settings */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users size={24} />
            Manage Safe Settings
          </h2>

          {!safeConfig ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Load Safe configuration to manage settings</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Add New Owner</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <button
                    onClick={handleAddOwnerToSafe}
                    disabled={loading || !newOwner}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Add a new owner to the Safe (requires multisig approval)
                </p>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Change Threshold: {threshold} of {safeConfig.owners.length}
                </label>
                <input
                  type="range"
                  min="1"
                  max={safeConfig.owners.length}
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full mb-2"
                />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">1 signature</span>
                  <span className="text-xs text-gray-500">{safeConfig.owners.length} signatures</span>
                </div>
                <button
                  onClick={handleChangeThreshold}
                  disabled={loading || threshold === safeConfig.threshold}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
                >
                  Update Threshold
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Number of signatures required to execute transactions (requires multisig approval)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

