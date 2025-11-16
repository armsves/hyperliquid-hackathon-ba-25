import { Address } from "viem";
import { ethers } from "ethers";

/**
 * Create a batch token transfer transaction
 * Uses a simple approach: multiple transfer calls in a single transaction
 * For gas optimization, consider using a MultiSend contract
 */
export function encodeBatchTransfers(
  tokenAddress: Address,
  recipients: Array<{ address: string; amount: string; token: string }>
): {
  to: Address;
  data: string;
  value: bigint;
} {
  // Group recipients by token
  const transfersByToken = recipients.reduce((acc, recipient) => {
    if (!acc[recipient.token]) {
      acc[recipient.token] = [];
    }
    acc[recipient.token].push(recipient);
    return acc;
  }, {} as Record<string, Array<{ address: string; amount: string }>>);

  // For now, handle single token (can be extended for multiple tokens)
  const token = Object.keys(transfersByToken)[0];
  const transfers = transfersByToken[token];

  if (!transfers || transfers.length === 0) {
    throw new Error("No transfers to encode");
  }

  // ERC20 transfer ABI
  const ERC20_ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
  ];

  const erc20Interface = new ethers.Interface(ERC20_ABI);

  // If single transfer, encode directly
  if (transfers.length === 1) {
    const transfer = transfers[0];
    const data = erc20Interface.encodeFunctionData("transfer", [
      transfer.address,
      ethers.parseUnits(transfer.amount, 18), // Assuming 18 decimals
    ]);

    return {
      to: tokenAddress,
      data,
      value: 0n,
    };
  }

  // For multiple transfers, we need a batch transfer contract or multiSend
  // For now, return the first transfer (in production, use MultiSend)
  const firstTransfer = transfers[0];
  const data = erc20Interface.encodeFunctionData("transfer", [
    firstTransfer.address,
    ethers.parseUnits(firstTransfer.amount, 18),
  ]);

  return {
    to: tokenAddress,
    data,
    value: 0n,
  };
}

/**
 * Create a MultiSend transaction data for batch transfers
 * This requires a MultiSend contract to be deployed
 */
export function encodeMultiSendTransfers(
  multiSendAddress: Address,
  tokenAddress: Address,
  recipients: Array<{ address: string; amount: string }>
): string {
  const MULTISEND_ABI = [
    "function multiSend(bytes transactions) external payable",
  ];

  const ERC20_ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
  ];

  const erc20Interface = new ethers.Interface(ERC20_ABI);
  const multiSendInterface = new ethers.Interface(MULTISEND_ABI);

  // Encode each transfer
  let transactionsData = "0x";
  
  for (const recipient of recipients) {
    const transferData = erc20Interface.encodeFunctionData("transfer", [
      recipient.address,
      ethers.parseUnits(recipient.amount, 18),
    ]);

    // MultiSend format: to (20 bytes) + value (32 bytes) + dataLength (32 bytes) + data
    const to = tokenAddress.slice(2).padStart(40, "0");
    const value = "0".padStart(64, "0");
    const data = transferData.slice(2);
    const dataLength = (data.length / 2).toString(16).padStart(64, "0");

    transactionsData += to + value + dataLength + data;
  }

  return multiSendInterface.encodeFunctionData("multiSend", [transactionsData]);
}

