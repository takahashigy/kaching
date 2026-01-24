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

export async function ensureBscChain({ trySwitch = true } = {}) {
  const chainId = await getChainIdHex();
  if (!chainId) return { ok: false, reason: "NO_WALLET" };

  if (chainId.toLowerCase() === BSC_CHAIN_ID_HEX) return { ok: true };

  // 如果你不想自动切换，就返回错误让 UI 提示
  if (!trySwitch) return { ok: false, reason: "WRONG_CHAIN", chainId };

  // 尝试切到 BSC
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN_ID_HEX }],
    });
    return { ok: true };
  } catch (e) {
    // 有些钱包没添加 BSC，会报 4902，需要 addChain
    if (e?.code === 4902) {
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
        return { ok: true };
      } catch (e2) {
        return { ok: false, reason: "ADD_CHAIN_FAILED", error: e2 };
      }
    }
    return { ok: false, reason: "SWITCH_CHAIN_FAILED", error: e };
  }
}

/**
 * Connect to browser wallet (MetaMask / OKX / Rabby etc.)
 * @returns {Promise<{address: string, provider: ethers.BrowserProvider, signer: ethers.Signer}>}
 */
export async function connectWallet() {
  if (!isWalletAvailable()) {
    console.warn("No browser wallet detected. Please install MetaMask, OKX, or Rabby.");
    throw new Error("No wallet available");
  }

  // 先确保在 BSC（你只做 BSC meme）
  const bsc = await ensureBscChain({ trySwitch: true });
  if (!bsc.ok) {
    console.warn("Not on BSC chain:", bsc);
    throw new Error("Wrong chain (please switch to BSC)");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Request account access
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, provider, signer };
}

/**
 * Get user's token holding percentage
 * NOTE: 必须避免 BigInt -> Number 溢出
 * @returns {Promise<{sharePercent:number, balance:string, totalSupply:string, decimals:number}>}
 */
export async function getUserTokenHolding(tokenAddress, userAddress, provider) {
  if (!tokenAddress || !userAddress || !provider) {
    return { sharePercent: 0, balance: "0", totalSupply: "0", decimals: 18 };
  }

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [balanceRaw, totalSupplyRaw, decimals] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.totalSupply(),
      contract.decimals(),
    ]);

    // totalSupplyRaw/balanceRaw are BigInt
    if (totalSupplyRaw === 0n) {
      return { sharePercent: 0, balance: "0", totalSupply: "0", decimals: Number(decimals) };
    }

    // 用 BigInt 做比例，避免溢出：share% = balance/total *100
    // 先放大 1e6 保留 6 位小数
    const SCALE = 1_000_000n;
    const shareScaled = (balanceRaw * 100n * SCALE) / totalSupplyRaw;
    const sharePercent = Number(shareScaled) / Number(SCALE);

    // 这些展示值可选
    const balance = ethers.formatUnits(balanceRaw, decimals);
    const totalSupply = ethers.formatUnits(totalSupplyRaw, decimals);

    return { sharePercent, balance, totalSupply, decimals: Number(decimals) };
  } catch (error) {
    console.error("Failed to read token holding:", error);
    return { sharePercent: 0, balance: "0", totalSupply: "0", decimals: 18 };
  }
}

/**
 * Listen to account changes
 */
export function onAccountsChanged(callback) {
  if (!isWalletAvailable()) return () => {};

  const handler = (accounts) => callback(accounts?.[0] || null);

  window.ethereum.on("accountsChanged", handler);
  return () => window.ethereum.removeListener("accountsChanged", handler);
}

/**
 * Listen to chain changes
 */
export function onChainChanged(callback) {
  if (!isWalletAvailable()) return () => {};

  const handler = (chainId) => callback(chainId);

  window.ethereum.on("chainChanged", handler);
  return () => window.ethereum.removeListener("chainChanged", handler);
}
