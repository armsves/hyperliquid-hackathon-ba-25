import { NextRequest, NextResponse } from "next/server";
import { getSafeConfig } from "@/lib/safe";
import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { safeAddress, signerPrivateKey } = body;

    if (!safeAddress) {
      return NextResponse.json(
        { error: "Safe address is required" },
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
        { error: "RPC URL not configured" },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(signerPrivateKey, provider);

    const config = await getSafeConfig(safeAddress as `0x${string}`, signer);

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Error fetching Safe config:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

