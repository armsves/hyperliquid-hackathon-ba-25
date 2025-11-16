import { NextRequest, NextResponse } from "next/server";
import {
  getDistributionById,
  updateDistribution,
  getAllDistributions,
} from "@/lib/distributionStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Next.js 15 (Promise) and Next.js 14 (direct) params
    const resolvedParams = params instanceof Promise ? await params : params;
    const distributionId = resolvedParams.id;
    const body = await request.json();
    const { safeAddress, txHash } = body;

    // Validate inputs
    if (!safeAddress) {
      return NextResponse.json(
        { error: "Safe address is required" },
        { status: 400 }
      );
    }

    if (!txHash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 }
      );
    }

    const distribution = getDistributionById(distributionId);

    if (!distribution) {
      console.error(`Distribution not found: ${distributionId}`);
      console.log("Available distributions:", getAllDistributions().map(d => d.id));
      return NextResponse.json(
        { error: `Distribution not found: ${distributionId}` },
        { status: 404 }
      );
    }

    if (distribution.status !== "pending") {
      return NextResponse.json(
        { error: "Distribution already processed" },
        { status: 400 }
      );
    }

    // Get actor from request headers or body
    const actor = body.actor || "unknown";

    // Update distribution status with the transaction hash from client
    const updated = updateDistribution(distributionId, {
      status: "proposed",
      proposedAt: new Date().toISOString(),
      safeTxHash: txHash,
      safeAddress: safeAddress,
      proposerAddress: actor,
    }, actor);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update distribution" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      txHash: txHash,
      safeAddress,
      message: "Transaction proposed to Safe successfully",
    });
  } catch (error: any) {
    console.error("Error proposing distribution:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

