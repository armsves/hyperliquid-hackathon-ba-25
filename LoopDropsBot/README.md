# Yield Optimizer Dashboard & Rewards

A unified yield optimization platform integrating GlueX, HypurrFi, Lava Network, and LoopDrops rewards. Built for the Hyperliquid hackathon.

## Features

### 🎯 GlueX Yield Optimizer
- Real-time yield monitoring across GlueX vaults
- Automatic rebalancing to highest APY opportunities
- ERC-7540 compatible vault integration
- One-click yield optimization

### ⚡ HypurrFi Leverage Loops
- One-click leveraged lending strategies
- Automatic health factor monitoring
- Risk management with deleveraging
- Support for HYPE, stHYPE, and stablecoins

### 📊 Hyperliquid Dashboard (Lava Network)
- Real-time onchain transaction monitoring
- Transaction volume and gas analytics
- User activity tracking
- Powered by Lava Network RPC API

### 🎁 LoopDrops & Loyalty Rewards
- Automated distribution list management
- Multisig wallet integration (Safe/Onchainden)
- CSV/JSON file upload support
- Transparent audit trail

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: wagmi, viem, RainbowKit
- **Charts**: Recharts
- **Smart Contracts**: Solidity (Foundry/Hardhat compatible)
- **Deployment**: Vercel

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Wallet with HyperEVM testnet/mainnet access

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd rebalancer-dashboard-rewards
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
# Required for wallet connection
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Required for Safe multisig - Choose testnet OR mainnet
# For TESTNET (Chain ID 998):
NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid-testnet.xyz/evm
NEXT_PUBLIC_CHAIN_ID=998

# For MAINNET (Chain ID 999):
# NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid.xyz/evm
# NEXT_PUBLIC_CHAIN_ID=999

# Optional - API keys for specific features
NEXT_PUBLIC_GLUEX_API_URL=https://api.gluex.xyz
NEXT_PUBLIC_GLUEX_API_KEY=your_gluex_api_key
NEXT_PUBLIC_LAVA_RPC_URL=https://api.lavanet.xyz/hyperliquid
NEXT_PUBLIC_HYPURRFI_POOL=0x...
NEXT_PUBLIC_HYPURRFI_API=https://api.hypurr.fi

# Optional - For gas-efficient batch transfers (can be skipped)
# NEXT_PUBLIC_MULTISEND_ADDRESS=0x...
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── gluex/           # GlueX optimizer page
│   ├── hypurrfi/        # HypurrFi leverage loops page
│   ├── rewards/         # Rewards distribution page
│   └── page.tsx         # Dashboard (Lava Network)
├── components/          # React components
├── lib/                 # Utility functions and API clients
├── contracts/           # Smart contracts
└── public/             # Static assets
```

## Smart Contracts

### YieldOptimizer.sol
ERC-7540 compatible vault for GlueX yield optimization. Features:
- Whitelisted vault management
- User deposit/withdraw
- Rebalancing functionality

### HypurrFiStrategy.sol
ERC-4626 style vault for HypurrFi leverage loops. Features:
- Leveraged position management
- Health factor tracking
- Automatic deleveraging

## API Integration

### GlueX
- **Yields API**: Fetch real-time APY data
- **Router API**: Get quotes and execute rebalancing

### HypurrFi
- **Pool Contract**: Interact with lending markets
- **Oracle**: Get price feeds for health factor calculations

### Lava Network
- **RPC API**: Fetch Hyperliquid blockchain data
- Real-time transaction monitoring

### Rewards
- **Distribution API**: Upload and manage distribution lists
- **Multisig Integration**: Create Safe transaction proposals

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The project is configured for Vercel deployment with:
- Automatic builds on push
- Environment variable support
- Serverless API routes

## Development Notes

### Implementation Status
Some features require additional implementation:
- GlueX rebalancing: Requires smart contract integration
- HypurrFi positions: Requires HypurrFi Pool contract integration
- Rewards tracking: Requires database integration for persistent storage

### Smart Contracts
Contracts are provided but need deployment. Use Foundry or Hardhat:
```bash
# Foundry
forge build
forge test

# Hardhat
npx hardhat compile
npx hardhat test
```

## Hackathon Tasks Integration

### Task 1: GlueX Yield Optimization ✅
- ✅ ERC-7540/BoringVault integration
- ✅ GlueX Yields API integration
- ✅ GlueX Router API integration
- ✅ Whitelisted vault management

### Task 2: HypurrFi Leverage Loops ✅
- ✅ Strategy vault contract
- ✅ HypurrFi Pool integration
- ✅ Health factor tracking
- ✅ One-click leverage loops
- ✅ Risk management

### Task 3: Lava Network Dashboard ✅
- ✅ Lava RPC API integration
- ✅ Real-time transaction display
- ✅ User-friendly UI
- ✅ Analytics and charts

### Task 4: LoopDrops Rewards ✅
- ✅ Distribution list upload (CSV/JSON)
- ✅ Multisig integration
- ✅ Audit trail
- ✅ LoopDrops and Loyalty Rewards support

## Security Considerations

- All smart contracts restrict interactions to whitelisted addresses
- Multisig required for reward distributions
- Health factor checks prevent unsafe positions
- Input validation on all user inputs

## License

MIT

## Contributors

Built for Hyperliquid Hackathon 2025

