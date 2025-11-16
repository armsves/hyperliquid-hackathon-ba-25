# Testing Guide - LoopDrops Distribution System

## Quick Test Steps

### 1. Create a Test Distribution

1. Go to **Rewards** page
2. Click **"Create Test Distribution"** button (in the Distribution Stats card)
3. This creates a test distribution with your 3 Safe owners as recipients:
   - `0x6BbFd1F6dC17322a6e8923cf8072a735A081a975` - 1000 LOOP
   - `0x0DBA585a86bb828708b14d2F83784564Ae03a5d0` - 2000 LOOP
   - `0xB3D6f8C9BE8c7c4aE9aE5f124f7a70C285d3c076` - 1500 LOOP

### 2. Propose the Transaction (First Signature)

1. In the **Distributions** tab, find your test distribution
2. Click **"Propose"** button
3. Connect with one of your Safe owner wallets (e.g., `0x6BbFd1F6dC17322a6e8923cf8072a735A081a975`)
4. Confirm the transaction in your wallet
5. You'll see a Safe Transaction Hash - **copy this hash!**

### 3. Approve with Second Wallet (Second Signature)

1. Go to **"Approve Tx"** page in the navbar
2. Enter the Safe transaction hash from step 2
3. Connect with a **different** Safe owner wallet (e.g., `0x0DBA585a86bb828708b14d2F83784564Ae03a5d0`)
4. Click **"Approve Transaction"**
5. Confirm in your wallet
6. You should see "2 of 2 confirmations" - **Transaction is ready to execute!**

### 4. Execute the Transaction

1. Still on the **"Approve Tx"** page
2. With the transaction showing "Ready to execute"
3. Click **"Execute Transaction"** button
4. Confirm in your wallet
5. Transaction will execute and tokens will be distributed!

## Features to Test

### ✅ Distribution Management
- Upload CSV/JSON distribution lists
- View distribution history
- See transaction status

### ✅ Entitlements View
- Go to **Entitlements** tab
- See pending and earned amounts per address
- View all distributions for each recipient

### ✅ Audit Trail
- Go to **Audit Trail** tab
- See all actions (created, proposed, approved, executed)
- Filter by distribution ID
- View transaction hashes and actors

### ✅ Safe Management
- Go to **Safe Config** page
- View Safe owners and threshold
- Load Safe configuration

## Your Safe Details

- **Safe Address**: `0xf61aeCdF5D19ba4E175b5Bf902332870847A987E`
- **Owners**:
  1. `0x6BbFd1F6dC17322a6e8923cf8072a735A081a975` (hackaton wallet 2025)
  2. `0x0DBA585a86bb828708b14d2F83784564Ae03a5d0` (wallet con giovanni2)
  3. `0xB3D6f8C9BE8c7c4aE9aE5f124f7a70C285d3c076` (account 14)
- **Threshold**: 2 of 3 signers

## Token Addresses

- **LOOP**: `0x00fdbc53719604d924226215bc871d55e40a1009`
- **LEND**: (not configured yet)

## Troubleshooting

### "Safe contracts are not deployed"
- Safe contracts need to be deployed on Hyperliquid first
- See `DEPLOY_SAFE_CONTRACTS.md` for instructions
- Or set environment variables with deployed contract addresses

### "Transaction not found" when approving
- Make sure you copied the Safe Transaction Hash correctly
- The transaction must be proposed first before it can be approved

### "Not enough signatures"
- You need 2 of 3 signatures to execute
- Make sure you've approved with 2 different wallets

### Transaction creation fails
- Check that your wallet is connected
- Verify the Safe address is correct
- Ensure you have sufficient gas/funds

## API Endpoints

### Upload Distribution (Programmatic)
```bash
POST /api/rewards/distributions
{
  "type": "loopdrops",
  "recipients": [
    {"address": "0x...", "amount": "1000", "token": "LOOP"}
  ],
  "actor": "0x..." // optional
}
```

### Get Entitlements
```bash
GET /api/rewards/entitlements?address=0x...
```

### Get Audit Logs
```bash
GET /api/rewards/audit?distributionId=dist-1
```

## Next Steps

1. **Test the full flow**: Create → Propose → Approve (2x) → Execute
2. **Check entitlements**: Verify recipients see their pending amounts
3. **Review audit trail**: Confirm all actions are logged
4. **Test with real data**: Upload your actual distribution lists

