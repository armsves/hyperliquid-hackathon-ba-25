"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import { Activity, Users, TrendingUp, DollarSign, Zap, Clock, Copy, CheckCircle } from "lucide-react";
import { formatEther } from "ethers";
import TransactionLookup from "@/components/TransactionLookup";
import AddressLookup from "@/components/AddressLookup";
import { useNetwork } from "@/lib/networkContext";
import { Navbar } from "@/components/Navbar";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { network } = useNetwork();
  const [txData, setTxData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    activeUsers: 0,
    totalVolume: "0",
    avgGasPrice: "0",
    latestBlock: 0,
    blockTime: 0,
    totalGasUsed: "0",
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTxHash, setSelectedTxHash] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [copiedAddress, setCopiedAddress] = useState<string>("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/hyperliquid/data?network=${network}`, {
        cache: "no-store",
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        setTxData(data.transactions || []);
        setStats({
          totalTransactions: data.transactions?.length || 0,
          activeUsers: data.uniqueUsers || 0,
          totalVolume: data.totalVolume || "0",
          avgGasPrice: data.avgGasPrice || "0",
          latestBlock: data.latestBlock || 0,
          blockTime: data.blockTime || 0,
          totalGasUsed: data.totalGasUsed || "0",
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching Hyperliquid data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, network]);

  const chartData = txData.slice(0, 20).map((tx, idx) => {
    const gasUsed = parseInt(tx.gasUsed || tx.gas || "0", 16);
    // Convert hex value to decimal
    let value = 0;
    try {
      const hexValue = tx.value || "0x0";
      value = Number(BigInt(hexValue)) / 1e18;
    } catch (e) {
      value = 0;
    }
    return {
      index: idx + 1,
      gas: isNaN(gasUsed) ? 0 : gasUsed,
      value: value,
    };
  });

  // Group transactions by time buckets for better visualization
  const volumeData = txData.reduce((acc: any, tx) => {
    const timestamp = tx.timestamp || Math.floor(Date.now() / 1000);
    const timeKey = new Date(timestamp * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    if (!acc[timeKey]) {
      acc[timeKey] = { volume: 0, count: 0 };
    }
    // Convert hex value to decimal
    try {
      const hexValue = tx.value || "0x0";
      acc[timeKey].volume += Number(BigInt(hexValue)) / 1e18;
    } catch (e) {
      // Skip invalid values
    }
    acc[timeKey].count += 1;
    return acc;
  }, {});

  const volumeChartData = Object.entries(volumeData).map(([time, data]: [string, any]) => ({
    time,
    volume: data.volume,
    count: data.count,
  })).slice(-15); // Last 15 time buckets

  const gasChartData = txData.slice(0, 15).map((tx, idx) => {
    const gasPrice = parseInt(tx.gasPrice || "0", 16);
    return {
      index: idx + 1,
      gasPrice: isNaN(gasPrice) ? 0 : gasPrice / 1e9, // Convert to gwei
    };
  });

  return (
    <>
      <Navbar
        lastUpdated={lastUpdated}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
        onRefresh={fetchData}
        loading={loading}
      />
      <div className="container mx-auto px-4 py-8">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Activity}
          title="Recent Transactions"
          value={stats.totalTransactions.toLocaleString()}
          subtitle="Last 10 blocks"
          trend="+5.2%"
        />
        <StatCard
          icon={Users}
          title="Unique Addresses"
          value={stats.activeUsers.toLocaleString()}
          subtitle="Active participants"
          trend="+2.8%"
        />
        <StatCard
          icon={DollarSign}
          title="Total Volume"
          value={`${formatEther(stats.totalVolume)} HYPE`}
          subtitle="Transaction value"
        />
        <StatCard
          icon={TrendingUp}
          title="Latest Block"
          value={stats.latestBlock.toLocaleString()}
          subtitle={stats.blockTime > 0 ? `~${stats.blockTime}s block time` : "Calculating..."}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Zap}
          title="Avg Gas Price"
          value={`${stats.avgGasPrice} gwei`}
          subtitle="Network average"
        />
        <StatCard
          icon={Activity}
          title="Total Gas Used"
          value={(BigInt(stats.totalGasUsed) / BigInt(1000000)).toString()}
          subtitle="Million gas units"
        />
        <StatCard
          icon={Clock}
          title="Block Time"
          value={stats.blockTime > 0 ? `${stats.blockTime}s` : "N/A"}
          subtitle="Average per block"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Transaction Value (HYPE)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="index" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value: number) => [`${value.toFixed(4)} HYPE`, "Value"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Gas Price Trend (gwei)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gasChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="index" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value: number) => [`${value.toFixed(2)} gwei`, "Gas Price"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gasPrice" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <TransactionLookup 
              selectedHash={selectedTxHash}
              onHashChange={(hash) => setSelectedTxHash(hash)}
            />
            <AddressLookup 
              selectedAddress={selectedAddress}
              onAddressChange={(addr) => setSelectedAddress(addr)}
            />
          </div>
        </>
      )}

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-gray-400 text-sm">Block</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm">Hash</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm">From</th>
                <th className="text-left py-3 px-4 text-gray-400 text-sm">To</th>
                <th className="text-right py-3 px-4 text-gray-400 text-sm">Value (HYPE)</th>
                <th className="text-right py-3 px-4 text-gray-400 text-sm">Gas Price</th>
                <th className="text-right py-3 px-4 text-gray-400 text-sm">Time</th>
              </tr>
            </thead>
            <tbody>
              {txData.slice(0, 15).map((tx, idx) => {
                const blockNum = parseInt(tx.blockNumber || "0", 16);
                const gasPrice = parseInt(tx.gasPrice || "0", 16) / 1e9;
                // Convert hex value to decimal
                let value = 0;
                try {
                  value = Number(BigInt(tx.value || "0x0")) / 1e18;
                } catch (e) {
                  value = 0;
                }
                const timestamp = tx.timestamp ? new Date(tx.timestamp * 1000) : null;
                
                return (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-sm text-blue-400">
                      {blockNum.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      <span 
                        className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer" 
                        title={`Click to view details: ${tx.hash}`}
                        onClick={() => setSelectedTxHash(tx.hash)}
                      >
                        {tx.hash?.slice(0, 10)}...
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-purple-400 hover:text-purple-300 hover:underline cursor-pointer" 
                          title={`Click to lookup: ${tx.from}`}
                          onClick={() => setSelectedAddress(tx.from)}
                        >
                          {tx.from?.slice(0, 6)}...{tx.from?.slice(-4)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.from)}
                          className="text-gray-500 hover:text-white transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === tx.from ? (
                            <CheckCircle size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {tx.to ? (
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-purple-400 hover:text-purple-300 hover:underline cursor-pointer" 
                            title={`Click to lookup: ${tx.to}`}
                            onClick={() => setSelectedAddress(tx.to)}
                          >
                            {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(tx.to)}
                            className="text-gray-500 hover:text-white transition-colors"
                            title="Copy address"
                          >
                            {copiedAddress === tx.to ? (
                              <CheckCircle size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">Contract Creation</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {value.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {gasPrice.toFixed(2)} gwei
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-gray-400">
                      {timestamp ? timestamp.toLocaleTimeString() : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <Icon className="text-blue-500" size={24} />
        {trend && (
          <span className="text-xs text-green-400 font-medium">{trend}</span>
        )}
      </div>
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <span className="text-xs text-gray-500">{subtitle}</span>
    </div>
  );
}

