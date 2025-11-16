import { NextRequest, NextResponse } from "next/server";

// In production, this would query a database
// For now, return empty rewards structure
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();

  // Return empty rewards structure
  // Implementation required: integrate with database or rewards tracking system
  const rewards = {
    pending: "0",
    totalEarned: "0",
    lastClaimed: null as string | null,
    history: [],
  };

  return NextResponse.json(rewards);
}

