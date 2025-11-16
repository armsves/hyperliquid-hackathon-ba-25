import { NextRequest, NextResponse } from "next/server";
import { getBalance, getTransactionCount, getAddressTransactions, getCode, getTokenBalance } from "@/lib/lava";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Common token addresses on Hyperliquid (you can expand this list)
const COMMON_TOKENS = [
  { address: "0x5555555555555555555555555555555555555555", symbol: "PURR", decimals: 18 },
  { address: "0x2222222222222222222222222222222222222222", symbol: "SPOT", decimals: 18 },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const searchParams = request.nextUrl.searchParams;
    const network = (searchParams.get("network") || "mainnet") as "mainnet" | "testnet";
    
    if (!address || !address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address format",
        },
        { status: 400 }
      );
    }
    
    // Validate network parameter
    if (network !== "mainnet" && network !== "testnet") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid network parameter. Must be 'mainnet' or 'testnet'",
        },
        { status: 400 }
      );
    }
    
    // Fetch basic info in parallel
    const [balance, transactionCount, code, recentTransactions] = await Promise.all([
      getBalance(address, network),
      getTransactionCount(address, network),
      getCode(address, network),
      getAddressTransactions(address, 10, network) // Get last 10 blocks of transactions
    ]);
    
    const isContract = code !== "0x" && code !== "0x0";
    
    // Try to fetch common token balances
    const tokenBalances = await Promise.all(
      COMMON_TOKENS.map(async (token) => {
        try {
          const balance = await getTokenBalance(token.address, address, network);
          const balanceNum = BigInt(balance);
          return {
            ...token,
            balance: balance,
            balanceFormatted: (Number(balanceNum) / Math.pow(10, token.decimals)).toFixed(4)
          };
        } catch (error) {
          return {
            ...token,
            balance: "0x0",
            balanceFormatted: "0"
          };
        }
      })
    );
    
    // Calculate statistics
    const totalSent = recentTransactions
      .filter((tx: any) => tx.from?.toLowerCase() === address.toLowerCase())
      .reduce((sum, tx) => sum + Number(BigInt(tx.value || "0x0")), 0) / 1e18;
    
    const totalReceived = recentTransactions
      .filter((tx: any) => tx.to?.toLowerCase() === address.toLowerCase())
      .reduce((sum, tx) => sum + Number(BigInt(tx.value || "0x0")), 0) / 1e18;
    
    const totalGasSpent = recentTransactions
      .filter((tx: any) => tx.from?.toLowerCase() === address.toLowerCase())
      .reduce((sum, tx) => {
        const gasUsed = parseInt(tx.gasUsed || tx.gas || "0", 16);
        const gasPrice = parseInt(tx.gasPrice || "0", 16);
        return sum + (gasUsed * gasPrice);
      }, 0) / 1e18;
    
    // Get unique contracts interacted with
    const contractInteractions = recentTransactions
      .filter((tx: any) => tx.to && tx.to !== address && tx.input && tx.input !== "0x")
      .map((tx: any) => tx.to)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
    
    return NextResponse.json({
      success: true,
      data: {
        address,
        balance,
        transactionCount,
        isContract,
        recentTransactions,
        tokenBalances: tokenBalances.filter(t => parseFloat(t.balanceFormatted) > 0),
        statistics: {
          totalSent,
          totalReceived,
          totalGasSpent,
          contractInteractions: contractInteractions.length,
          contractAddresses: contractInteractions.slice(0, 5), // Top 5
          recentTxCount: recentTransactions.length
        }
      },
      network,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("API error fetching address data:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch address data",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

