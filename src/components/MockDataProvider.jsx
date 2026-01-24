import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/**
 * Live data source (Cloudflare Worker)
 */
const API_BASE = "https://kaching-room-engine.zhenshi1996799.workers.dev";

/**
 * Small helpers
 */
function normalizeAddr(s = "") {
  return String(s || "").trim().toLowerCase();
}

function isEvmAddress(s = "") {
  const x = normalizeAddr(s);
  return x.startsWith("0x") && x.length === 42;
}

/**
 * The backend already gives tier/state, but keep fallback:
 */
function tierFromMarketCap(marketCap) {
  const mc = Number(marketCap);
  if (!Number.isFinite(mc)) return null;
  if (mc >= 1000000) return "GOLD";
  if (mc >= 444444) return "PURPLE";
  if (mc >= 44444) return "BLUE";
  return null;
}

/**
 * Because backend (MVP) does not provide listeners/joinVelocity/speakersCount yet,
 * we derive "good enough" proxies from volume/swaps to keep UI ranking/carousel alive.
 *
 * Later: replace these with real RTC room stats.
 */
function deriveSocialSignals({ marketCap, volume5m, swaps5m }) {
  const mc = Number(marketCap) || 0;
  const vol = Number(volume5m) || 0;
  const swaps = Number(swaps5m) || 0;

  // listeners: influenced by activity + size
  const listeners = Math.max(
    0,
    Math.floor((Math.log10(mc + 10) * 18) + (vol / 1200) + (swaps * 0.8))
  );

  // join velocity: more dependent on swaps/short-term volume
  const joinVelocity = Math.max(
    0,
    Math.floor((swaps / 3) + (vol / 6000))
  );

  const speakersCount = Math.max(0, Math.min(8, Math.floor(listeners / 80)));

  return { listeners, joinVelocity, speakersCount };
}

function calculatePopularityScore(token, allTokens) {
  const maxListeners = Math.max(...allTokens.map(t => t.listeners || 1), 1);
  const maxVelocity = Math.max(...allTokens.map(t => t.joinVelocity || 1), 1);

  const normalizedListeners = (token.listeners || 0) / maxListeners;
  const normalizedVelocity = (token.joinVelocity || 0) / maxVelocity;

  return 0.7 * normalizedListeners + 0.3 * normalizedVelocity;
}

function calculatePurpleRankingScore(token, allPurple) {
  const maxMarketCap = Math.max(...allPurple.map(t => t.marketCap || 1), 1);
  const maxVolume = Math.max(...allPurple.map(t => t.volume4m || 1), 1);
  const maxListeners = Math.max(...allPurple.map(t => t.listeners || 1), 1);

  return (
    0.5 * ((token.marketCap || 0) / maxMarketCap) +
    0.3 * (((token.volume4m || 0) / maxVolume)) +
    0.2 * (((token.listeners || 0) / maxListeners))
  );
}

/**
 * Map backend "room card" => app token shape
 * Backend /rooms/active returns: { rooms: [{ tokenAddress, roomId, state, tier, name, symbol, logo, marketCap, liquidityUSD, volume5m, swaps5m, updatedAt }], count }
 */
function mapRoomToToken(room, index = 0) {
  const tokenAddress = normalizeAddr(room?.tokenAddress || room?.token || room?.contractAddress || "");
  const name = room?.name || "";
  const symbol = room?.symbol || room?.ticker || "";

  const marketCap = Number(room?.marketCap ?? null);
  const liquidityUSD = Number(room?.liquidityUSD ?? null);
  const volume5m = Number(room?.volume5m ?? 0);
  const swaps5m = Number(room?.swaps5m ?? 0);

  const { listeners, joinVelocity, speakersCount } = deriveSocialSignals({ marketCap, volume5m, swaps5m });

  return {
    id: tokenAddress ? `token-${tokenAddress}` : `token-${index}`,
    roomId: room?.roomId || (tokenAddress ? `bsc:${tokenAddress}` : `bsc:unknown-${index}`),

    // keep original app fields
    name,
    ticker: symbol,                 // UI里若用 ticker，这里兼容
    symbol,                         // UI里若改为 symbol，也可用
    contractAddress: tokenAddress,  // UI里叫 contractAddress
    logo: room?.logo || null,

    // metrics
    marketCap: Number.isFinite(marketCap) ? marketCap : null,
    liquidityUSD: Number.isFinite(liquidityUSD) ? liquidityUSD : null,

    // your mock used 4m; backend provides 5m -> keep both
    volume4m: volume5m,
    swaps4m: swaps5m,
    volume5m,
    swaps5m,

    // state/tier
    state: room?.state || "INACTIVE",
    tier: room?.tier || tierFromMarketCap(marketCap),

    // social proxy
    holders: null, // MVP没提供，先留空
    listeners,
    joinVelocity,
    speakersCount,

    // ranking score placeholder (set later)
    popularityScore: 0,

    updatedAt: room?.updatedAt || null,

    // if backend later returns these in rooms list, we keep them
    statusReason: room?.statusReason ?? null,
    freezeReason: room?.freezeReason ?? null,
  };
}

/**
 * Map backend /token/status => app token shape
 * Backend returns:
 * { tokenAddress, state, tier, aboveCount, belowCount, statusReason, freezeReason, metrics: {marketCap, liquidityUSD, volume5m, swaps5m}, meta: {name, symbol, logo}, roomId, updatedAt }
 */
function mapStatusToToken(statusObj) {
  const tokenAddress = normalizeAddr(statusObj?.tokenAddress || "");
  const marketCap = Number(statusObj?.metrics?.marketCap ?? null);
  const liquidityUSD = Number(statusObj?.metrics?.liquidityUSD ?? null);
  const volume5m = Number(statusObj?.metrics?.volume5m ?? 0);
  const swaps5m = Number(statusObj?.metrics?.swaps5m ?? 0);

  const { listeners, joinVelocity, speakersCount } = deriveSocialSignals({ marketCap, volume5m, swaps5m });

  // approximate "sustained minutes" using aboveCount (cron is 1 minute in your backend MVP)
  const aboveCount = Number(statusObj?.aboveCount ?? 0);
  const sustainedMinutes = Math.max(0, aboveCount); // 1 count ~= 1 minute

  return {
    id: tokenAddress ? `token-${tokenAddress}` : `token-${Math.random().toString(16).slice(2)}`,
    roomId: statusObj?.roomId || (tokenAddress ? `bsc:${tokenAddress}` : "bsc:unknown"),
    name: statusObj?.meta?.name || "",
    ticker: statusObj?.meta?.symbol || "",
    symbol: statusObj?.meta?.symbol || "",
    contractAddress: tokenAddress,
    logo: statusObj?.meta?.logo || null,

    marketCap: Number.isFinite(marketCap) ? marketCap : null,
    liquidityUSD: Number.isFinite(liquidityUSD) ? liquidityUSD : null,

    volume4m: volume5m,
    swaps4m: swaps5m,
    volume5m,
    swaps5m,

    state: statusObj?.state || "INACTIVE",
    tier: statusObj?.tier || tierFromMarketCap(marketCap),

    listeners,
    joinVelocity,
    speakersCount,
    sustainedMinutes,

    popularityScore: 0,
    updatedAt: statusObj?.updatedAt || null,

    statusReason: statusObj?.statusReason ?? null,
    freezeReason: statusObj?.freezeReason ?? null,
  };
}

const MockDataContext = createContext(null);

export function MockDataProvider({ children }) {
  const [tokens, setTokens] = useState([]);

  // You said PNL can be removed for MVP — keep these as placeholders for UI toggles
  const [walletConnected, setWalletConnected] = useState(false);
  const [userHolding, setUserHolding] = useState(0.3);
  const [globalPNLTier, setGlobalPNLTier] = useState("Elite");

  const [watchlist, setWatchlist] = useState([]);

  // Optional: expose loading/error for UI
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);

  const pollTimerRef = useRef(null);

  /**
   * Load active rooms from backend
   */
  const loadRooms = useCallback(async () => {
    try {
      setLastError(null);

      const res = await fetch(`${API_BASE}/rooms/active`);
      const data = await res.json();

      const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
      const mapped = rooms.map((r, i) => mapRoomToToken(r, i));

      // compute popularity score
      const withScores = mapped.map(t => ({
        ...t,
        popularityScore: calculatePopularityScore(t, mapped),
      }));

      setTokens(withScores);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load rooms", err);
      setLastError("Failed to load rooms");
      setLoading(false);
    }
  }, []);

  /**
   * Initialize + polling refresh
   */
  useEffect(() => {
    loadRooms();

    // refresh every 20s (feel free to change)
    pollTimerRef.current = setInterval(loadRooms, 20_000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadRooms]);

  /**
   * Derived selectors (same as before)
   */
  const getActiveTokens = useCallback(() => {
    return tokens.filter(t => t.state === "ACTIVE");
  }, [tokens]);

  const getPopularNow = useCallback(() => {
    return getActiveTokens()
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, 10);
  }, [getActiveTokens]);

  const getPurpleRanking = useCallback(() => {
    const purple = tokens.filter(t => t.tier === "PURPLE" && t.state === "ACTIVE");
    return purple
      .map(t => ({ ...t, rankScore: calculatePurpleRankingScore(t, purple) }))
      .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
  }, [tokens]);

  const getGoldFeatured = useCallback(() => {
    return tokens
      .filter(t => t.tier === "GOLD" && t.state === "ACTIVE")
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
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

  /**
   * Search:
   * - If query is CA (0x..42): call backend /token/status and return a single mapped token (even if inactive/frozen)
   * - Else: local search over currently loaded tokens (active rooms list)
   */
  const searchTokens = useCallback(async (query) => {
    if (!query) return [];
    const q = String(query).trim();

    // CA search (remote)
    if (isEvmAddress(q)) {
      try {
        const res = await fetch(`${API_BASE}/token/status?ca=${encodeURIComponent(q)}`);
        const data = await res.json();

        // backend may return {error:...}
        if (data?.error) return [];

        const t = mapStatusToToken(data);
        // keep scoring compatible
        const withScore = { ...t, popularityScore: calculatePopularityScore(t, [t]) };
        return [withScore];
      } catch (err) {
        console.error("searchTokens remote failed", err);
        return [];
      }
    }

    // local fuzzy search
    const lower = q.toLowerCase();
    return tokens.filter(t =>
      (t.name || "").toLowerCase().includes(lower) ||
      (t.ticker || "").toLowerCase().includes(lower) ||
      (t.symbol || "").toLowerCase().includes(lower) ||
      (t.contractAddress || "").toLowerCase().includes(lower)
    );
  }, [tokens]);

  /**
   * Status reason:
   * - Prefer backend-provided statusReason/freezeReason
   * - Fallback to local rules if missing
   */
  const getStatusReason = useCallback((token) => {
    if (!token) return null;

    if (token.state === "ACTIVE") return null;

    if (token.state === "FROZEN") {
      return token.freezeReason || "已冻结：市值低于 44,444";
    }

    // INACTIVE
    if (token.statusReason) return token.statusReason;

    const reasons = [];
    if ((token.marketCap ?? 0) < 44444) reasons.push("市值不足 44,444");
    if ((token.liquidityUSD ?? 0) < 10000) reasons.push("流动性不足 10,000");
    const swaps = token.swaps4m ?? token.swaps5m ?? 0;
    const vol = token.volume4m ?? token.volume5m ?? 0;
    if (swaps < 20 && vol < 3000) reasons.push("活跃度不足（swaps < 20 且 volume < 3000）");

    return reasons.length > 0 ? `未达标：${reasons.join('、')}` : "未达标";
  }, []);

  /**
   * Expose value (keep existing API shape so other components don't break)
   */
  const value = {
    // data
    tokens,
    loading,
    lastError,

    // wallet placeholders
    walletConnected,
    setWalletConnected,
    userHolding,
    setUserHolding,
    globalPNLTier,
    setGlobalPNLTier,

    // watchlist
    watchlist,
    toggleWatchlist,
    getWatchlistTokens,

    // selectors
    getActiveTokens,
    getPopularNow,
    getPurpleRanking,
    getGoldFeatured,
    getToken,

    // search
    searchTokens,

    // reason
    getStatusReason,

    // manual refresh hook (useful for a refresh button)
    refresh: loadRooms,
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
