# Safe SDK Configuration Guide

## Required Environment Variables

Add these to your `.env.local` file:

```env
# RPC URL for your chain (HyperEVM) - Choose testnet OR mainnet

# For TESTNET (Chain ID 998):
NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid-testnet.xyz/evm
NEXT_PUBLIC_CHAIN_ID=998

# For MAINNET (Chain ID 999):
# NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid.xyz/evm
# NEXT_PUBLIC_CHAIN_ID=999

# Safe Transaction Service URL (optional, for production use)
# NEXT_PUBLIC_SAFE_SERVICE_URL=https://safe-transaction-mainnet.safe.global
```

## 1. Safe Transaction Service URL

The Safe Transaction Service URL depends on your chain. Safe supports many chains, but **HyperEVM/Hyperliquid may not have official Safe support yet**.

### Option A: Use Safe's Official Services (if available)

Check if Safe supports your chain:
- **Mainnet**: `https://safe-transaction-mainnet.safe.global`
- **Goerli**: `https://safe-transaction-goerli.safe.global`
- **Sepolia**: `https://safe-transaction-sepolia.safe.global`
- **Polygon**: `https://safe-transaction-polygon.safe.global`
- **Gnosis Chain**: `https://safe-transaction-gnosis-chain.safe.global`

**Full list**: Check [Safe's documentation](https://docs.safe.global/safe-core-api/available-services) for all supported chains.

### Option B: Self-Hosted Safe Transaction Service (for unsupported chains)

If HyperEVM is not officially supported, you have two options:

1. **Self-host Safe Transaction Service**:
   ```bash
   # Clone Safe Transaction Service
   git clone https://github.com/safe-global/safe-transaction-service.git
   cd safe-transaction-service
   
   # Configure for your chain and run
   # See: https://github.com/safe-global/safe-transaction-service
   ```

2. **Use a custom endpoint** (if someone else is hosting it for HyperEVM):
   ```env
   NEXT_PUBLIC_SAFE_SERVICE_URL=https://your-custom-safe-service.com
   ```

## 2. MultiSend Contract Address (Optional)

MultiSend allows batching multiple transfers into a single transaction for gas efficiency. **This is optional** - the system works fine without it by creating individual transactions.

### Option A: Deploy MultiSend Contract

```solidity
// MultiSend contract from Safe
// Deploy this to HyperEVM
// See: https://github.com/safe-global/safe-contracts/blob/main/contracts/libraries/MultiSend.sol
```

Then update `lib/safe.ts` to use the deployed address:

```typescript
const MULTISEND_ADDRESS = process.env.NEXT_PUBLIC_MULTISEND_ADDRESS || "0x...";
```

### Option B: Use Individual Transfers (Simpler)

Modify `lib/safe.ts` to create multiple Safe transactions instead of using MultiSend. This is simpler but less gas-efficient.

## 3. Create a Safe Wallet

Before using the system, you need to create a Safe wallet:

1. **Using Safe Web UI** (if available for your chain):
   - Go to https://app.safe.global
   - Connect your wallet
   - Create a new Safe
   - Note the Safe address

2. **Programmatically** (using Safe SDK):
   ```typescript
   import Safe, { SafeFactory } from "@safe-global/safe-core-sdk";
   
   const safeFactory = await SafeFactory.init({ ethAdapter });
   const safeSdk = await safeFactory.deploySafe({ safeAccountConfig });
   const safeAddress = safeSdk.getAddress();
   ```

## 4. Signer Configuration

The system requires a signer (private key) to propose transactions. **Important security considerations**:

### Current Implementation (Development Only)
- Private key is passed in the API request body
- **DO NOT USE IN PRODUCTION**

### Production Options

1. **Backend Service with Secure Key Management**:
   - Use AWS KMS, HashiCorp Vault, or similar
   - Store private keys securely
   - Never expose private keys to frontend

2. **Wallet Connection** (Recommended):
   - Use wagmi/viem to connect user's wallet
   - User signs transactions directly
   - No private key handling needed

3. **Environment Variable** (Server-side only):
   ```env
   # Store in secure environment (never commit to git)
   SAFE_SIGNER_PRIVATE_KEY=0x...
   ```

## 5. Token Configuration

Ensure token addresses are configured:

```typescript
// In app/api/rewards/distributions/[id]/propose/route.ts
const TOKEN_ADDRESSES: Record<string, string> = {
  LOOP: "0x00fdbc53719604d924226215bc871d55e40a1009",
  LEND: "0x...", // Add actual LEND token address
};
```

## 6. Testing the Configuration

1. **Check Safe Transaction Service**:
   ```bash
   curl https://safe-transaction-mainnet.safe.global/api/v1/safes/0x.../
   ```

2. **Verify RPC Connection**:
   ```bash
   curl -X POST https://rpc.hyperliquid.xyz/evm \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

3. **Test Safe SDK Connection**:
   ```typescript
   import { getSafeInstance } from "@/lib/safe";
   const safe = await getSafeInstance(safeAddress, signer);
   console.log("Safe address:", safe.getAddress());
   ```

## Troubleshooting

### Error: "Safe Transaction Service not available"
- Check if `NEXT_PUBLIC_SAFE_SERVICE_URL` is correct
- Verify the service is running/available for your chain
- Check network connectivity

### Error: "Failed to initialize Safe SDK"
- Verify Safe address is correct
- Check RPC URL is accessible
- Ensure signer has permissions

### Error: "MultiSend contract not found"
- Deploy MultiSend contract or update code to use individual transfers
- Set `NEXT_PUBLIC_MULTISEND_ADDRESS` if using deployed contract

### Error: "Transaction proposal failed"
- Verify signer is an owner of the Safe
- Check Safe threshold requirements
- Ensure sufficient gas/funds

## Next Steps

1. **For HyperEVM**: Check if Safe officially supports it, or set up self-hosted service
2. **Deploy MultiSend**: Deploy MultiSend contract or modify code for individual transfers
3. **Create Safe Wallet**: Set up your multisig wallet
4. **Secure Signing**: Implement proper key management for production
5. **Test**: Create a test distribution and propose it to your Safe

## Resources

- [Safe SDK Documentation](https://docs.safe.global/sdk/overview)
- [Safe Transaction Service](https://github.com/safe-global/safe-transaction-service)
- [Safe Contracts](https://github.com/safe-global/safe-contracts)
- [Safe Supported Chains](https://docs.safe.global/safe-core-api/available-services)

