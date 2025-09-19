// ==== File: server/src/workers/discoveryWorker.ts ====

import cron from "node-cron";
import axios from "axios";
import knex from "../db/knex";
import { redisClient } from "../redis/redisClient";
import {
  BLUECHIP_MEMES_QUERY,
  xSTOCK_TOKENS_QUERY,
  VERIFIED_LSTS_QUERY,
  AI_TOKENS_QUERY,
  TRENDING_TOKENS_QUERY,
  POPULAR_TOKENS_QUERY,
  TOKEN_DETAIL,
} from "../queries/allQueryFile";
import { sanitizeString } from "../services/bitQueryService";
const BITQUERY_URL =
  process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap";
// ====================== Config ======================
const REDIS_TTL = Number(process.env.DISCOVERY_CACHE_TTL ?? 120);
const DETAIL_BATCH_SIZE = Number(process.env.DETAIL_BATCH_SIZE ?? 5);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ====================== Utils ======================
async function decodeMetadata(uri?: string | null): Promise<string | null> {
  if (!uri) return null;
  try {
    let url = uri;
    if (uri.startsWith("ipfs://")) url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    if (uri.startsWith("ar://")) url = uri.replace("ar://", "https://arweave.net/");
    const res = await axios.get(url, { timeout: 15000 });
    const data = res.data;
    return data?.image ?? null;
  } catch (err: any) {
    console.warn("⚠️ decodeMetadata failed:", uri, err.message);
    return null;
  }
}

async function fetchTokenDetailBatch(tokens: any[]): Promise<any[]> {
  for (let i = 0; i < tokens.length; i += DETAIL_BATCH_SIZE) {
    const batch = tokens.slice(i, i + DETAIL_BATCH_SIZE);
    const mintAddresses = batch.map((t) => t.mint);
    try {
      const res = await axios.post(
        process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
        { query: TOKEN_DETAIL, variables: { mintAddresses } },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
          },
          timeout: 60_000,
        }
      );

      const solanaData = res.data?.data?.Solana;
      if (solanaData) {
        for (const tok of batch) {
          const supplyUpdate = solanaData.TokenSupplyUpdates?.find(
            (u: any) => u.TokenSupplyUpdate?.Currency?.MintAddress === tok.mint
          )?.TokenSupplyUpdate;

          const latestPrice = solanaData.LatestPrice?.find(
            (p: any) => p.Trade?.Currency?.MintAddress === tok.mint
          )?.Trade?.PriceInUSD;

          let marketcap = tok.marketcap ?? null;
          if ((supplyUpdate?.PostBalanceInUSD ?? 0) > 0) {
            marketcap = supplyUpdate.PostBalanceInUSD;
          } else if (supplyUpdate?.PostBalance && latestPrice) {
            marketcap = Number(supplyUpdate.PostBalance) * Number(latestPrice);
          }

          const priceChangeEntry = solanaData.PriceChange24h?.find(
            (pc: any) => pc.Trade?.Currency?.MintAddress === tok.mint
          );
          const priceChange24h = priceChangeEntry?.PriceChange24h ?? null;

          tok.marketcap = marketcap;
          tok.price_change_24h = priceChange24h;
        }
      }
    } catch (err: any) {
      console.warn("⚠️ fetchTokenDetailBatch failed:", err.message);
    }
    await sleep(500);
  }
  return tokens;
}

async function saveTokens(tokens: any[], category: string, redisKey: string) {
  // Save DB
  const trx = await knex.transaction();
  try {
    for (const t of tokens) {
      await trx("discovery_tokens")
        .insert({ ...t, category })
        .onConflict(["mint", "category"])
        .merge();
    }
    await trx.commit();
  } catch (err) {
    await trx.rollback();
    console.error("❌ DB save error:", category, err);
  }

  // Save Redis
  try {
    await redisClient.set(redisKey, JSON.stringify(tokens), { EX: REDIS_TTL });
  } catch (err) {
    console.error("❌ Redis save error:", redisKey, err);
  }
}

// ====================== Category Fetchers ======================
async function fetchBluechipMemesNow() {
  console.log("🔄 Fetching Bluechip Memes...");
  try {
    const response = await axios.post(
       BITQUERY_URL,
      { query: BLUECHIP_MEMES_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
        timeout: 60_000,
      }
    );

    const updates = response.data?.data?.Solana?.TokenSupplyUpdates ?? [];
    const tokens: any[] = [];
    for (const entry of updates) {
      const update = entry.TokenSupplyUpdate ?? {};
      const currency = update.Currency ?? {};
      const mint = currency.MintAddress;
      if (!mint) continue;

      tokens.push({
        mint,
        name: sanitizeString(currency.Name),
        symbol: sanitizeString(currency.Symbol),
        uri: sanitizeString(currency.Uri),
        image: await decodeMetadata(currency.Uri),
        marketcap: update.Marketcap ?? null,
        price_change_24h: null,
        updated_at: new Date(),
      });
    }

    await fetchTokenDetailBatch(tokens);
    await saveTokens(tokens, "bluechip_meme", "bluechip-memes");
    console.log(`✅ Saved ${tokens.length} bluechip memes`);
  } catch (err: any) {
    console.error("❌ fetchBluechipMemesNow error:", err.message);
  }
}

async function fetchXStockNow() {
  console.log("🔄 Fetching xStock tokens...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: xSTOCK_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];
    const seen = new Map<string, any>();
    for (const entry of trades) {
      const c = entry.Trade?.Currency ?? {};
      const mint = c.MintAddress;
      if (!mint || seen.has(mint)) continue;
      seen.set(mint, {
        mint,
        name: c.Name ?? null,
        symbol: c.Symbol ?? null,
        uri: c.Uri ?? null,
        image: await decodeMetadata(c.Uri),
      });
    }

    const tokens = Array.from(seen.values());
    await fetchTokenDetailBatch(tokens);
    await saveTokens(tokens, "xstock", "xstock-tokens");
    console.log(`✅ Saved ${tokens.length} xStock tokens`);
  } catch (err: any) {
    console.error("❌ fetchXStockNow error:", err.message);
  }
}

async function fetchLstsNow() {
  console.log("🔄 Fetching Verified LSTs...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: VERIFIED_LSTS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];
    const seen = new Map<string, any>();
    for (const entry of trades) {
      const c = entry.Trade?.Currency ?? {};
      const mint = c.MintAddress;
      if (!mint || seen.has(mint)) continue;
      seen.set(mint, {
        mint,
        name: c.Name ?? null,
        symbol: c.Symbol ?? null,
        uri: c.Uri ?? null,
        image: await decodeMetadata(c.Uri),
      });
    }

    const tokens = Array.from(seen.values());
    await fetchTokenDetailBatch(tokens);
    await saveTokens(tokens, "lsts", "lsts-tokens");
    console.log(`✅ Saved ${tokens.length} LST tokens`);
  } catch (err: any) {
    console.error("❌ fetchLstsNow error:", err.message);
  }
}

async function fetchAiNow() {
  console.log("🔄 Fetching AI tokens...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: AI_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];
    const seen = new Map<string, any>();
    for (const entry of trades) {
      const c = entry.Trade?.Currency ?? {};
      const mint = c.MintAddress;
      if (!mint || seen.has(mint)) continue;
      seen.set(mint, {
        mint,
        name: c.Name ?? null,
        symbol: c.Symbol ?? null,
        uri: c.Uri ?? null,
        image: await decodeMetadata(c.Uri),
      });
    }

    const tokens = Array.from(seen.values());
    await fetchTokenDetailBatch(tokens);
    await saveTokens(tokens, "ai", "ai-tokens");
    console.log(`✅ Saved ${tokens.length} AI tokens`);
  } catch (err: any) {
    console.error("❌ fetchAiNow error:", err.message);
  }
}

async function fetchTrendingNow() {
  console.log("🔄 Fetching Trending tokens...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: TRENDING_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const solana = response.data?.data?.Solana;
    if (!solana) return;

    const frames = [solana.trending_1min, solana.trending_5min, solana.trending_30min, solana.trending_1hour].filter(Boolean);
    const tokenMap = new Map<string, any[]>();

    frames.forEach((frame: any[], idx: number) => {
      frame.forEach((entry: any) => {
        const c = entry.Trade?.Currency;
        if (!c?.MintAddress) return;
        if (!tokenMap.has(c.MintAddress)) tokenMap.set(c.MintAddress, []);
        tokenMap.get(c.MintAddress)!.push({ frameIndex: idx, uniqueTraders: entry.tradesCountWithUniqueTraders, volume: entry.traded_volume, trades: entry.trades, currency: c });
      });
    });

    const trending: any[] = [];
    const seenMints = new Set<string>();

    for (const [mint, metrics] of tokenMap) {
      metrics.sort((a, b) => a.frameIndex - b.frameIndex);
      let isTrending = false;
      for (let i = 1; i < metrics.length; i++) {
        if (metrics[i].uniqueTraders > metrics[i - 1].uniqueTraders || metrics[i].volume > metrics[i - 1].volume || metrics[i].trades > metrics[i - 1].trades) {
          isTrending = true;
          break;
        }
      }
      if (isTrending && !seenMints.has(mint)) {
        seenMints.add(mint);
        const c = metrics[0].currency;
        trending.push({
          mint,
          name: c.Name ?? null,
          symbol: c.Symbol ?? null,
          uri: c.Uri ?? null,
          image: await decodeMetadata(c.Uri),
        });
      }
    }

    await fetchTokenDetailBatch(trending);
    await saveTokens(trending, "trending", "trending-tokens");
    console.log(`✅ Saved ${trending.length} trending tokens`);
  } catch (err: any) {
    console.error("❌ fetchTrendingNow error:", err.message);
  }
}

async function fetchPopularNow() {
  console.log("🔄 Fetching Popular tokens...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: POPULAR_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const solana = response.data?.data?.Solana;
    if (!solana) return;

    const frames = [solana.popular_24h, solana.popular_7d].filter(Boolean);
    const tokenMap = new Map<string, any[]>();

    frames.forEach((frame: any[], idx: number) => {
      frame.forEach((entry: any) => {
        const c = entry.Trade?.Currency;
        if (!c?.MintAddress) return;
        if (!tokenMap.has(c.MintAddress)) tokenMap.set(c.MintAddress, []);
        tokenMap.get(c.MintAddress)!.push({ frameIndex: idx, currency: c });
      });
    });

    const popular: any[] = [];
    const seenMints = new Set<string>();

    for (const [mint, metrics] of tokenMap) {
      metrics.sort((a, b) => a.frameIndex - b.frameIndex);
      if (!seenMints.has(mint)) {
        seenMints.add(mint);
        const c = metrics[0].currency;
        popular.push({
          mint,
          name: c.Name ?? null,
          symbol: c.Symbol ?? null,
          uri: c.Uri ?? null,
          image: await decodeMetadata(c.Uri),
        });
      }
    }

    await fetchTokenDetailBatch(popular);
    await saveTokens(popular, "popular", "popular-tokens");
    console.log(`✅ Saved ${popular.length} popular tokens`);
  } catch (err: any) {
    console.error("❌ fetchPopularNow error:", err.message);
  }
}



// ====================== Worker Scheduler ======================
export function startDiscoveryWorker() {
  cron.schedule("*/5 * * * *", async () => {
    console.log("🔄 Discovery worker tick...");
    await fetchBluechipMemesNow();
    await fetchXStockNow();
    await fetchLstsNow();
    await fetchAiNow();
    await fetchTrendingNow();
    await fetchPopularNow();
  });
  console.log("⏱️ Discovery worker scheduled: every 5 minutes");
}

if (require.main === module) {
  (async () => {
    if (!redisClient.isOpen) await redisClient.connect();
    startDiscoveryWorker();
  })();
}
