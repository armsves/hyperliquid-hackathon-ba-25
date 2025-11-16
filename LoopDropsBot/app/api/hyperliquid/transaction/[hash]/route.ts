import { NextResponse } from "next/server";
import { getTransactionByHash } from "@/lib/lava";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { hash: string } }
) {
  try {
    const { hash } = params;
    
    if (!hash || !hash.startsWith("0x")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid transaction hash format",
        },
        { status: 400 }
      );
    }
    
    const transaction = await getTransactionByHash(hash);
    
    return NextResponse.json({
      success: true,
      data: transaction,
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

