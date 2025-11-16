import { NextRequest, NextResponse } from "next/server";
import {
  getAllDistributions,
  createDistribution,
} from "@/lib/distributionStore";

export async function GET(request: NextRequest) {
  const distributions = getAllDistributions();
  return NextResponse.json(distributions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipients, actor } = body;

    if (!type || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate recipients
    for (const recipient of recipients) {
      if (!recipient.address || !recipient.amount || !recipient.token) {
        return NextResponse.json(
          { error: "Invalid recipient format" },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const totalAmount = recipients.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0
    );
    const token = recipients[0]?.token || "LOOP";

    const distribution = createDistribution({
      type,
      recipients,
      status: "pending",
      recipientCount: recipients.length,
      totalAmount: totalAmount.toString(),
      token,
    }, actor || "system");

    return NextResponse.json({ id: distribution.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

