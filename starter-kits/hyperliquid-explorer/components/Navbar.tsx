"use client";

import Link from "next/link";
import { ChevronDown, Clock, RefreshCw } from "lucide-react";
import { useNetwork } from "@/lib/networkContext";
import { useState, useRef, useEffect } from "react";

interface NavbarProps {
  lastUpdated?: Date | null;
  autoRefresh?: boolean;
  onAutoRefreshToggle?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function Navbar({ 
  lastUpdated, 
  autoRefresh = true, 
  onAutoRefreshToggle, 
  onRefresh,
  loading = false 
}: NavbarProps) {
  const { network, setNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const networks = [
    { value: "mainnet" as const, label: "Hyperliquid Mainnet" },
    { value: "testnet" as const, label: "Hyperliquid Testnet" },
  ];

  const selectedNetwork = networks.find((n) => n.value === network) || networks[0];

  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex flex-col">
              <span className="text-2xl font-bold text-white">Hyperliquid Explorer</span>
              <span className="text-sm text-gray-400">Real-time onchain activity monitoring powered by Lava Network</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Clock size={16} />
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            {onAutoRefreshToggle && (
              <button
                onClick={onAutoRefreshToggle}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  autoRefresh 
                    ? "bg-green-900/20 border-green-700 text-green-400" 
                    : "bg-gray-800 border-gray-700 text-gray-400"
                }`}
                title={autoRefresh ? "Auto-refresh enabled" : "Auto-refresh disabled"}
              >
                <RefreshCw size={16} className={autoRefresh ? "animate-spin-slow" : ""} />
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
              >
                Refresh Now
              </button>
            )}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white transition-colors"
              >
                <span className="text-sm font-medium">{selectedNetwork.label}</span>
                <ChevronDown size={16} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {networks.map((net) => (
                      <button
                        key={net.value}
                        onClick={() => {
                          setNetwork(net.value);
                          setIsOpen(false);
                          // Reload page to update data
                          window.location.reload();
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          network === net.value
                            ? "bg-blue-600 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                      >
                        {net.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

