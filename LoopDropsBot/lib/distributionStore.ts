// Shared in-memory store for distributions
// In production, replace with a database (PostgreSQL, MongoDB, etc.)

export interface Distribution {
  id: string;
  type: "loopdrops" | "loyalty";
  recipients: Array<{
    address: string;
    amount: string;
    token: string;
  }>;
  status: "pending" | "proposed" | "executed" | "failed";
  createdAt: string;
  proposedAt?: string;
  executedAt?: string;
  txHash?: string;
  safeTxHash?: string;
  recipientCount: number;
  totalAmount: string;
  token: string;
  safeAddress?: string;
  proposerAddress?: string;
  transactionData?: {
    to: string;
    value: string;
    data: string;
    operation: number;
    safeTxGas: number;
    baseGas: number;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    nonce: number;
  };
  signatures?: Array<{
    signer: string;
    signature: string;
  }>;
}

export interface AuditLog {
  id: string;
  distributionId: string;
  action: "created" | "proposed" | "approved" | "executed" | "failed" | "updated";
  timestamp: string;
  actor: string; // Address of the person who performed the action
  details?: string;
  txHash?: string;
}

export interface Entitlement {
  address: string;
  totalPending: string;
  totalEarned: string;
  distributions: Array<{
    distributionId: string;
    type: "loopdrops" | "loyalty";
    amount: string;
    token: string;
    status: string;
    createdAt: string;
  }>;
}

let distributions: Distribution[] = [];
let auditLogs: AuditLog[] = [];
let distributionCounter = 1;
let auditLogCounter = 1;

export function getAllDistributions(): Distribution[] {
  return distributions;
}

export function getDistributionById(id: string): Distribution | undefined {
  return distributions.find((d) => d.id === id);
}

export function createDistribution(distribution: Omit<Distribution, "id" | "createdAt">, actor?: string): Distribution {
  const newDistribution: Distribution = {
    ...distribution,
    id: `dist-${distributionCounter++}`,
    createdAt: new Date().toISOString(),
  };
  distributions.push(newDistribution);
  
  // Create audit log
  createAuditLog({
    distributionId: newDistribution.id,
    action: "created",
    actor: actor || "system",
    details: `Created ${distribution.type} distribution with ${distribution.recipientCount} recipients`,
  });
  
  return newDistribution;
}

export function updateDistribution(id: string, updates: Partial<Distribution>, actor?: string): boolean {
  const index = distributions.findIndex((d) => d.id === id);
  if (index === -1) {
    return false;
  }
  const oldStatus = distributions[index].status;
  distributions[index] = { ...distributions[index], ...updates };
  
  // Create audit log for status changes
  if (updates.status && updates.status !== oldStatus) {
    createAuditLog({
      distributionId: id,
      action: updates.status === "proposed" ? "proposed" : 
              updates.status === "executed" ? "executed" : 
              updates.status === "failed" ? "failed" : "updated",
      actor: actor || "system",
      details: `Status changed from ${oldStatus} to ${updates.status}`,
      txHash: updates.txHash || updates.safeTxHash,
    });
  }
  
  return true;
}

export function createAuditLog(log: Omit<AuditLog, "id" | "timestamp">): AuditLog {
  const newLog: AuditLog = {
    ...log,
    id: `audit-${auditLogCounter++}`,
    timestamp: new Date().toISOString(),
  };
  auditLogs.push(newLog);
  return newLog;
}

export function getAuditLogs(distributionId?: string): AuditLog[] {
  if (distributionId) {
    return auditLogs.filter(log => log.distributionId === distributionId);
  }
  return auditLogs;
}

export function getEntitlements(address?: string): Entitlement[] {
  const entitlementsMap = new Map<string, Entitlement>();
  
  distributions.forEach(dist => {
    dist.recipients.forEach(recipient => {
      if (address && recipient.address.toLowerCase() !== address.toLowerCase()) {
        return;
      }
      
      const addr = recipient.address.toLowerCase();
      if (!entitlementsMap.has(addr)) {
        entitlementsMap.set(addr, {
          address: recipient.address,
          totalPending: "0",
          totalEarned: "0",
          distributions: [],
        });
      }
      
      const entitlement = entitlementsMap.get(addr)!;
      // Parse amount as string (handles decimals) and convert to wei-equivalent for calculations
      // For display purposes, we keep the original amount string
      const amountStr = recipient.amount || "0";
      // Try to parse as BigInt if it's an integer, otherwise keep as string
      let amount: bigint;
      try {
        // If it contains a decimal point, we need to handle it differently
        if (amountStr.includes(".")) {
          // For now, just use the string representation for calculations
          // In production, you'd want to convert to wei (multiply by 10^18)
          const [whole, decimal] = amountStr.split(".");
          const decimals = decimal || "";
          // Pad to 18 decimals and take first 18 chars
          const paddedDecimals = decimals.padEnd(18, "0").slice(0, 18);
          amount = BigInt(whole + paddedDecimals);
        } else {
          amount = BigInt(amountStr);
        }
      } catch {
        amount = BigInt(0);
      }
      
      if (dist.status === "pending" || dist.status === "proposed") {
        entitlement.totalPending = (BigInt(entitlement.totalPending) + amount).toString();
      } else if (dist.status === "executed") {
        entitlement.totalEarned = (BigInt(entitlement.totalEarned) + amount).toString();
      }
      
      entitlement.distributions.push({
        distributionId: dist.id,
        type: dist.type,
        amount: recipient.amount,
        token: recipient.token,
        status: dist.status,
        createdAt: dist.createdAt,
      });
    });
  });
  
  return Array.from(entitlementsMap.values());
}

