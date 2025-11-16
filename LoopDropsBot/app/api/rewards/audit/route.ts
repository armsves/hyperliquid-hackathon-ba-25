import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/distributionStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const distributionId = searchParams.get("distributionId");
    
    const logs = getAuditLogs(distributionId || undefined);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

