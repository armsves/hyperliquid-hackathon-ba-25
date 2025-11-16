# Quick Fix: SafeProxyFactory Required

## The Issue

The Safe SDK requires the `SafeProxyFactory` contract address to be configured, even when using an **existing Safe wallet**. This is a requirement of the Safe SDK architecture.

## Quick Solution

You have two options:

### Option 1: Find Your Safe's Factory Address (If Available)

If your Safe was created through a known factory, you might be able to find the factory address:
1. Check the transaction that created your Safe on a block explorer
2. Look for the factory contract that was called
3. Use that address as `NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS`

### Option 2: Deploy Just the Factory (Simplest)

You only need to deploy the **SafeProxyFactory** contract (not the full Safe infrastructure):

1. **Get the Factory Contract**:
   - Visit: https://github.com/safe-global/safe-contracts
   - Find: `contracts/proxies/SafeProxyFactory.sol`

2. **Deploy via Remix**:
   - Go to https://remix.ethereum.org
   - Paste the SafeProxyFactory contract code
   - Compile with Solidity 0.8.19
   - Connect MetaMask to Hyperliquid
   - Deploy the contract
   - Copy the deployed address

3. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS=0xYourDeployedFactoryAddress
   NEXT_PUBLIC_CHAIN_ID=998  # or 999 for mainnet
   ```

4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option 3: Use a Placeholder (Not Recommended)

If you just need to test, you could temporarily use any valid address format, but this might cause issues. It's better to deploy the actual factory.

## Why This Is Needed

The Safe SDK needs the factory address to:
- Verify Safe contract structure
- Initialize the SDK properly
- Handle transaction encoding correctly

Even though you're not creating new Safes, the SDK architecture requires this configuration.

## After Configuration

Once you've set `NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS`, the system will work with your existing Safe wallet at `0xf61aeCdF5D19ba4E175b5Bf902332870847A987E`.

