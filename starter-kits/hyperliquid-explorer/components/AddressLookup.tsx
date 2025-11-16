"use client";

import { useState, useEffect, useRef } from "react";
import { Search, AlertCircle, Wallet, Code, TrendingUp, TrendingDown, Zap, Activity } from "lucide-react";
import { formatEther } from "ethers";
import { useNetwork } from "@/lib/networkContext";

interface AddressLookupProps {
  selectedAddress?: string;
  onAddressChange?: (address: string) => void;
}

export default function AddressLookup({ selectedAddress, onAddressChange }: AddressLookupProps) {
  const { network } = useNetwork();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle external address selection (from table clicks)
  useEffect(() => {
    if (selectedAddress && selectedAddress !== address) {
      setAddress(selectedAddress);
      // Trigger search with the new address
      searchAddressWithValue(selectedAddress);
      // Scroll to this component
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedAddress]);

  const searchAddressWithValue = async (addr: string) => {
    if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
      setError("Please enter a valid address (0x... 42 characters)");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(`/api/hyperliquid/address/${addr}?network=${network}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Address not found");
      }

      setData(result.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch address data");
    } finally {
      setLoading(false);
    }
  };

  const searchAddress = async () => {
    await searchAddressWithValue(address);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchAddress();
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (onAddressChange) {
      onAddressChange(newAddress);
    }
  };

  return (
    <div ref={containerRef} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold mb-4">Address Lookup</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter address (0x...)"
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={searchAddress}
          disabled={loading || !address}
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

      {data && (
        <div className="space-y-4">
          {/* Account Type Badge */}
          <div className={`rounded-lg p-4 border ${data.isContract ? 'bg-purple-900/20 border-purple-700' : 'bg-blue-900/20 border-blue-700'}`}>
            <div className="flex items-center gap-2">
              {data.isContract ? <Code className="text-purple-400" size={20} /> : <Wallet className="text-blue-400" size={20} />}
              <span className="font-semibold">{data.isContract ? '📝 Smart Contract' : '👤 Externally Owned Account (EOA)'}</span>
            </div>
          </div>

          {/* Main Info Card */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="text-blue-500" size={20} />
              <h3 className="text-lg font-semibold">Address Information</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Address:</span>
                <span className="text-white text-sm font-mono break-all">{data.address}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Balance:</span>
                <span className="text-white text-lg font-bold">
                  {formatEther(data.balance)} HYPE
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Transactions:</span>
                <span className="text-white text-sm font-mono">
                  {data.transactionCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Token Balances */}
          {data.tokenBalances && data.tokenBalances.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>💰</span> Token Holdings
              </h3>
              <div className="space-y-2">
                {data.tokenBalances.map((token: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-900 rounded p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {token.symbol[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{token.symbol}</p>
                        <p className="text-xs text-gray-500">{token.address.slice(0, 10)}...</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-green-400">{token.balanceFormatted}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {data.statistics && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity size={20} className="text-yellow-400" />
                Activity Statistics (Last 10 Blocks)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-red-400" />
                    <span className="text-xs text-gray-400">Sent</span>
                  </div>
                  <p className="font-mono font-bold text-sm">{data.statistics.totalSent.toFixed(4)} HYPE</p>
                </div>
                <div className="bg-gray-900 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={16} className="text-green-400" />
                    <span className="text-xs text-gray-400">Received</span>
                  </div>
                  <p className="font-mono font-bold text-sm">{data.statistics.totalReceived.toFixed(4)} HYPE</p>
                </div>
                <div className="bg-gray-900 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className="text-yellow-400" />
                    <span className="text-xs text-gray-400">Gas Spent</span>
                  </div>
                  <p className="font-mono font-bold text-sm">{data.statistics.totalGasSpent.toFixed(6)} HYPE</p>
                </div>
                <div className="bg-gray-900 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Code size={16} className="text-purple-400" />
                    <span className="text-xs text-gray-400">Contracts</span>
                  </div>
                  <p className="font-mono font-bold text-sm">{data.statistics.contractInteractions} unique</p>
                </div>
              </div>

              {/* Top Contract Interactions */}
              {data.statistics.contractAddresses && data.statistics.contractAddresses.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Top Contract Interactions:</p>
                  <div className="space-y-1">
                    {data.statistics.contractAddresses.map((addr: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-gray-500">{idx + 1}.</span>
                        <span className="text-purple-400">{addr.slice(0, 10)}...{addr.slice(-8)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Transactions */}
          {data.recentTransactions && data.recentTransactions.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">📜 Recent Activity</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.recentTransactions.slice(0, 5).map((tx: any, idx: number) => {
                  const isSent = tx.from?.toLowerCase() === data.address.toLowerCase();
                  const value = Number(BigInt(tx.value || "0x0")) / 1e18;
                  return (
                    <div key={idx} className="bg-gray-900 rounded p-3 text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-semibold ${isSent ? 'text-red-400' : 'text-green-400'}`}>
                          {isSent ? '📤 Sent' : '📥 Received'}
                        </span>
                        <span className="text-gray-500">Block {tx.blockNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-gray-400">
                          {isSent ? tx.to : tx.from}
                        </span>
                        <span className="font-mono font-bold">{value.toFixed(4)} HYPE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

