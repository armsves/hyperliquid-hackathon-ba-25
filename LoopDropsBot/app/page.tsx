"use client";

import Link from "next/link";
import { Gift, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4 text-white">LoopDrops Bot</h1>
        <p className="text-xl text-gray-400 mb-12">
          Automated distribution list management for LoopDrops & Loyalty Rewards
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Link
            href="/rewards"
            className="bg-gray-900 rounded-lg p-8 border border-gray-800 hover:border-blue-600 transition-colors group"
          >
            <Gift className="w-12 h-12 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2 text-white">Rewards</h2>
            <p className="text-gray-400">
              Upload and manage distribution lists for LoopDrops and Loyalty Rewards
            </p>
          </Link>

          <Link
            href="/safe-config"
            className="bg-gray-900 rounded-lg p-8 border border-gray-800 hover:border-blue-600 transition-colors group"
          >
            <Shield className="w-12 h-12 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2 text-white">Safe Config</h2>
            <p className="text-gray-400">
              Configure and manage Safe multisig wallets for secure transactions
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

