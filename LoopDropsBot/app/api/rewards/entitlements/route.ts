import { NextRequest, NextResponse } from "next/server";
import { getEntitlements } from "@/lib/distributionStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    
    const entitlements = getEntitlements(address || undefined);
    return NextResponse.json(entitlements);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

