# LoopDrops Bot - Automated Multisig Distribution System

## Overview

LoopDrops Bot is an automated distribution system for LoopDrops and Loyalty Rewards on HyperEVM. It programmatically manages token distributions, generates multisig transaction proposals, and provides a transparent audit trail. The system integrates with Safe/OnchainDen multisig wallets for secure, programmatic token distributions.

## 🎯 Core Features

### 1. **Programmatic Distribution Management**
- Upload distribution lists via CSV or JSON
- Support for multiple token types (LOOP, LEND, and others)
- Batch recipient processing
- Distribution type management (LoopDrops vs Loyalty Rewards)

### 2. **Multisig Wallet Integration**
- Direct integration with Safe multisig wallets on HyperEVM
- EIP-712 typed data signing for transaction proposals
- Support for 2-of-3 (or custom) threshold multisig wallets
- Transaction approval workflow with multiple signers

### 3. **Transaction Management**
- Create Safe transaction proposals with automatic signing
- Approve transactions from multiple wallets
- Execute transactions once threshold is met
- Real-time transaction status tracking

### 4. **Audit Trail & Transparency**
- Complete audit log of all distribution activities
- Entitlement tracking per address
- Transaction history with signatures
- Distribution status tracking (pending → proposed → executed)

### 5. **User Interface**
- Clean, modern UI built with Next.js and Tailwind CSS
- Real-time transaction status updates
- Copy-to-clipboard for transaction hashes
- Direct links to OnchainDen for executed transactions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Wallet Integration**: wagmi, viem, RainbowKit
- **Multisig**: Safe Protocol Kit, direct contract interaction
- **Blockchain**: HyperEVM (Hyperliquid mainnet - Chain ID 999)
- **Deployment**: Vercel-ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Wallet with HyperEVM mainnet access
- Safe multisig wallet (or create one)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd LoopDropsBot
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
# Wallet Connection
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# HyperEVM Mainnet
NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid.xyz/evm
NEXT_PUBLIC_CHAIN_ID=999

# Safe Configuration (for existing Safe wallets)
NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS=0xc22834581ebc8527d974f8a1c97e1bea4ef910bc
NEXT_PUBLIC_SAFE_SINGLETON_ADDRESS=0x... # Your Safe singleton address
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Creating a Distribution

1. Navigate to the **Rewards** page
2. Upload a CSV or JSON file with recipient addresses and amounts:
   ```csv
   address,amount,token
   0x6BbFd1F6dC17322a6e8923cf8072a735A081a975,100,LOOP
   0x0DBA585a86bb828708b14d2F83784564Ae03a5d0,200,LOOP
   ```
3. Select distribution type (LoopDrops or Loyalty Rewards)
4. Click "Upload Distribution List"

### Proposing a Transaction

1. Find your distribution in the list
2. Click "Propose" button
3. Connect your wallet and sign the transaction
4. Copy the transaction hash for other signers

### Approving a Transaction

1. Navigate to **Approve Transaction** page
2. Paste the transaction hash (or use the link from the success message)
3. Connect a different wallet (must be a Safe owner)
4. Click "Approve Transaction"
5. Once you have enough signatures (2 of 3), click "Execute Transaction"

### Viewing Audit Trail

1. Navigate to the **Audit Trail** tab
2. View all distribution activities, proposals, and executions
3. Filter by distribution ID or view all logs

## 🏗️ Architecture

### Key Components

- **`lib/safe.ts`**: Safe transaction creation and management
- **`lib/safeDirect.ts`**: Direct contract interaction for Safe transactions
- **`lib/approveTransaction.ts`**: Transaction approval and execution
- **`lib/distributionStore.ts`**: In-memory distribution and audit log storage
- **`lib/onchainden.ts`**: OnchainDen integration utilities
- **`app/rewards/page.tsx`**: Main distribution management UI
- **`app/approve-transaction/page.tsx`**: Transaction approval UI

### API Routes

- `/api/rewards/distributions` - Distribution CRUD operations
- `/api/rewards/entitlements` - User entitlement queries
- `/api/rewards/audit` - Audit log retrieval
- `/api/safe/transactions` - Safe transaction queries

## 🔐 Security Features

- **Multisig Required**: All distributions require multisig approval
- **EIP-712 Signing**: Standardized typed data signing for transaction proposals
- **Threshold Enforcement**: Transactions can only execute with required signatures
- **Audit Trail**: Complete logging of all actions for transparency

## 📊 Features in Detail

### Distribution List Format

**CSV Format:**
```csv
address,amount,token
0x...,100,LOOP
0x...,200,LOOP
```

**JSON Format:**
```json
[
  { "address": "0x...", "amount": "100", "token": "LOOP" },
  { "address": "0x...", "amount": "200", "token": "LOOP" }
]
```

### Safe Transaction Flow

1. **Create**: Generate Safe transaction with EIP-712 signature
2. **Store**: Save transaction in server-side store
3. **Approve**: Additional signers add their signatures
4. **Execute**: Once threshold met, execute on-chain
5. **Index**: OnchainDen automatically indexes executed transactions

### Supported Tokens

- **LOOP**: `0x00fdbc53719604d924226215bc871d55e40a1009`
- **LEND**: (configurable)
- Other ERC-20 tokens (configurable)

## 🎨 UI Features

- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Transaction status updates automatically
- **Copy-to-Clipboard**: Easy sharing of transaction hashes
- **Status Badges**: Visual indicators for pending/proposed/executed
- **Transaction Links**: Direct links to OnchainDen for executed transactions

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Yes |
| `NEXT_PUBLIC_RPC_URL` | HyperEVM RPC endpoint | Yes |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID (999 for mainnet) | Yes |
| `NEXT_PUBLIC_SAFE_PROXY_FACTORY_ADDRESS` | Safe Proxy Factory address | Yes |
| `NEXT_PUBLIC_SAFE_SINGLETON_ADDRESS` | Safe Singleton address | Optional |

### Safe Wallet Setup

The system works with existing Safe wallets. To use:

1. Deploy or use an existing Safe wallet on HyperEVM
2. Configure owners and threshold (e.g., 2 of 3)
3. Set the Safe address in the UI or environment

## 📝 Development Notes

### Current Limitations

- **In-Memory Storage**: Distributions and transactions are stored in-memory (resets on server restart)
- **Single Transfer**: Currently supports single recipient per transaction (batch support coming)
- **OnchainDen Indexing**: Transactions only appear on OnchainDen after execution

### Future Enhancements

- Database persistence for distributions and transactions
- Batch transfer support (MultiSend integration)
- Real-time notifications for transaction status
- Multi-token batch distributions
- Scheduled distributions

## 🧪 Testing

### Test Distribution

1. Click "Create Test Distribution (3 recipients)" to create sample data
2. Click "Quick Test: Send 0.02 LOOP" for a single-recipient test
3. Propose and approve with multiple wallets

### Manual Testing

1. Create a distribution with test addresses
2. Propose transaction with wallet 1
3. Approve with wallet 2
4. Execute transaction
5. Verify on OnchainDen

## 📄 License

MIT License - See LICENSE file for details

## 👥 Team

Built for Hyperliquid Hackathon 2025 - Staking Summit Buenos Aires

## 🔗 Links

- **Repository**: [GitHub](https://github.com/armsves/hyperliquid-hackathon-ba-25)
- **Demo**: (Add your deployed URL here)
- **OnchainDen**: https://safe.onchainden.com

## 🎯 Hackathon Task Alignment

This project addresses the **LoopDrops & Loyalty Rewards** distribution requirements:

✅ Programmatic acceptance/upload of distribution lists  
✅ Integration with multisig wallet (Safe/OnchainDen)  
✅ Support for multiple token types (LOOP, LEND)  
✅ Audit trail/logging system  
✅ User interface for viewing entitlements and distributions  
✅ Transaction proposal and approval workflow  

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The project is configured for Vercel with:
- Automatic builds on push
- Serverless API routes
- Environment variable support

---

**Built with ❤️ for HyperEVM**

