const AUTH_TOKEN = process.env.BITQUERY_AUTH_TOKEN!;
import { GET_TOKEN_ANALYTICS_QUERY } from "../queries/allQueryFile";
// Define cache at module level (shared across calls)
const analyticsCache = new Map<string, any>();

// utils/tokenRelatedUtils.ts
import axios from "axios";

export async function decodeMetadata(uri: string) {
  try {
    let url = uri;
    if (uri.startsWith("ipfs://")) url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    if (uri.startsWith("ar://")) url = uri.replace("ar://", "https://arweave.net/");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error("decodeMetadata error:", err);
    return null;
  }
}

export async function getTokenAnalytics(mint: string) {
    if (analyticsCache.has(mint)) {
      return analyticsCache.get(mint);
    }

    try {
      const res = await fetch("https://streaming.bitquery.io/eap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          query: GET_TOKEN_ANALYTICS_QUERY,
          variables: { tokenMint: mint },
        }),
      });

      const json = await res.json();
      // console.log("analytics response:", JSON.stringify(json, null, 2));

      const analytics = json.data?.Solana || {};

      // Safely extract values with fallbacks
      const allTimeStats = analytics.all_time_trading_stats?.[0] ?? {};
      const currentStats = analytics.current_trading_stats?.[0] ?? {};
      const holderStats = analytics.holder_count?.[0] ?? {};

      const analyticsData = {
        totalBuys: allTimeStats.total_buys ?? 0,
        totalSells: allTimeStats.total_sells ?? 0,
        totalTrades: allTimeStats.total_trades ?? 0,
        allTimeVolumeUSD: allTimeStats.current_volume_usd ?? 0,

        currentVolumeUSD: currentStats.current_volume_usd ?? 0,
        holderCount: holderStats.total_holders ?? 0,
      };

      analyticsCache.set(mint, analyticsData);

      // Auto-expire after 5 minutes
      setTimeout(() => analyticsCache.delete(mint), 5 * 60 * 1000);

      return analyticsData;
    } catch (err) {
      console.error("getTokenAnalytics error:", err);
      return {
        totalBuys: 0,
        totalSells: 0,
        totalTrades: 0,
        allTimeVolumeUSD: 0,
        currentVolumeUSD: 0,
        holderCount: 0,
      };
    }
  }
