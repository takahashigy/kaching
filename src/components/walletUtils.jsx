import { ethers } from 'ethers';

/**
 * ERC20 ABI - only the methods we need
 */
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)"
];

/**
 * Check if browser wallet is available
 */
export function isWalletAvailable() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

/**
 * Connect to browser wallet (MetaMask / OKX / Rabby etc.)
 * @returns {Promise<{address: string, provider: ethers.BrowserProvider, signer: ethers.Signer}>}
 */
export async function connectWallet() {
  if (!isWalletAvailable()) {
    console.warn('No browser wallet detected. Please install MetaMask, OKX, or Rabby.');
    throw new Error('No wallet available');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    await provider.send("eth_requestAccounts", []);
    
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return { address, provider, signer };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

/**
 * Get user's token holding percentage
 * @param {string} tokenAddress - Token contract address
 * @param {string} userAddress - User wallet address
 * @param {ethers.BrowserProvider} provider - Ethers provider
 * @returns {Promise<number>} - Holding percentage (0-100)
 */
export async function getUserTokenHolding(tokenAddress, userAddress, provider) {
  if (!tokenAddress || !userAddress || !provider) {
    return 0;
  }

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Read balance, totalSupply, and decimals
    const [balance, totalSupply, decimals] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.totalSupply(),
      contract.decimals()
    ]);

    // Calculate percentage
    if (totalSupply === 0n) return 0;
    
    const sharePercent = (Number(balance) / Number(totalSupply)) * 100;
    
    return sharePercent;
  } catch (error) {
    console.error('Failed to read token holding:', error);
    return 0;
  }
}

/**
 * Listen to account changes
 */
export function onAccountsChanged(callback) {
  if (!isWalletAvailable()) return () => {};
  
  const handler = (accounts) => {
    callback(accounts[0] || null);
  };
  
  window.ethereum.on('accountsChanged', handler);
  
  return () => {
    window.ethereum.removeListener('accountsChanged', handler);
  };
}

/**
 * Listen to chain changes
 */
export function onChainChanged(callback) {
  if (!isWalletAvailable()) return () => {};
  
  window.ethereum.on('chainChanged', callback);
  
  return () => {
    window.ethereum.removeListener('chainChanged', callback);
  };
}