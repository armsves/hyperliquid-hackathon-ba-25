# Deploy MultiSend Contract to Hyperliquid

This guide explains how to deploy the MultiSend contract to Hyperliquid for multisig batch transfers.

## Prerequisites

1. A wallet with Hyperliquid testnet/mainnet access
2. Sufficient ETH for deployment gas
3. Foundry or Hardhat installed (for compilation)

## Option 1: Using Foundry

1. **Install Foundry** (if not already installed):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Compile the contract**:
   ```bash
   forge build
   ```

3. **Deploy using cast**:
   ```bash
   # Set your private key (be careful with this!)
   export PRIVATE_KEY=your_private_key_here
   export RPC_URL=https://rpc.hyperliquid.xyz/evm
   
   # Deploy MultiSend
   forge create contracts/MultiSend.sol:MultiSend \
     --rpc-url $RPC_URL \
     --private-key $PRIVATE_KEY
   ```

4. **Save the deployed address** and add to `.env.local`:
   ```env
   NEXT_PUBLIC_MULTISEND_ADDRESS=0x...
   ```

## Option 2: Using Hardhat

1. **Install dependencies**:
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Create `hardhat.config.js`**:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");

   module.exports = {
     solidity: "0.8.19",
     networks: {
       hyperliquid: {
         url: "https://rpc.hyperliquid.xyz/evm",
         chainId: 998,
         accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
       },
     },
   };
   ```

3. **Create deployment script** (`scripts/deploy-multisend.js`):
   ```javascript
   const hre = require("hardhat");

   async function main() {
     const MultiSend = await hre.ethers.getContractFactory("MultiSend");
     const multiSend = await MultiSend.deploy();
     await multiSend.waitForDeployment();
     console.log("MultiSend deployed to:", await multiSend.getAddress());
   }

   main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error);
       process.exit(1);
     });
   ```

4. **Deploy**:
   ```bash
   PRIVATE_KEY=your_private_key npx hardhat run scripts/deploy-multisend.js --network hyperliquid
   ```

## Option 3: Using Remix IDE

1. Go to https://remix.ethereum.org
2. Create a new file `MultiSend.sol` and paste the contract code
3. Compile the contract (Solidity 0.8.19)
4. Deploy:
   - Select "Injected Provider" (MetaMask)
   - Connect to Hyperliquid network
   - Deploy MultiSend contract
   - Copy the deployed address

## Verify Deployment

After deployment, verify the contract:

```bash
# Check contract code
cast code 0x... --rpc-url https://rpc.hyperliquid.xyz/evm
```

## Update Environment Variables

Add the deployed address to your `.env.local`:

```env
NEXT_PUBLIC_MULTISEND_ADDRESS=0xYourDeployedAddress
NEXT_PUBLIC_CHAIN_ID=998
```

## Testing MultiSend

You can test the MultiSend contract by creating a test transaction:

```typescript
import { createBatchTransferTransaction } from "@/lib/safe";

// This will now use MultiSend if configured
const txHash = await createBatchTransferTransaction(
  safeAddress,
  tokenAddress,
  recipients,
  signer
);
```

## Notes

- **Gas Optimization**: MultiSend batches multiple transfers into a single transaction, saving gas
- **Security**: The MultiSend contract uses delegatecall for batch operations
- **Compatibility**: This contract is compatible with Safe's MultiSend interface
- **Deployment Cost**: Expect ~500k-1M gas for deployment

## Troubleshooting

If you get "Invalid multiSend contract address" error:
1. Verify the address is correct
2. Check that the contract is deployed on the correct chain
3. Ensure `NEXT_PUBLIC_CHAIN_ID` matches your deployment chain
4. Verify the contract code matches the expected MultiSend interface

