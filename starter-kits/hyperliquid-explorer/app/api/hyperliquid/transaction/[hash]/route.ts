import { NextRequest, NextResponse } from "next/server";
import { getTransactionByHash } from "@/lib/lava";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const { hash } = params;
    const searchParams = request.nextUrl.searchParams;
    const network = (searchParams.get("network") || "mainnet") as "mainnet" | "testnet";
    
    if (!hash || !hash.startsWith("0x")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid transaction hash format",
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
    
    const transaction = await getTransactionByHash(hash, network);
    
    return NextResponse.json({
      success: true,
      data: transaction,
      network,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("API error fetching transaction:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch transaction",
        timestamp: Date.now(),
      },
      { status: error.message.includes("not found") ? 404 : 500 }
    );
  }
}

