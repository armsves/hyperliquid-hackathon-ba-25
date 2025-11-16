# Hyperliquid Explorer - Starter Kit

A comprehensive blockchain explorer and monitoring dashboard for the Hyperliquid network, powered by Lava Network's high-performance RPC API. Built for the Hyperliquid Hackathon 2025.

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- A Lava Network account (free)

### Setup Steps

1. **Install Dependencies**

```bash
npm install
```

2. **Get Your Lava Network RPC URLs**

   - Visit [https://accounts.lavanet.xyz/](https://accounts.lavanet.xyz/)
   - Create a free account or sign in
   - Navigate to the dashboard and select **Hyperliquid** chain
   - Copy your dedicated RPC endpoint URLs for both Mainnet and Testnet

3. **Configure Environment Variables**

   Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

   Then edit `.env.local` and add your Lava Network RPC URLs:

```env
# Lava Network RPC endpoints (REQUIRED)
# Get these from https://accounts.lavanet.xyz/
NEXT_PUBLIC_LAVA_RPC_URL=https://your-mainnet-endpoint.lavanet.xyz
NEXT_PUBLIC_LAVA_RPC_URL_TESTNET=https://your-testnet-endpoint.lavanet.xyz

# Optional: WalletConnect for wallet integration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional: Chain configuration
NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid.xyz/evm
NEXT_PUBLIC_CHAIN_ID=999
```

   **Important**: Replace the placeholder URLs with your actual Lava Network RPC endpoints from your account dashboard.

4. **Run Development Server**

```bash
npm run dev
```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## 📋 Features

### Real-time Onchain Monitoring
- **Live Transaction Feed**: View recent transactions with automatic updates every 10 seconds
- **Block Explorer**: Monitor latest blocks with real-time block time calculations
- **Network Statistics**: Track active users, transaction volume, and gas metrics
- **Advanced Analytics**: Visualize transaction values, gas price trends, and network activity

### Transaction & Address Lookup
- **Transaction Lookup**: Search any transaction by hash with detailed information
- **Address Lookup**: Check any address for balance, transaction count, and activity

### Network Switching
- Switch between Hyperliquid Mainnet and Testnet using the dropdown in the navbar
- All data automatically updates based on selected network

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **RPC Provider**: Lava Network high-performance API
- **Data Fetching**: Server-side API routes with real-time polling

## 📁 Project Structure

```
HyperliquidExplorer/
├── app/
│   ├── api/hyperliquid/     # API routes for blockchain data
│   ├── page.tsx             # Main dashboard page
│   └── layout.tsx           # Root layout
├── components/
│   ├── Navbar.tsx           # Navigation with network selector
│   ├── TransactionLookup.tsx
│   └── AddressLookup.tsx
├── lib/
│   ├── lava.ts              # Lava Network RPC integration
│   └── networkContext.tsx   # Network selection context
└── README.md
```

## 🔧 Configuration

### Lava Network Setup

1. **Create Account**: Go to [https://accounts.lavanet.xyz/](https://accounts.lavanet.xyz/)
2. **Select Chain**: Choose Hyperliquid from the available chains
3. **Get Endpoints**: Copy both Mainnet and Testnet RPC URLs
4. **Add to .env.local**: Paste the URLs into your `.env.local` file

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_LAVA_RPC_URL` | Yes | Lava Network RPC URL for Hyperliquid Mainnet |
| `NEXT_PUBLIC_LAVA_RPC_URL_TESTNET` | Yes | Lava Network RPC URL for Hyperliquid Testnet |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | No | WalletConnect project ID for wallet integration |

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## 📖 Usage

1. **Select Network**: Use the dropdown in the navbar to switch between Mainnet and Testnet
2. **View Dashboard**: See real-time statistics, charts, and recent transactions
3. **Search Transactions**: Enter a transaction hash in the Transaction Lookup component
4. **Search Addresses**: Enter an address in the Address Lookup component
5. **Auto-refresh**: Toggle auto-refresh in the navbar (updates every 10 seconds)

## 🐛 Troubleshooting

### RPC Connection Issues

- Verify your Lava Network RPC URLs in `.env.local`
- Check that your Lava Network account is active
- Ensure you're using the correct endpoints for Mainnet/Testnet

### Build Errors

- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

## 📚 Additional Resources

- **Lava Network Docs**: https://docs.lavanet.xyz/
- **Hyperliquid Docs**: https://hyperliquid.xyz/docs
- **Next.js Docs**: https://nextjs.org/docs

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **Lava Network** for providing high-performance RPC infrastructure
- **Hyperliquid** for the innovative blockchain platform

---

**Built with ❤️ for the Hyperliquid Hackathon 2025**
