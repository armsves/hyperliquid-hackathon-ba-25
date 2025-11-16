import { NextResponse } from "next/server";
import { getAllSafeTransactions, getSafeTransaction } from "@/lib/safeTransactionStore";

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const safeAddress = searchParams.get("safeAddress");
    const safeTxHash = searchParams.get("safeTxHash");

    if (safeTxHash) {
      // Get specific transaction
      // Try exact match first
      let transaction = getSafeTransaction(safeTxHash);
      
      // If not found, try case-insensitive match
      if (!transaction) {
        const allTxs = getAllSafeTransactions();
        transaction = allTxs.find(tx => 
          tx.safeTxHash.toLowerCase() === safeTxHash.toLowerCase()
        );
      }
      
      if (!transaction) {
        // Debug: log all available transactions
        const allTxs = getAllSafeTransactions();
        console.log("Transaction not found. Looking for:", safeTxHash);
        console.log("Available transactions:", allTxs.map(tx => ({
          safeTxHash: tx.safeTxHash,
          safeAddress: tx.safeAddress,
          signaturesCount: tx.signatures.length
        })));
        
        return NextResponse.json(
          {
            success: false,
            error: "Transaction not found",
            debug: {
              searchedHash: safeTxHash,
              availableCount: allTxs.length,
              availableHashes: allTxs.map(tx => tx.safeTxHash)
            }
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: transaction,
      });
    }

    // Get all transactions (optionally filtered by safeAddress)
    const transactions = getAllSafeTransactions(
      safeAddress || undefined
    );

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    console.error("API error fetching Safe transactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch transactions",
      },
      { status: 500 }
    );
  }
}

