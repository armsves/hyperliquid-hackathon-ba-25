# Setup Guide for Hyperliquid Explorer

## Quick Setup Instructions

### Step 1: Get Lava Network API Keys

1. Visit [https://accounts.lavanet.xyz/](https://accounts.lavanet.xyz/)
2. Create a free account or sign in
3. Navigate to your dashboard
4. Select **Hyperliquid** chain
5. Copy your dedicated RPC endpoint URLs for both:
   - **Mainnet** (for `NEXT_PUBLIC_LAVA_RPC_URL`)
   - **Testnet** (for `NEXT_PUBLIC_LAVA_RPC_URL_TESTNET`)

### Step 2: Create Environment File

Create a `.env.local` file in the root directory with the following content:

```env
# Lava Network RPC endpoints (REQUIRED)
# Replace these with your actual endpoints from https://accounts.lavanet.xyz/
NEXT_PUBLIC_LAVA_RPC_URL=https://your-mainnet-endpoint.lavanet.xyz
NEXT_PUBLIC_LAVA_RPC_URL_TESTNET=https://your-testnet-endpoint.lavanet.xyz

# Optional: WalletConnect for wallet integration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional: Chain configuration
NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid.xyz/evm
NEXT_PUBLIC_CHAIN_ID=999
```

**Important**: Replace the placeholder URLs with your actual Lava Network RPC endpoints.

### Step 3: Install and Run

```bash
npm install
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Troubleshooting

If you encounter RPC connection errors:
- Double-check your Lava Network URLs in `.env.local`
- Ensure your Lava Network account is active
- Verify you're using the correct endpoints for the selected network (Mainnet/Testnet)

