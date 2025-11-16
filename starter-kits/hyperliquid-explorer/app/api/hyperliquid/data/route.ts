import { NextRequest, NextResponse } from "next/server";
import { getHyperliquidData } from "@/lib/lava";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = (searchParams.get("network") || "mainnet") as "mainnet" | "testnet";
    
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
    
    const data = await getHyperliquidData(network);
    
    return NextResponse.json({
      success: true,
      data,
      network,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("API error fetching Hyperliquid data:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch data",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

