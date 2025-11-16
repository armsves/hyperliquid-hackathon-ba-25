# Simple Multisig for Hyperliquid

Since Safe contracts are not deployed on Hyperliquid, use this simpler multisig approach.

## Quick Start

### 1. Deploy SimpleMultisig Contract

Using Remix (easiest):

1. Go to https://remix.ethereum.org
2. Create `SimpleMultisig.sol` with the contract code from `contracts/SimpleMultisig.sol`
3. Compile with Solidity 0.8.x
4. Deploy:
   - Connect MetaMask to Hyperliquid (Testnet or Mainnet)
   - In deploy tab, enter constructor parameters:
     - `_owners`: `["0xYourAddress1","0xYourAddress2","0xYourAddress3"]`
     - `_threshold`: `2` (for 2-of-3 multisig)
   - Click "Deploy"
5. Copy the deployed contract address

### 2. Update .env.local

```env
NEXT_PUBLIC_SIMPLE_MULTISIG_ADDRESS=0xYourDeployedContractAddress
```

### 3. How It Works

**Proposing a Distribution:**
1. Owner 1 calls `executeBatchTransfer(token, recipients[], amounts[])`
2. Transaction is proposed and confirmed by Owner 1
3. If threshold not met, transaction waits for more confirmations

**Confirming:**
1. Owner 2 calls `confirmTransaction(txHash)` 
2. If threshold is met (e.g., 2 of 3), transaction executes automatically

**Checking Status:**
1. Call `getConfirmationCount(txHash)` to see how many confirmations

## Advantages Over Safe SDK

✅ **Works immediately** - No need for Safe infrastructure
✅ **Simple** - Easy to understand and audit
✅ **Gas efficient** - Minimal overhead
✅ **Customizable** - Easy to modify for your needs

## Integration with Dashboard

The dashboard will:
1. Generate `txHash` from distribution data
2. Show pending transactions
3. Allow owners to confirm via their connected wallets
4. Execute when threshold is met

## Contract Features

- ✅ Multiple owners with threshold signatures
- ✅ Batch token transfers
- ✅ Transaction confirmation tracking  
- ✅ Nonce-based replay protection
- ✅ Event logging for audit trail

## Example Usage

```solidity
// Deploy with 3 owners, 2-of-3 threshold
address[] memory owners = new address[](3);
owners[0] = 0xOwner1...;
owners[1] = 0xOwner2...;
owners[2] = 0xOwner3...;

SimpleMultisig multisig = new SimpleMultisig(owners, 2);

// Propose batch transfer (Owner 1)
address[] memory recipients = new address[](2);
recipients[0] = 0xRecipient1...;
recipients[1] = 0xRecipient2...;

uint256[] memory amounts = new uint256[](2);
amounts[0] = 1000 * 10**18;
amounts[1] = 2000 * 10**18;

multisig.executeBatchTransfer(tokenAddress, recipients, amounts);

// Confirm (Owner 2) - this will execute if threshold=2
bytes32 txHash = keccak256(abi.encodePacked(tokenAddress, recipients, amounts, nonce));
multisig.confirmTransaction(txHash);
```

## Security Considerations

- ✅ Owner validation in constructor
- ✅ No duplicate owners allowed
- ✅ Threshold validation
- ✅ Replay protection with nonce
- ✅ Transaction execution only after threshold met
- ✅ Owner-only functions

##Next Steps

1. Deploy the contract
2. Test with small amounts first
3. Integrate with the dashboard UI
4. Use for LoopDrops distributions

This approach meets the hackathon requirement for multisig while being practical for Hyperliquid!

