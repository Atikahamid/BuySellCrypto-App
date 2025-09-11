import cron from "node-cron";
import axios from "axios";
import knex from "../db/knex"; // <- your existing knex export path
import { redisClient } from "../redis/redisClient";
import { BLUECHIP_MEMES_QUERY, TOKEN_DETAIL } from "../queries/allQueryFile";

// TTL for redis cache (seconds)
const REDIS_TTL = Number(process.env.BLUECHIP_CACHE_TTL ?? 60);
// concurrency batch size for per-token detail requests
const DETAIL_BATCH_SIZE = Number(process.env.DETAIL_BATCH_SIZE ?? 5);

// utility: sleep ms
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch data from Bitquery and persist to Postgres + Redis.
 * This function is safe to call concurrently but be mindful of Bitquery rate limits.
 */
export async function fetchBluechipMemesNow(): Promise<any[]> {
  console.log("🔄 fetchBluechipMemesNow: starting refresh");
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
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

    // map to simple structures
    for (const entry of updates) {
      const update = entry.TokenSupplyUpdate ?? {};
      const currency = update.Currency ?? {};
      const mint = currency.MintAddress;
      if (!mint) continue;

      tokens.push({
        mint,
        name: currency.Name ?? null,
        symbol: currency.Symbol ?? null,
        uri: currency.Uri ?? null,
        image: null, // we could decode metadata if desired (avoid extra network)
        marketcap: update.Marketcap ?? null,
        price_change_24h: null,
        updated_at: new Date(),
      });
    }

    // Optional: fetch token detail batch-wise to compute priceChange24h/marketcap more accurately
    // We'll process tokens in chunks to avoid spamming Bitquery
    for (let i = 0; i < tokens.length; i += DETAIL_BATCH_SIZE) {
      const batch = tokens.slice(i, i + DETAIL_BATCH_SIZE);
      await Promise.all(
        batch.map(async (tok) => {
          try {
            // request TOKEN_DETAIL_QUERY for each mint
            const detailRes = await axios.post(
              process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
              { query: TOKEN_DETAIL, variables: { mintAddress: tok.mint } },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
                },
                timeout: 60_000,
              }
            );

            const solanaData = detailRes.data?.data?.Solana;
            // parse values carefully
            const supplyUpdate = solanaData?.TokenSupplyUpdates?.[0]?.TokenSupplyUpdate;
            const latestPrice = solanaData?.DEXTradeByTokens?.[0]?.Trade?.PriceInUSD;
            let marketcap = tok.marketcap;
            if ((supplyUpdate?.PostBalanceInUSD ?? 0) > 0) {
              marketcap = supplyUpdate.PostBalanceInUSD;
            } else if (supplyUpdate?.PostBalance && latestPrice) {
              marketcap = Number(supplyUpdate.PostBalance) * Number(latestPrice);
            }
            const priceChangeEntry = solanaData?.PriceChange24h?.[0];
            const priceChange24h = priceChangeEntry?.PriceChange24h ?? null;

            tok.marketcap = marketcap;
            tok.price_change_24h = priceChange24h;
          } catch (err) {
            console.warn("⚠️ detail fetch failed for", tok.mint, err?.message ?? err);
            // keep previous tok fields
          }
        })
      );
      // small delay between batches to avoid rate limiting
      await sleep(500);
    }

    // Upsert tokens into Postgres
    const trx = await knex.transaction();
    try {
      for (const t of tokens) {
        await trx("bluechip_memes")
          .insert({
            mint: t.mint,
            name: t.name,
            symbol: t.symbol,
            uri: t.uri,
            image: t.image,
            marketcap: t.marketcap,
            price_change_24h: t.price_change_24h,
            updated_at: t.updated_at,
          })
          .onConflict("mint")
          .merge();
      }
      await trx.commit();
    } catch (dbErr) {
      await trx.rollback();
      console.error("❌ DB upsert error:", dbErr);
      throw dbErr;
    }

    // Write final list to Redis cache
    try {
      await redisClient.set("bluechip-memes", JSON.stringify(tokens), {
        EX: REDIS_TTL,
      });
    } catch (rErr) {
      console.error("❌ Redis set error:", rErr);
    }

    console.log(`✅ fetchBluechipMemesNow: saved ${tokens.length} tokens`);
    return tokens;
  } catch (err: any) {
    console.error("❌ fetchBluechipMemesNow error:", err?.message ?? err);
    return [];
  }
}

// Start the cron job (exports but doesn't auto-start unless you call it)
export function startBluechipWorker() {
  // schedule: every minute
  cron.schedule("*/1 * * * *", async () => {
    try {
      await fetchBluechipMemesNow();
    } catch (err) {
      console.error("❌ scheduled fetch failed:", err);
    }
  });
  console.log("⏱️ Bluechip worker scheduled: every 1 minute");
}

// If you run this file directly (node workers/bluechipWorker.ts) it will fetch once and start cron
if (require.main === module) {
  (async () => {
    try {
      if (!redisClient.isOpen) await redisClient.connect();
    } catch (e) {
      console.warn("⚠️ Redis connect failed in worker:", e?.message ?? e);
    }
    // run immediately, then schedule
    await fetchBluechipMemesNow();
    startBluechipWorker();
  })();
}
