import { NextRequest, NextResponse } from "next/server";
import { createSafeWallet } from "@/lib/safe";
import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owners, threshold, signerPrivateKey } = body;

    // Validate inputs
    if (!owners || !Array.isArray(owners) || owners.length === 0) {
      return NextResponse.json(
        { error: "At least one owner address is required" },
        { status: 400 }
      );
    }

    if (!threshold || threshold < 1 || threshold > owners.length) {
      return NextResponse.json(
        { error: `Threshold must be between 1 and ${owners.length}` },
        { status: 400 }
      );
    }

    if (!signerPrivateKey) {
      return NextResponse.json(
        { error: "Signer private key is required" },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json(
        { error: "RPC URL not configured. Set NEXT_PUBLIC_RPC_URL environment variable" },
        { status: 500 }
      );
    }

    // Create signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(signerPrivateKey, provider);

    // Create Safe wallet
    const { safeAddress } = await createSafeWallet(
      owners as `0x${string}`[],
      threshold,
      signer
    );

    return NextResponse.json({
      safeAddress,
      owners,
      threshold,
      message: "Safe wallet created successfully",
    });
  } catch (error: any) {
    console.error("Error creating Safe wallet:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

