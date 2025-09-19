// File: src/services/bitQueryService.ts
import WebSocket from "ws";
import knex from "../db/knex";
import fetch from "node-fetch";
import { WebSocketService } from "../service/websocketService";
import { queryOne, NEWLY_CREATED_TOKENS_SUB, GET_TOKEN_ANALYTICS_QUERY } from "../queries/allQueryFile";

const BITQUERY_WS_URL = "wss://streaming.bitquery.io/eap";
const AUTH_TOKEN = process.env.BITQUERY_AUTH_TOKEN!;

async function decodeMetadata(uri: string) {
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

export class BitqueryService {
  private webSocketService: WebSocketService;
  private ws: WebSocket | null = null;
  private analyticsCache: Map<string, any> = new Map();

  constructor(webSocketService: WebSocketService) {
    this.webSocketService = webSocketService;
  }

  async start() {
    const wallets = await knex("watched_addresses").select("address", "username", "profile_picture_url");
    const walletAddresses = wallets.map((w) => w.address);

    const walletMap: Record<string, { username: string; profileUrl: string }> = {};
    wallets.forEach((w) => {
      walletMap[w.address] = { username: w.username, profileUrl: w.profile_picture_url };
    });

    this.connect(walletAddresses, walletMap);
  }

  private connect(walletAddresses: string[], walletMap: Record<string, any>) {
    if (this.ws) return;

    const ws = new WebSocket(`${BITQUERY_WS_URL}?token=${AUTH_TOKEN}`, ["graphql-ws"]);
    this.ws = ws;

    ws.on("open", () => {
      console.log("✅ Connected to Bitquery");
      ws.send(JSON.stringify({ type: "connection_init" }));
    });

    ws.on("message", async (raw) => {
      const msg = JSON.parse(raw.toString());
      switch (msg.type) {
        case "connection_ack":
          // subscribe to trades
          ws.send(
            JSON.stringify({
              id: "multi-wallet-sub",
              type: "start",
              payload: { query: queryOne, variables: { walletAddresses } },
            })
          );
          // subscribe to new token creations
          ws.send(
            JSON.stringify({
              id: "new-tokens-sub",
              type: "start",
              payload: { query: NEWLY_CREATED_TOKENS_SUB },
            })
          );
          break;

        case "data":
          if (msg.id === "multi-wallet-sub") {
            this.handleTrades(msg.payload.data, walletMap);
          }
          if (msg.id === "new-tokens-sub") {
            await this.handleNewTokens(msg.payload.data);
          }
          break;

        case "error":
          console.error("Bitquery error:", msg.payload);
          break;
      }
    });

    ws.on("close", () => {
      console.warn("⚠️ Bitquery WS closed, retrying...");
      this.ws = null;
      setTimeout(() => this.connect(walletAddresses, walletMap), 5000);
    });
  }

  private handleTrades(payload: any, walletMap: Record<string, any>) {
    const trades = payload?.Solana?.DEXTradeByTokens ?? [];
    trades.forEach((trade: any) => {
      const walletAddr = trade.Trade.Account.Address;
      const userMeta = walletMap[walletAddr] || { username: "unknown", profileUrl: "" };
      const formatted = {
        walletAddress: walletAddr,
        username: userMeta.username,
        userProfilePic: userMeta.profileUrl,
        action: trade.Trade.Side.Type?.toLowerCase(),
        token: {
          name: trade.Trade.Side.Currency.Name,
          symbol: trade.Trade.Side.Currency.Symbol,
          mintAddress: trade.Trade.Side.Currency.MintAddress,
        },
        time: trade.Block.Time,
      };
      this.webSocketService.io.emit("token_transfer", formatted);
      console.log("🚀 New trade:", formatted);
    });
  }

  private async handleNewTokens(payload: any) {
    const instructions = payload?.Solana?.Instructions ?? [];
    for (const inst of instructions) {
      const accounts = inst?.Instruction?.Accounts ?? [];
      const accountNames = inst?.Instruction?.Program?.AccountNames ?? [];

      // Map accountNames to Accounts by index
      const accountMap: Record<string, any> = {};
      accountNames.forEach((name: string, idx: number) => {
        accountMap[name] = accounts[idx];
      });

      // Mint & owner
      const mint = accountMap["mint"]?.Token?.Mint || null;
      const owner = accountMap["mint"]?.Token?.Owner || null;
      if (!mint) continue;

      // Fee payer
      const feePayer = inst?.Transaction?.FeePayer || null;

      // Parse args JSON
      let name: string | null = null;
      let symbol: string | null = null;
      let uri: string | null = null;

      const args = inst?.Instruction?.Program?.Arguments ?? [];
      const createArgs = args.find((a: any) => a.Name === "createMetadataAccountArgsV3");
      if (createArgs?.Value?.json) {
        try {
          const parsed = JSON.parse(createArgs.Value.json);
          name = parsed.data?.name ?? null;
          symbol = parsed.data?.symbol ?? null;
          uri = parsed.data?.uri ?? null;
        } catch (err) {
          console.error("Failed to parse metadata args JSON:", err);
        }
      }

      // Decode metadata (IPFS/Arweave)
      let image: string | null = null;
      let createdOn: string | null = null;
      let twitterX: string | null = null;

      if (uri) {
        const meta = await decodeMetadata(uri);
        if (meta) {
          image = meta.image || null;
          name = meta.name || name;
          symbol = meta.symbol || symbol;
          createdOn = meta.createdOn || null;
          twitterX = meta.twitter || null;
        }
      }

      // Fetch analytics
      const analytics = await this.getTokenAnalytics(mint);

      const event = {
        mint,
        owner,
        name,
        symbol,
        uri,
        image,
        createdOn,
        twitterX,
        blockTime: inst?.Block?.Time,
        slot: inst?.Block?.Slot,
        feePayer,
        analytics,
      };

      this.webSocketService.io.emit("new_token_created", event);
      // console.log("🆕 New token:", event);
    }
  }

  private async getTokenAnalytics(mint: string) {
    if (this.analyticsCache.has(mint)) {
      return this.analyticsCache.get(mint);
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

      this.analyticsCache.set(mint, analyticsData);

      // Auto-expire after 5 minutes
      setTimeout(() => this.analyticsCache.delete(mint), 5 * 60 * 1000);

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

}

export function sanitizeString(value?: string | null): string | null {
  if (!value) return null;
  return value.replace(/\u0000/g, ""); // strip null bytes
}
