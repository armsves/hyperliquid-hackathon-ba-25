# Deploy Safe Contracts to Hyperliquid

**Safe contracts are NOT deployed on Hyperliquid by default.** You need to deploy them yourself before using the Safe SDK.

## Required Contracts

To use Safe wallets on Hyperliquid, you need to deploy these contracts:

1. **SafeProxyFactory** - Creates Safe wallet instances
2. **SafeSingleton** (Safe Master Copy) - The implementation contract for Safe wallets
3. **MultiSend** (optional but recommended) - For batch transactions
4. **CompatibilityFallbackHandler** (optional) - For compatibility features

## Quick Deployment Guide

### Option 1: Use Safe's Deployment Scripts (Recommended)

1. **Clone Safe Contracts Repository**:
   ```bash
   git clone https://github.com/safe-global/safe-contracts.git
   cd safe-contracts
   npm install
   ```

2. **Configure Hardhat for Hyperliquid**:
   Create or update `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   
   module.exports = {
     solidity: "0.8.19",
     networks: {
       hyperliquidTestnet: {
         url: "https://rpc.hyperliquid-testnet.xyz/evm",
         chainId: 998,
         accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
       },
       hyperliquidMainnet: {
         url: "https://rpc.hyperliquid.xyz/evm",
         chainId: 999,
         accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
       },
     },
   };
   ```

3. **Deploy Contracts**:
   ```bash
   # Set your private key
   export PRIVATE_KEY=your_private_key_here
   
   # Deploy to testnet
   npx hardhat run scripts/deploy_all.js --network hyperliquidTestnet
   ```

4. **Save Deployed Addresses**:
   After deployment, you'll get addresses for each contract. Add them to your `.env.local`:
   ```env
   NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS=0x...
   NEXT_PUBLIC_SAFE_SINGLETON_ADDRESS=0x...
   NEXT_PUBLIC_MULTISEND_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN_ID=998  # or 999 for mainnet
   ```

### Option 2: Deploy via Remix (Easier for Testing)

1. **Go to Remix**: https://remix.ethereum.org

2. **Get Contract Code**:
   - Visit https://github.com/safe-global/safe-contracts
   - Copy the contract code for:
     - `contracts/SafeProxyFactory.sol`
     - `contracts/Safe.sol` (this is the Singleton)
     - `contracts/libraries/MultiSend.sol`

3. **Deploy Each Contract**:
   - Compile with Solidity 0.8.19
   - Connect MetaMask to Hyperliquid testnet
   - Deploy each contract
   - Save the deployed addresses

4. **Update Environment Variables**:
   ```env
   NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS=0xYourFactoryAddress
   NEXT_PUBLIC_SAFE_SINGLETON_ADDRESS=0xYourSingletonAddress
   NEXT_PUBLIC_MULTISEND_ADDRESS=0xYourMultiSendAddress
   ```

## Contract Addresses Reference

After deployment, you should have addresses like:
- SafeProxyFactory: `0x...` (deployed address)
- SafeSingleton: `0x...` (deployed address)
- MultiSend: `0x...` (deployed address)

## Verification

After deployment, verify the contracts:
1. Check on block explorer (if available for Hyperliquid)
2. Test by creating a Safe wallet using the deployed addresses
3. Verify contract code matches expected Safe contracts

## Alternative: Use SimpleMultisig

If deploying Safe contracts is too complex, consider using the `SimpleMultisig` contract that's already in this repository:
- See `SIMPLE_MULTISIG_GUIDE.md`
- Simpler deployment
- Works immediately without Safe infrastructure
- Less features but sufficient for basic multisig needs

## Troubleshooting

### Error: "Invalid multiSend contract address"
- Ensure MultiSend contract is deployed
- Verify the address in `NEXT_PUBLIC_MULTISEND_ADDRESS` is correct
- Check the contract code matches Safe's MultiSend interface

### Error: "Safe contracts are not deployed"
- Deploy all required contracts (Factory, Singleton, MultiSend)
- Set all environment variables correctly
- Restart your development server after updating `.env.local`

### Contract Deployment Fails
- Ensure you have enough ETH for gas
- Verify RPC URL is correct
- Check network connection
- Try deploying one contract at a time

## Resources

- Safe Contracts: https://github.com/safe-global/safe-contracts
- Safe SDK Docs: https://docs.safe.global/sdk/overview
- Safe Deployment Guide: https://docs.safe.global/safe-core-api/contracts

