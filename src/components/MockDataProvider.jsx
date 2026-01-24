import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const MOCK_TOKENS_BASE = [
  { name: "Pepe Classic", ticker: "PEPE", marketCap: 2500000, liquidityUSD: 85000, volume4m: 12000, swaps4m: 45, holders: 3200, listeners: 156, joinVelocity: 12 },
  { name: "Doge Moon", ticker: "DMOON", marketCap: 890000, liquidityUSD: 42000, volume4m: 8500, swaps4m: 32, holders: 1800, listeners: 89, joinVelocity: 8 },
  { name: "Shiba Army", ticker: "SARMY", marketCap: 650000, liquidityUSD: 28000, volume4m: 5600, swaps4m: 25, holders: 1200, listeners: 67, joinVelocity: 6 },
  { name: "Cat Coin", ticker: "CATC", marketCap: 480000, liquidityUSD: 22000, volume4m: 4200, swaps4m: 22, holders: 890, listeners: 45, joinVelocity: 5 },
  { name: "Frog Finance", ticker: "FROG", marketCap: 320000, liquidityUSD: 18000, volume4m: 3800, swaps4m: 28, holders: 720, listeners: 38, joinVelocity: 4 },
  { name: "Moon Rabbit", ticker: "MRAB", marketCap: 180000, liquidityUSD: 15000, volume4m: 3200, swaps4m: 21, holders: 560, listeners: 28, joinVelocity: 3 },
  { name: "Ape Together", ticker: "APET", marketCap: 95000, liquidityUSD: 12000, volume4m: 2800, swaps4m: 18, holders: 420, listeners: 22, joinVelocity: 2 },
  { name: "Diamond Hands", ticker: "DHND", marketCap: 72000, liquidityUSD: 11000, volume4m: 3500, swaps4m: 24, holders: 380, listeners: 18, joinVelocity: 2 },
  { name: "Rocket Token", ticker: "RCKT", marketCap: 55000, liquidityUSD: 10500, volume4m: 3100, swaps4m: 22, holders: 310, listeners: 15, joinVelocity: 1 },
  { name: "Bull Run", ticker: "BULL", marketCap: 48000, liquidityUSD: 10200, volume4m: 3300, swaps4m: 25, holders: 280, listeners: 12, joinVelocity: 1 },
  { name: "Bear Market", ticker: "BEAR", marketCap: 42000, liquidityUSD: 8000, volume4m: 2500, swaps4m: 15, holders: 220, listeners: 8, joinVelocity: 1 },
  { name: "Whale Alert", ticker: "WHALE", marketCap: 38000, liquidityUSD: 7500, volume4m: 2200, swaps4m: 12, holders: 180, listeners: 6, joinVelocity: 0 },
  { name: "Pump It", ticker: "PUMP", marketCap: 30000, liquidityUSD: 5000, volume4m: 1800, swaps4m: 8, holders: 150, listeners: 0, joinVelocity: 0 },
  { name: "Dump Token", ticker: "DUMP", marketCap: 22000, liquidityUSD: 3000, volume4m: 800, swaps4m: 5, holders: 90, listeners: 0, joinVelocity: 0 },
  { name: "Rug Pull", ticker: "RUG", marketCap: 15000, liquidityUSD: 2000, volume4m: 500, swaps4m: 3, holders: 50, listeners: 0, joinVelocity: 0 }
];

function getTier(marketCap) {
  if (marketCap >= 1000000) return "GOLD";
  if (marketCap >= 444444) return "PURPLE";
  return "BLUE";
}

function getState(token, sustainedMinutes = 5) {
  const meetsCreation = 
    token.marketCap >= 44444 &&
    token.liquidityUSD >= 10000 &&
    (token.swaps4m >= 20 || token.volume4m >= 3000);
  
  if (meetsCreation && sustainedMinutes >= 4) {
    return "ACTIVE";
  }
  
  if (token.marketCap < 44444 && sustainedMinutes >= 7) {
    return "FROZEN";
  }
  
  if (token.state === "ACTIVE") return "ACTIVE";
  if (token.state === "FROZEN") return "FROZEN";
  
  return "INACTIVE";
}

function calculatePopularityScore(token, allTokens) {
  const maxListeners = Math.max(...allTokens.map(t => t.listeners || 1));
  const maxVelocity = Math.max(...allTokens.map(t => t.joinVelocity || 1));
  
  const normalizedListeners = (token.listeners || 0) / maxListeners;
  const normalizedVelocity = (token.joinVelocity || 0) / maxVelocity;
  
  return 0.7 * normalizedListeners + 0.3 * normalizedVelocity;
}

function calculatePurpleRankingScore(token, allPurple) {
  const maxMarketCap = Math.max(...allPurple.map(t => t.marketCap || 1));
  const maxVolume = Math.max(...allPurple.map(t => t.volume4m || 1));
  const maxListeners = Math.max(...allPurple.map(t => t.listeners || 1));
  
  return (
    0.5 * (token.marketCap / maxMarketCap) +
    0.3 * ((token.volume4m || 0) / maxVolume) +
    0.2 * ((token.listeners || 0) / maxListeners)
  );
}

const MockDataContext = createContext(null);

export function MockDataProvider({ children }) {
  const [tokens, setTokens] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userHolding, setUserHolding] = useState(0.3);
  const [globalPNLTier, setGlobalPNLTier] = useState("Elite");
  const [watchlist, setWatchlist] = useState([]);

  // Initialize tokens
  useEffect(() => {
    const initialTokens = MOCK_TOKENS_BASE.map((t, i) => {
      const sustainedMinutes = Math.floor(Math.random() * 10) + 4;
      const tier = getTier(t.marketCap);
      const state = getState({ ...t, state: "INACTIVE" }, sustainedMinutes);
      return {
        ...t,
        id: `token-${i}`,
        tier,
        state: state === "INACTIVE" && t.marketCap >= 44444 ? "ACTIVE" : state,
        sustainedMinutes,
        speakersCount: Math.floor(Math.random() * 5),
        popularityScore: 0
      };
    });
    
    // Calculate popularity scores
    const withScores = initialTokens.map(t => ({
      ...t,
      popularityScore: calculatePopularityScore(t, initialTokens)
    }));
    
    setTokens(withScores);
  }, []);

  // Simulate market changes every 10-20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => {
        const updated = prev.map(token => {
          // Random market cap change (-10% to +15%)
          const change = 1 + (Math.random() * 0.25 - 0.1);
          const newMarketCap = Math.floor(token.marketCap * change);
          
          // Random listener changes
          const listenerChange = Math.floor(Math.random() * 10) - 3;
          const newListeners = Math.max(0, (token.listeners || 0) + listenerChange);
          
          // Random velocity
          const newVelocity = Math.max(0, Math.floor(Math.random() * 15));
          
          // Update sustained minutes
          const newSustained = token.sustainedMinutes + 1;
          
          const newTier = getTier(newMarketCap);
          const newState = getState({ ...token, marketCap: newMarketCap }, newSustained);
          
          return {
            ...token,
            marketCap: newMarketCap,
            listeners: newListeners,
            joinVelocity: newVelocity,
            tier: newTier,
            state: newState,
            sustainedMinutes: newSustained,
            speakersCount: Math.floor(Math.random() * 5)
          };
        });
        
        // Recalculate popularity scores
        return updated.map(t => ({
          ...t,
          popularityScore: calculatePopularityScore(t, updated)
        }));
      });
    }, 15000); // Every 15 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getActiveTokens = useCallback(() => {
    return tokens.filter(t => t.state === "ACTIVE");
  }, [tokens]);

  const getPopularNow = useCallback(() => {
    return getActiveTokens()
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 10);
  }, [getActiveTokens]);

  const getPurpleRanking = useCallback(() => {
    const purple = tokens.filter(t => t.tier === "PURPLE" && t.state === "ACTIVE");
    return purple
      .map(t => ({ ...t, rankScore: calculatePurpleRankingScore(t, purple) }))
      .sort((a, b) => b.rankScore - a.rankScore);
  }, [tokens]);

  const getGoldFeatured = useCallback(() => {
    return tokens
      .filter(t => t.tier === "GOLD" && t.state === "ACTIVE")
      .sort((a, b) => b.marketCap - a.marketCap);
  }, [tokens]);

  const getToken = useCallback((id) => {
    return tokens.find(t => t.id === id);
  }, [tokens]);

  const toggleWatchlist = useCallback((tokenId) => {
    setWatchlist(prev => 
      prev.includes(tokenId)
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    );
  }, []);

  const getWatchlistTokens = useCallback(() => {
    return tokens.filter(t => watchlist.includes(t.id));
  }, [tokens, watchlist]);

  const value = {
    tokens,
    walletConnected,
    setWalletConnected,
    userHolding,
    setUserHolding,
    globalPNLTier,
    setGlobalPNLTier,
    watchlist,
    toggleWatchlist,
    getActiveTokens,
    getPopularNow,
    getPurpleRanking,
    getGoldFeatured,
    getToken,
    getWatchlistTokens
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within MockDataProvider');
  }
  return context;
}