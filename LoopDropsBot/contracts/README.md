# Smart Contracts

This directory contains the smart contracts for the Yield Optimizer platform.

## Contracts

### YieldOptimizer.sol
ERC-7540 compatible vault for GlueX yield optimization.

**Features:**
- Whitelisted vault management
- User deposit/withdraw
- Rebalancing functionality
- Restricted to approved vaults only

**Deployment:**
```bash
forge build
forge script script/DeployYieldOptimizer.sol --rpc-url $RPC_URL --broadcast
```

### HypurrFiStrategy.sol
ERC-4626 style vault for HypurrFi leverage loops.

**Features:**
- Leveraged position management
- Health factor tracking
- Automatic deleveraging
- One-click leverage loops

**Deployment:**
```bash
forge build
forge script script/DeployHypurrFiStrategy.sol --rpc-url $RPC_URL --broadcast
```

## Setup

### Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### Compile
```bash
forge build
```

### Test
```bash
forge test
```

## Security

- All contracts restrict interactions to whitelisted addresses
- Health factor checks prevent unsafe positions
- Owner-only functions for critical operations
- Input validation on all user inputs

