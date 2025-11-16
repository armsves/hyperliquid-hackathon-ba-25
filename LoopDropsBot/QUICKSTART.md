# Quick Start Guide

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env.local` file with:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_GLUEX_API_URL=https://api.gluex.xyz
NEXT_PUBLIC_GLUEX_API_KEY=your_api_key
NEXT_PUBLIC_LAVA_RPC_URL=https://api.lavanet.xyz/hyperliquid
```

## Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

- **/** - Dashboard (Lava Network integration)
- **/gluex** - GlueX Yield Optimizer
- **/hypurrfi** - HypurrFi Leverage Loops
- **/rewards** - LoopDrops & Loyalty Rewards

## Features

### Dashboard
- Real-time transaction monitoring
- Volume and gas analytics
- Powered by Lava Network RPC

### GlueX Optimizer
- View yields across all GlueX vaults
- One-click rebalancing
- ERC-7540 compatible vault

### HypurrFi Loops
- Create leverage loops (1x-5x)
- Health factor monitoring
- Automatic deleveraging

### Rewards
- Upload CSV/JSON distribution lists
- Multisig integration ready
- Audit trail

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

## Smart Contracts

See `contracts/README.md` for deployment instructions.

