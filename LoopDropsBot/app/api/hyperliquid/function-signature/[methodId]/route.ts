import { NextResponse } from "next/server";
import { lookupFunctionSignature } from "@/lib/lava";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

export async function GET(
  request: Request,
  { params }: { params: { methodId: string } }
) {
  try {
    const { methodId } = params;
    
    if (!methodId || (!methodId.startsWith("0x") && methodId.length !== 8)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid method ID format",
        },
        { status: 400 }
      );
    }
    
    const signatures = await lookupFunctionSignature(methodId);
    
    return NextResponse.json({
      success: true,
      data: {
        methodId,
        signatures,
        found: signatures.length > 0,
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("API error fetching function signature:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch function signature",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

