import { ethers } from "ethers";

/**
 * ERC20 ABI - only the methods we need
 */
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// BSC mainnet chain id
const BSC_CHAIN_ID_DEC = 56;
const BSC_CHAIN_ID_HEX = "0x38";

export function isWalletAvailable() {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

export async function getChainIdHex() {
  if (!isWalletAvailable()) return null;
  try {
    return await window.ethereum.request({ method: "eth_chainId" });
  } catch {
    return null;
  }
}

/**
 * Ensure user is on BSC chain (56 / 0x38)
 * trySwitch=true: attempt wallet_switchEthereumChain
 */
export async function ensureBscChain({ trySwitch = true } = {}) {
  const chainId = await getChainIdHex();
  if (!chainId) return { ok: false, reason: "NO_WALLET" };

  if (String(chainId).toLowerCase() === BSC_CHAIN_ID_HEX) return { ok: true };

  if (!trySwitch) return { ok: false, reason: "WRONG_CHAIN", chainId };

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN_ID_HEX }],
    });
    return { ok: true, switched: true };
  } catch (e) {
    // 4902: chain not added
    if (e?.code === 4902) {
      // try add BSC
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: BSC_CHAIN_ID_HEX,
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com/"],
            },
          ],
        });
        return { ok: true, added: true };
      } catch (e2) {
        return { ok: false, reason: "ADD_CHAIN_FAILED", error: e2 };
      }
    }
    return { ok: false, reason: "SWITCH_CHAIN_FAILED", error: e, chainId };
  }
}

/**
 * Connect to browser wallet (MetaMask / OKX / Rabby etc.)
 * Returns: { address, provider, signer }
 */
export async function connectWallet({ requireBsc = true, trySwitch = true } = {}) {
  if (!isWalletAvailable()) {
    throw new Error("NO_WALLET");
  }

  if (requireBsc) {
    const ok = await ensureBscChain({ trySwitch });
    if (!ok?.ok) {
      const r = ok?.reason || "WRONG_CHAIN";
      const err = new Error(r);
      err.detail = ok;
      throw err;
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Request account access
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, provider, signer };
}

/**
 * BigInt safe percent = balance/totalSupply * 100
 * Return number (0-100, can exceed 100 if token broken but generally 0-100)
 *
 * NOTE: We don't need decimals for percentage, but we try fetch it anyway for better compatibility.
 */
export async function getUserTokenHolding(tokenAddress, userAddress, provider) {
  if (!tokenAddress || !userAddress || !provider) return 0;

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [balance, totalSupply] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.totalSupply(),
    ]);

    // balance & totalSupply are BigInt in ethers v6
    if (!totalSupply || totalSupply === 0n) return 0;

    // Use scaled integer math to keep precision: percent * 10000 (basis points)
    // shareBps = balance * 1_000_000 / totalSupply  (because 100% = 1_000_000 bps? no)
    // We'll use 1e6 as "micro-percent" (0.0001%) then convert.
    const SCALE = 1_000_000n;
    const microPercent = (balance * 100n * SCALE) / totalSupply; // percent * 1e6
    const percent = Number(microPercent) / Number(SCALE);

    // clamp to [0, 100] just in case
    if (!Number.isFinite(percent) || percent < 0) return 0;
    return percent > 100 ? 100 : percent;
  } catch (error) {
    console.error("Failed to read token holding:", error);
    return 0;
  }
}

/**
 * Listen to account changes
 */
export function onAccountsChanged(callback) {
  if (!isWalletAvailable()) return () => {};

  const handler = (accounts) => {
    callback(accounts?.[0] || null);
  };

  window.ethereum.on("accountsChanged", handler);

  return () => {
    window.ethereum.removeListener("accountsChanged", handler);
  };
}

/**
 * Listen to chain changes
 */
export function onChainChanged(callback) {
  if (!isWalletAvailable()) return () => {};

  const handler = (chainId) => callback(chainId);

  window.ethereum.on("chainChanged", handler);

  return () => {
    window.ethereum.removeListener("chainChanged", handler);
  };
}

