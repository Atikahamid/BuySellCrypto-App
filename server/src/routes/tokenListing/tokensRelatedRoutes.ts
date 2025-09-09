import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { decodeMetadata, getTokenAnalytics } from '../../utils/tokenRelatedUtils';
import { AI_TOKENS_QUERY, ALMOST_BONDED_QUERY, blacklist, BLUECHIP_MEMES_QUERY, GET_MIGRATED_TOKENS_QUERY, metadataQuery, NEWLY_CREATED_TOKENS_QUERY, VERIFIED_LSTS_QUERY, xSTOCK_TOKENS_QUERY } from '../../queries/allQueryFile';

const tokenRelatedRouter = Router();

// async function decodeMetadata(uri: string | undefined) {
//     if (!uri) return null;
//     try {
//         let url = uri;
//         if (uri.startsWith("ipfs://")) {
//             url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
//         } else if (uri.startsWith("ar://")) {
//             url = uri.replace("ar://", "https://arweave.net/");
//         }
//         const res = await fetch(url);
//         if (!res.ok) return null;
//         const data = await res.json();
//         return data.image ?? null;
//     } catch {
//         return null;
//     }
// }
tokenRelatedRouter.get("/almost-bonded-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: ALMOST_BONDED_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );


    const pools = response.data?.data?.Solana?.DEXPools ?? [];

    // console.log("pools: ", pools);
    const mapped = await Promise.all(
      pools.map(async (p: any) => {
        const pool = p.Pool ?? {};
        const market = pool.Market ?? {};
        const baseCurrency = market.BaseCurrency ?? {};


        const rawBalance = pool.Base?.Balance ?? pool.Base?.PostAmount ?? null;
        const bondingProgress = p.Bonding_Curve_Progress_Percentage;
        const protocolFamily = pool.Dex.ProtocolFamily;
        const mint = baseCurrency.MintAddress ?? null;


        // Decode token metadata (Uri -> JSON -> image)
        let imageUrl: string | null = null;
        let createdOn: string | null = null;
        let twitterX: string | null = null;
        let telegramX: string | null = null;
        let website: string | null = null;
        // let createdOn, telegramX, twitterX, website;
        if (baseCurrency.Uri) {
          const meta = await decodeMetadata(baseCurrency.Uri);
          if (meta) {
            imageUrl = meta.image || null;
            createdOn = meta.createdOn || null;
            telegramX = meta.telegram || null;
            twitterX = meta.twitter || null;
            website = meta.website || null;
          }
        }


        // Analytics for token
        const analytics = await getTokenAnalytics(mint);


        return {
          mint,
          name: baseCurrency.Name ?? null,
          symbol: baseCurrency.Symbol ?? null,
          uri: baseCurrency.Uri ?? null,
          image: imageUrl,
          createdOn: createdOn, // placeholder if available in metadata
          twitterX: twitterX,
          telegramX: telegramX,
          website: website, // placeholder if available in metadata
          blockTime: p.Block?.Time ?? null,
          slot: p.Block?.Slot ?? null,
          // feePayer: p.Transaction?.Signer ?? null,
          bondingProgress,
          analytics,
          protocolFamily: protocolFamily
        };
      })
    );


    // ✅ Apply filter (only 65%–97%)
    const filtered = mapped.filter(
      (t) => t.bondingProgress >= 65 && t.bondingProgress <= 97
    );

    // ✅ Sort remaining by bondingProgress descending
    filtered.sort((a, b) => (b.bondingProgress ?? 0) - (a.bondingProgress ?? 0));
    console.log("filtered token data 1: ", filtered[0]);
    res.json(filtered);
  } catch (err: any) {
    console.error("❌ Error fetching almost bonded tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch almost bonded tokens" });
  }
});

tokenRelatedRouter.get("/migrated-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: GET_MIGRATED_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const instructions = response.data?.data?.Solana?.Instructions ?? [];
    const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

    // Collect results
    const migratedTokens: any[] = [];

    for (const instr of instructions) {
      const method = instr?.Instruction?.Program?.Method ?? "";
      const accounts = instr?.Instruction?.Accounts ?? [];

      // filter candidates: Mint present and Owner+ProgramId = TOKEN_PROGRAM_ID
      const candidates = accounts.filter(
        (acc: any) =>
          acc?.Token?.Mint &&
          acc?.Token?.Owner === TOKEN_PROGRAM_ID &&
          acc?.Token?.ProgramId === TOKEN_PROGRAM_ID
      );

      if (candidates.length === 0) continue;

      let chosenMint = "";
      if (method === "migrate_meteora_damm") {
        // Special rule: take the *second* candidate if available
        chosenMint = candidates[1]?.Token?.Mint || candidates[0]?.Token?.Mint;
      } else {
        chosenMint = candidates[0]?.Token?.Mint;
      }

      if (!chosenMint) continue;

      const metaResponse = await axios.post(
        process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
        {
          query: metadataQuery,
          variables: { mintAddress: chosenMint },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
          },
        }
      );

      const poolMeta = metaResponse.data?.data?.Solana?.DEXPools?.[0] ?? null;
      const baseCurrency = poolMeta?.Pool?.Market?.BaseCurrency ?? {};

      // 🔹 Decode metadata (image + social links)
      let imageUrl: string | null = null;
      let createdOn: string | null = null;
      let twitterX: string | null = null;
      let telegramX: string | null = null;
      let website: string | null = null;

      if (baseCurrency?.Uri) {
        const meta = await decodeMetadata(baseCurrency.Uri);
        if (meta) {
          imageUrl = meta.image || null;
          createdOn = meta.createdOn || null;
          telegramX = meta.telegram || null;
          twitterX = meta.twitter || null;
          website = meta.website || null;
        }
      }

      // 🔹 Analytics
      const analytics = await getTokenAnalytics(chosenMint);

      // 🔹 Build result object (same structure as almost-bonded)
      migratedTokens.push({
        mint: chosenMint,
        name: baseCurrency?.Name ?? null,
        symbol: baseCurrency?.Symbol ?? null,
        uri: baseCurrency?.Uri ?? null,
        image: imageUrl,
        createdOn,
        twitterX,
        telegramX,
        website,
        blockTime: poolMeta?.Block?.Time ?? null,
        analytics,
        protocolFamily: poolMeta?.Pool?.Dex?.ProtocolFamily ?? null,
        method,
      });
    }

    res.json({
      count: migratedTokens.length,
      tokens: migratedTokens,
    });
  } catch (err: any) {
    console.error("❌ Error fetching migrated tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch migrated tokens" });
  }
});

tokenRelatedRouter.get("/newly-created-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: NEWLY_CREATED_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const instructions = response.data?.data?.Solana?.Instructions ?? [];

    const tokens = await Promise.all(
      instructions.map(async (instr: any) => {
        const block = instr.Block ?? {};
        const tx = instr.Transaction ?? {};
        const accounts = instr?.Instruction?.Accounts ?? [];

        // Find the mint address from accounts
        const mintAccount = accounts.find((acc: any) => acc?.Token?.Mint);
        const mint = mintAccount?.Token?.Mint ?? null;
        if (!mint) return null;

        // Extract metadata JSON string
        const arg = instr.Instruction?.Program?.Arguments?.find(
          (a: any) => a.Name === "createMetadataAccountArgsV3"
        );
        let metaJson: any = null;
        try {
          metaJson = arg?.Value?.json ? JSON.parse(arg.Value.json) : null;
        } catch {
          metaJson = null;
        }

        const data = metaJson?.data ?? {};
        const uri = data?.uri ?? null;

        // Decode metadata (fetch from IPFS/Arweave JSON → image + socials)
        let imageUrl: string | null = null;
        let createdOn: string | null = null;
        let twitterX: string | null = null;
        let telegramX: string | null = null;
        let website: string | null = null;

        if (uri) {
          const meta = await decodeMetadata(uri);
          if (meta) {
            imageUrl = meta.image || null;
            createdOn = meta.createdOn || null;
            telegramX = meta.telegram || null;
            twitterX = meta.twitter || null;
            website = meta.website || null;
          }
        }

        // Analytics
        const analytics = await getTokenAnalytics(mint);

        return {
          mint,
          name: data?.name ?? null,
          symbol: data?.symbol ?? null,
          uri,
          image: imageUrl,
          createdOn,
          twitterX,
          telegramX,
          website,
          blockTime: block.Time ?? null,
          slot: block.Slot ?? null,
          feePayer: tx.FeePayer ?? null,
          fee: tx.Fee ?? null,
          feeInUSD: tx.FeeInUSD ?? null,
          analytics,
        };
      })
    );

    // filter out nulls
    const filtered = tokens.filter(Boolean);

    res.json({
      count: filtered.length,
      tokens: filtered,
    });
  } catch (err: any) {
    console.error("❌ Error fetching newly created tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch newly created tokens" });
  }
});

tokenRelatedRouter.get("/xstock-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: xSTOCK_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];

    if (!trades.length) {
      return res.json({ count: 0, tokens: [] });
    }

    // Deduplicate by MintAddress (Bitquery may repeat entries for same token on multiple markets)
    const seen = new Map<string, any>();

    for (const entry of trades) {
      const currency = entry.Trade?.Currency ?? {};
      const mint = currency.MintAddress;
      if (!mint) continue;

      // If already seen, skip (or aggregate further if needed)
      if (seen.has(mint)) continue;

      // Decode metadata for image & socials
      let imageUrl: string | null = null;
      // let createdOn: string | null = null;
      // let twitterX: string | null = null;
      // let telegramX: string | null = null;
      // let website: string | null = null;

      if (currency.Uri) {
        const meta = await decodeMetadata(currency.Uri);
        if (meta) {
          imageUrl = meta.image || null;
          // createdOn = meta.createdOn || null;
          // telegramX = meta.telegram || null;
          // twitterX = meta.twitter || null;
          // website = meta.website || null;
        }
      }

      seen.set(mint, {
        mint,
        name: currency.Name ?? null,
        symbol: currency.Symbol ?? null,
        uri: currency.Uri ?? null,
        image: imageUrl,
        // createdOn,
        // twitterX,
        // telegramX,
        // website,
        latestPrice: entry.Trade?.latest_price ?? null,
        totalVolume: entry.total_volume ?? "0",
        totalTrades: entry.total_trades ?? "0",
        uniqueTraders: entry.unique_traders ?? "0",
        uniqueDexs: entry.unique_dexs ?? "0",
        // TODO: MarketCap & Liquidity → you’ll need extra query (DEXPools) or analytics helper
        marketCap: null,
        liquidity: null,
      });
    }

    const tokens = Array.from(seen.values());

    res.json({
      count: tokens.length,
      tokens,
    });
  } catch (err: any) {
    console.error("❌ Error fetching xStock tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch xStock tokens" });
  }
});


// ✅ New route for fetching LSTs tokens
tokenRelatedRouter.get("/lsts-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: VERIFIED_LSTS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];

    if (!trades.length) {
      return res.json({ count: 0, tokens: [] });
    }

    // Deduplicate by MintAddress
    const seen = new Map<string, any>();

    for (const entry of trades) {
      const currency = entry.Trade?.Currency ?? {};
      const mint = currency.MintAddress;
      if (!mint) continue;

      // If already seen, skip (to avoid duplicates across markets)
      if (seen.has(mint)) continue;

      // Decode metadata for image
      let imageUrl: string | null = null;
      if (currency.Uri) {
        const meta = await decodeMetadata(currency.Uri);
        if (meta) {
          imageUrl = meta.image || null;
        }
      }

      seen.set(mint, {
        mint,
        name: currency.Name ?? null,
        symbol: currency.Symbol ?? null,
        uri: currency.Uri ?? null,
        image: imageUrl,
        latestPriceUSD: entry.Trade?.latest_price_usd ?? null,
        latestPriceSOL: entry.Trade?.latest_price_sol ?? null,
        volume7dUSD: entry.volume_7d_usd ?? "0",
        trades7d: entry.trades_7d ?? "0",
        uniqueTraders7d: entry.unique_traders_7d ?? "0",
        protocolName: entry.Trade?.Dex?.ProtocolName ?? null,
      });
    }

    const tokens = Array.from(seen.values());

    res.json({
      count: tokens.length,
      tokens,
    });
  } catch (err: any) {
    console.error("❌ Error fetching LSTs tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch LSTs tokens" });
  }
});


// ✅ New route for fetching BlueChip Meme tokens

tokenRelatedRouter.get("/bluechip-memes", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: BLUECHIP_MEMES_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const updates = response.data?.data?.Solana?.TokenSupplyUpdates ?? [];

    if (!updates.length) {
      return res.json({ count: 0, tokens: [] });
    }

    const seen = new Map<string, any>();

    for (const entry of updates) {
      const update = entry.TokenSupplyUpdate ?? {};
      const currency = update.Currency ?? {};
      const mint = currency.MintAddress;
      if (!mint) continue;

      // blacklist filter
      if (blacklist.includes(currency.Symbol) || blacklist.includes(currency.Name)) {
        continue;
      }

      if (seen.has(mint)) continue;

      let imageUrl: string | null = null;
      if (currency.Uri) {
        const meta = await decodeMetadata(currency.Uri);
        if (meta) {
          imageUrl = meta.image || null;
        }
      }

      seen.set(mint, {
        mint,
        name: currency.Name ?? null,
        symbol: currency.Symbol ?? null,
        uri: currency.Uri ?? null,
        image: imageUrl,
        latestPriceUSD: null, // Not provided in this query
        latestPriceSOL: null, // Not provided in this query
        volume7dUSD: null,
        trades7d: null,
        uniqueTraders7d: null,
        protocolName: null,
        marketcap: update.Marketcap ?? null,
      });
    }

    const tokens = Array.from(seen.values());

    res.json({
      count: tokens.length,
      tokens,
    });
  } catch (err: any) {
    console.error("❌ Error fetching BlueChip Meme tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch BlueChip Meme tokens" });
  }
});

// ✅ New route for fetching AI tokens
tokenRelatedRouter.get("/ai-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: AI_TOKENS_QUERY }, // <-- define your GraphQL query string here
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];

    if (!trades.length) {
      return res.json({ count: 0, tokens: [] });
    }

    // Deduplicate by MintAddress
    const seen = new Map<string, any>();

    for (const entry of trades) {
      const currency = entry.Trade?.Currency ?? {};
      const mint = currency.MintAddress;
      if (!mint) continue;

      // Skip duplicates
      if (seen.has(mint)) continue;

      // Decode metadata for image & socials
      let imageUrl: string | null = null;
      // let createdOn: string | null = null;
      // let twitterX: string | null = null;
      // let telegramX: string | null = null;
      // let website: string | null = null;

      if (currency.Uri) {
        const meta = await decodeMetadata(currency.Uri);
        if (meta) {
          imageUrl = meta.image || null;
          // createdOn = meta.createdOn || null;
          // twitterX = meta.twitter || null;
          // telegramX = meta.telegram || null;
          // website = meta.website || null;
        }
      }

      seen.set(mint, {
        mint,
        name: currency.Name ?? null,
        symbol: currency.Symbol ?? null,
        uri: currency.Uri ?? null,
        image: imageUrl,
        // createdOn,
        // twitterX,
        // telegramX,
        // website,
        latestPrice: entry.Trade?.latest_price ?? null,
        // totalVolume: entry.volume_7d ?? "0", // using 7d volume from query
        // totalTrades: entry.total_trades_7d ?? "0", // using 7d trades from query
        // uniqueTraders: entry.unique_traders_7d ?? "0", // using 7d unique traders from query
        // uniqueDexs: entry.unique_dexs ?? "0",
        marketCap: null, // can extend later with pool/liquidity data
        liquidity: null,
      });
    }

    const tokens = Array.from(seen.values());

    res.json({
      count: tokens.length,
      tokens,
    });
  } catch (err: any) {
    console.error("❌ Error fetching AI tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch AI tokens" });
  }
});


export default tokenRelatedRouter;