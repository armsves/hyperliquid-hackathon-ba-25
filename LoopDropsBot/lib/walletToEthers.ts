import { WalletClient } from "viem";
import { BrowserProvider, JsonRpcSigner } from "ethers";

/**
 * Convert a wagmi WalletClient to an ethers signer
 * This allows using wagmi wallet with ethers-based libraries like Safe SDK
 * 
 * The WalletClient implements EIP-1193, which ethers BrowserProvider can use directly
 */
export async function walletClientToEthersSigner(walletClient: WalletClient): Promise<JsonRpcSigner> {
  if (!walletClient) {
    throw new Error("Wallet client not available");
  }

  // Get the account from wallet client
  const [account] = await walletClient.getAddresses();
  if (!account) {
    throw new Error("No account found in wallet");
  }

  // Create an EIP-1193 compatible provider wrapper
  // WalletClient implements the EIP-1193 interface that ethers expects
  const eip1193Provider = {
    request: async (args: { method: string; params?: any[] }) => {
      return await walletClient.request({
        method: args.method as any,
        params: args.params as any,
      });
    },
    on: () => {},
    removeListener: () => {},
  };

  // Create BrowserProvider with the EIP-1193 provider
  const provider = new BrowserProvider(eip1193Provider as any);

  // Get signer for the account
  const signer = await provider.getSigner(account);
  
  return signer;
}

