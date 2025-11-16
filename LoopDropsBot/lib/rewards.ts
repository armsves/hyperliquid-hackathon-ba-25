import axios from "axios";
import { Address } from "viem";

const API_BASE = "/api/rewards";

export interface RewardData {
  pending: string;
  totalEarned: string;
  lastClaimed: string;
  history: Array<{
    amount: string;
    token: string;
    timestamp: string;
    txHash: string;
  }>;
}

export interface DistributionList {
  id: string;
  type: "loopdrops" | "loyalty";
  recipients: Array<{
    address: string;
    amount: string;
    token: string;
  }>;
  status: "pending" | "proposed" | "executed" | "failed";
  createdAt: string;
  recipientCount?: number;
  totalAmount?: string;
  token?: string;
}

export async function getRewards(userAddress: Address): Promise<RewardData> {
  const response = await axios.get(`${API_BASE}/user/${userAddress}`);
  if (!response.data) {
    throw new Error("Invalid response from rewards API");
  }
  return response.data;
}

export async function uploadDistributionList(
  recipients: Array<{ address: string; amount: string; token: string }>,
  type: "loopdrops" | "loyalty",
  actor?: string
): Promise<{ id: string }> {
  try {
    const response = await axios.post(`${API_BASE}/distributions`, {
      type,
      recipients,
      actor: actor || "system",
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading distribution list:", error);
    throw error;
  }
}

export async function getDistributions(): Promise<DistributionList[]> {
  const response = await axios.get(`${API_BASE}/distributions`);
  if (!Array.isArray(response.data)) {
    throw new Error("Invalid response format from distributions API");
  }
  return response.data;
}

export async function proposeDistribution(
  distributionId: string,
  safeAddress?: string,
  signerPrivateKey?: string
): Promise<{ txHash: string; message?: string; warning?: string }> {
  try {
    const response = await axios.post(`${API_BASE}/distributions/${distributionId}/propose`, {
      safeAddress,
      signerPrivateKey,
    });
    return response.data;
  } catch (error) {
    console.error("Error proposing distribution:", error);
    throw error;
  }
}

