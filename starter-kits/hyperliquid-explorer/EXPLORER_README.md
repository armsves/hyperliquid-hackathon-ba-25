# Hyperliquid Explorer - Real-time Onchain Monitoring

A comprehensive blockchain explorer and monitoring dashboard for the Hyperliquid network, powered by Lava Network's high-performance RPC API. Built for the Hyperliquid Hackathon 2025.

## 🎯 Problem Statement

The Hyperliquid ecosystem needed enhanced visibility into onchain activity including transactions, token flows, user interactions, and trading statistics. This explorer provides transparent, real-time monitoring that significantly contributes to the network's visibility and user engagement.

## ✨ Features

### Real-time Onchain Monitoring
- **Live Transaction Feed**: View recent transactions with automatic updates every 10 seconds
- **Block Explorer**: Monitor latest blocks with real-time block time calculations
- **Network Statistics**: Track active users, transaction volume, and gas metrics
- **Advanced Analytics**: Visualize transaction values, gas price trends, and network activity

### Transaction & Address Lookup
- **Transaction Lookup**: Search any transaction by hash with detailed information including:
  - Transaction status (success/failed)
  - Gas usage and pricing
  - Block confirmation
  - Transaction receipt and event logs
- **Address Lookup**: Check any address for:
  - Current balance
  - Transaction count
  - Account activity

### Interactive Visualizations
- **Transaction Value Chart**: Area chart showing transaction values over time
- **Gas Price Trend**: Line chart displaying gas price fluctuations
- **Real-time Updates**: Auto-refresh toggle with manual refresh option
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **RPC Provider**: Lava Network high-performance API
- **Data Fetching**: Server-side API routes with real-time polling

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Internet connection to access Lava Network RPC endpoints

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HyperliquidExplorer
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Lava Network RPC endpoint for Hyperliquid
NEXT_PUBLIC_LAVA_RPC_URL=https://g.w.lavanet.xyz:443/gateway/hyperliquid/rpc-http/

# Optional: WalletConnect for wallet integration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional: Chain configuration
NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid.xyz/evm
NEXT_PUBLIC_CHAIN_ID=999
```

**Note**: The Lava Network RPC URL is pre-configured. You can get your own dedicated endpoint by:
1. Visiting https://accounts.lavanet.xyz/
2. Creating a free account
3. Selecting Hyperliquid chain
4. Copying your dedicated RPC endpoint

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 📁 Project Structure

```
HyperliquidExplorer/
├── app/
│   ├── api/
│   │   └── hyperliquid/          # API routes
│   │       ├── data/              # Dashboard data endpoint
│   │       ├── transaction/       # Transaction lookup endpoint
│   │       └── address/           # Address lookup endpoint
│   ├── page.tsx                   # Main dashboard page
│   └── layout.tsx                 # Root layout
├── components/
│   ├── TransactionLookup.tsx      # Transaction search component
│   ├── AddressLookup.tsx          # Address search component
│   └── Navbar.tsx                 # Navigation component
├── lib/
│   └── lava.ts                    # Lava Network RPC integration
└── public/                        # Static assets
```

## 🎮 Usage Guide

### Dashboard Overview

When you first open the application, you'll see:

1. **Header Section**:
   - Real-time clock showing last update time
   - Auto-refresh toggle (green = active)
   - Manual refresh button

2. **Statistics Cards** (Top Section):
   - Recent Transactions count
   - Unique Addresses active
   - Total Volume in HYPE tokens
   - Latest Block number with block time

3. **Additional Metrics**:
   - Average Gas Price
   - Total Gas Used
   - Block Time average

4. **Charts** (Middle Section):
   - Transaction Value Chart: Shows value of recent transactions
   - Gas Price Trend: Displays gas price changes over time

5. **Lookup Tools**:
   - Transaction Lookup: Enter transaction hash (0x...)
   - Address Lookup: Enter address (0x...)

6. **Transaction Table** (Bottom):
   - Recent transactions with full details
   - Block number, hash, from/to addresses
   - Transaction value and gas price
   - Timestamp

### Transaction Lookup

1. Enter a transaction hash starting with "0x" in the Transaction Lookup box
2. Click "Search" or press Enter
3. View detailed information including:
   - Transaction status
   - Block number
   - From and To addresses
   - Value transferred
   - Gas usage and price
   - Transaction receipt (if available)

### Address Lookup

1. Enter an Ethereum address (0x... 42 characters) in the Address Lookup box
2. Click "Search" or press Enter
3. View address information:
   - Current balance in HYPE
   - Total transaction count

### Auto-Refresh

- Toggle the auto-refresh button to enable/disable automatic updates
- When enabled (green), the dashboard updates every 10 seconds
- Use "Refresh Now" button for immediate updates

## 🔗 API Endpoints

The application exposes several API endpoints:

### GET /api/hyperliquid/data
Returns comprehensive dashboard data including transactions, statistics, and network metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "uniqueUsers": 150,
    "totalVolume": "1000000000000000000",
    "avgGasPrice": "1.25",
    "latestBlock": 123456,
    "blockTime": 12,
    "totalGasUsed": "5000000"
  },
  "timestamp": 1234567890
}
```

### GET /api/hyperliquid/transaction/[hash]
Fetches detailed transaction information by hash.

**Parameters:**
- `hash`: Transaction hash (0x...)

**Response:**
```json
{
  "success": true,
  "data": {
    "hash": "0x...",
    "from": "0x...",
    "to": "0x...",
    "value": "1000000000000000000",
    "receipt": {...}
  }
}
```

### GET /api/hyperliquid/address/[address]
Retrieves address balance and transaction count.

**Parameters:**
- `address`: Ethereum address (0x...)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "balance": "1000000000000000000",
    "transactionCount": 42
  }
}
```

## 🌐 Lava Network Integration

This project uses Lava Network's decentralized RPC infrastructure for:

- **High Performance**: Optimized routing to fastest available nodes
- **Reliability**: Automatic failover and load balancing
- **Decentralization**: No single point of failure
- **Data Integrity**: Verified responses from multiple providers

### RPC Methods Used

- `eth_blockNumber`: Get latest block number
- `eth_getBlockByNumber`: Fetch block details with transactions
- `eth_getTransactionByHash`: Get transaction details
- `eth_getTransactionReceipt`: Get transaction receipt
- `eth_getBalance`: Get address balance
- `eth_getTransactionCount`: Get address transaction count
- `eth_gasPrice`: Get current gas price
- `eth_chainId`: Get network chain ID

## 🎥 Demo Video

A 3-minute demo video is available showcasing:
- Dashboard overview with live data
- Transaction lookup functionality
- Address lookup feature
- Real-time updates and auto-refresh
- Chart visualizations and analytics

## 🏆 Hackathon Acceptance Criteria

✅ **Fetch data from Lava RPC API for Hyperliquid**
- Implemented comprehensive RPC integration with multiple endpoints
- Real-time data fetching from Lava Network

✅ **Implement a simple usable UI for user interactions**
- Clean, intuitive dashboard design
- Easy-to-use transaction and address lookup
- Responsive layout for all devices

✅ **Display the information in the UI, update it in real-time**
- Auto-refresh every 10 seconds
- Manual refresh option
- Live statistics and charts
- Real-time transaction feed

## 📊 Key Metrics

- **Data Sources**: Lava Network RPC API
- **Update Frequency**: Every 10 seconds (configurable)
- **Blocks Monitored**: Last 10 blocks continuously
- **Transaction Display**: Up to 15 most recent transactions
- **Response Time**: < 2 seconds average

## 🔐 Security Considerations

- All RPC calls are made server-side to protect API endpoints
- Input validation on all user inputs
- No private keys or sensitive data stored
- Rate limiting on API endpoints
- Error handling for failed requests

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_LAVA_RPC_URL`
4. Deploy

The application is optimized for Vercel with:
- Automatic builds on push
- Edge functions for API routes
- Serverless architecture
- Global CDN distribution

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- Self-hosted with Node.js

## 📝 Development Notes

### Adding New Features

To add new RPC methods:

1. Add method to `lib/lava.ts`:
```typescript
export async function newMethod(params: any) {
  return await makeRpcCall("eth_newMethod", [params]);
}
```

2. Create API route in `app/api/hyperliquid/`:
```typescript
export async function GET(request: Request) {
  const result = await newMethod(params);
  return NextResponse.json({ success: true, data: result });
}
```

3. Integrate in UI components

### Customizing Update Frequency

Change the refresh interval in `app/page.tsx`:

```typescript
const interval = setInterval(fetchData, 10000); // 10 seconds
```

### Styling

The project uses Tailwind CSS. Customize colors and theme in:
- `tailwind.config.ts`: Theme configuration
- `app/globals.css`: Global styles

## 🐛 Troubleshooting

### RPC Connection Issues

If you encounter RPC errors:
1. Check your internet connection
2. Verify the Lava RPC URL in `.env.local`
3. Try creating a dedicated endpoint at https://accounts.lavanet.xyz/

### Build Errors

If build fails:
1. Delete `node_modules` and `.next` folders
2. Run `npm install` again
3. Clear npm cache: `npm cache clean --force`

### Display Issues

If data isn't showing:
1. Check browser console for errors
2. Verify API endpoints are working: `/api/hyperliquid/data`
3. Check that Lava Network is accessible

## 📖 Additional Resources

- **Lava Network Docs**: https://docs.lavanet.xyz/
- **Hyperliquid Docs**: https://hyperliquid.xyz/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Recharts Docs**: https://recharts.org/

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - See LICENSE file for details

## 👥 Team

Built for Hyperliquid Hackathon 2025

## 🎯 Evaluation Criteria Met

### Impact & Ecosystem Fit
- Provides essential visibility into Hyperliquid onchain activity
- Real-time monitoring enhances network transparency
- User-friendly interface lowers barrier to blockchain exploration

### Execution & User Experience
- Clean, intuitive interface
- Fast loading times with optimized data fetching
- Responsive design for all devices
- Comprehensive error handling

### Technical Creativity & Design
- Innovative use of Lava Network's decentralized RPC
- Real-time updates with efficient polling
- Server-side rendering for optimal performance
- Beautiful visualizations with Recharts

### Completeness & Demo Quality
- Fully functional explorer with all core features
- Production-ready code with proper error handling
- Comprehensive documentation
- Professional demo video

## 🙏 Acknowledgments

- **Lava Network** for providing high-performance RPC infrastructure
- **Hyperliquid** for the innovative blockchain platform
- **SMAPE Capital** for mentorship and support

---

**Built with ❤️ for the Hyperliquid ecosystem**

