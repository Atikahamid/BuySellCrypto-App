import WebSocket from "ws";
import knex from "../db/knex";
import { WebSocketService } from "../service/websocketService";
import type { Server } from 'socket.io';
import fetch from 'node-fetch';
const BITQUERY_WS_URL = "wss://streaming.bitquery.io/eap";
const AUTH_TOKEN = process.env.BITQUERY_AUTH_TOKEN!; // store in .env
import { Trade } from "../types/interfaces";
console.log("Auth token: ", AUTH_TOKEN);
// GraphQL subscription query
// const subscriptionQuery = `
// subscription WalletTradeMonitoring($walletAddress: String!) {
//   Solana {
//     DEXTradeByTokens(
//       where: {
//         Transaction: { Result: { Success: true } }
//         any: [
//           { Trade: { Account: { Address: { is: $walletAddress } } } }
//           { Trade: { Account: { Token: { Owner: { is: $walletAddress } } } } }
//         ]
//       }
//     ) {
//       Block { Time Slot }
//       Trade {
//         Currency { Name Symbol MintAddress Decimals Fungible Native }
//         Amount PriceInUSD Price
//         Side {
//           Type Amount AmountInUSD
//           Currency { Name Symbol MintAddress }
//         }
//         Account { Address Token { Owner } }
//         Dex { ProtocolName ProtocolFamily ProgramAddress }
//       }
//       Transaction { Signature Signer FeeInUSD }
//     }
//   }
// }`;
// Replace the old subscriptionQuery with this:
// const subscriptionQueryNew = `
// subscription MemeTokenTradeMonitoring($walletAddresses: [String!]!) {
//   dexTrades: Solana {
//     DEXTradeByTokens(
//       where: {
//         Transaction: {Result: {Success: true}}
//         Trade: {Currency: {
//             Fungible: true 
//             Symbol: { notIn: ["SOL", "WSOL", "USDC", "USDT"] }
//             }
//             }
//         any: [
//           {Trade: {Account: {Address: {in: $walletAddresses}}}}
//         ]
//       }
//     ) {
//       Block { Time Slot Height }
//       Trade {
//         Currency {
//           Name Symbol MintAddress Decimals Fungible Uri
//         }
//         Amount PriceInUSD Price AmountInUSD
//         Side {
//           Type Amount AmountInUSD
//           Currency { Name Symbol MintAddress Native }
//         }
//         Account { Address Token { Owner } }
//       }
//     }
//   }
//   pumpFunTrades: Solana {
//     DEXTradeByTokens(
//       where: {
//         Transaction: {Result: {Success: true}}
//         Trade: {Dex: {ProtocolName: {is: "pump"}} Currency: {Fungible: true}}
//         any: [
//           {Trade: {Account: {Address: {in: $walletAddresses}}}}
//         ]
//       }
//     ) {
//       Block { Time Slot Height }
//       Trade {
//         Currency {
//           Name Symbol MintAddress Decimals Fungible Uri MetadataAddress
//         }
//         Amount PriceInUSD Price AmountInUSD
//         Side {
//           Type Amount AmountInUSD
//           Currency { Name Symbol MintAddress }
//         }
//         Account { Address Token { Owner } }
//       }
//     }
//   }
//   letsBonkTrades: Solana {
//     DEXTradeByTokens(
//       where: {
//         Transaction: {Result: {Success: true}}
//         Trade: {Dex: {ProtocolName: {is: "raydium_launchpad"}} Currency: {Fungible: true}}
//         any: [
//           {Trade: {Account: {Address: {in: $walletAddresses}}}}
//         ]
//       }
//     ) {
//       Block { Time Slot Height }
//       Trade {
//         Currency {
//           Name Symbol MintAddress Decimals Fungible Uri MetadataAddress
//         }
//         Amount PriceInUSD Price AmountInUSD
//         Side {
//           Type Amount AmountInUSD
//           Currency { Name Symbol MintAddress }
//         }
//         Account { Address Token { Owner } }
//       }
//     }
//   }
// }
// `;
const LatestSubscriptionQuery = `
subscription MemeTokenTradeMonitoring($walletAddresses: [String!]!) {
  dexTrades: Solana {
    DEXTradeByTokens(
      where: {Transaction: {Result: {Success: true}}, Trade: {Currency: {Fungible: true, Symbol: {notIn: ["SOL", "WSOL", "USDC", "USDT"]}}}, any: [{Trade: {Account: {Address: {in: $walletAddresses}}}}]}
    ) {
      Block {
        Time
      }
      Trade {
        Amount
        Price
        Side {
          Type
          Amount
          Currency {
            Name
            Symbol
            MintAddress
            Uri
          }
        }
        Account {
          Address
        }
      }
    }
  }
  pumpFunTrades: Solana {
    DEXTradeByTokens(
      where: {Transaction: {Result: {Success: true}}, Trade: {Currency: {Fungible: true, Symbol: {notIn: ["SOL", "WSOL", "USDC", "USDT"]}}}, any: [{Trade: {Account: {Address: {in: $walletAddresses}}}}]}
    ) {
      Block {
        Time
      }
      Trade {
        Amount
        Price
        Side {
          Type
          Amount
          Currency {
            Name
            Symbol
            MintAddress
            Uri
          }
        }
        Account {
          Address
        }
      }
    }
  }
  letsBonkTrades: Solana {
    DEXTradeByTokens(
      where: {Transaction: {Result: {Success: true}}, Trade: {Currency: {Fungible: true, Symbol: {notIn: ["SOL", "WSOL", "USDC", "USDT"]}}}, any: [{Trade: {Account: {Address: {in: $walletAddresses}}}}]}
    ) {
      Block {
        Time
      }
      Trade {
        Amount
        Price
        Side {
          Type
          Amount
          Currency {
            Name
            Symbol
            MintAddress
            Uri
          }
        }
        Account {
          Address
        }
      }
    }
  }
}
`;
const queryOne = `
subscription MemeTokenTradeMonitoring($walletAddresses: [String!]!) {
  dexTrades: Solana {
    DEXTradeByTokens(
      where: {
        Transaction: {Result: {Success: true}},
        Trade: {
          Currency: {
            Fungible: true,
            MintAddress: {
              notIn: [
                "So11111111111111111111111111111111111111112", 
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", 
                "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"
              ]
            }
          },
          Amount: {gt: "0"}
        },
        any: [{Trade: {Account: {Address: {in: $walletAddresses}}}}]
      }
    ) {
      Block {
        Time
      }
      Trade {
        Amount
        Price
        Side {
          Type
          Amount
          Currency {
            Name
            Symbol
            MintAddress
            Uri
          }
        }
        Account {
          Address
        }
      }
    }
  }
}
`;
// const previousDataQuery = `
// query FilteredTokenTradesAggregated($walletAddresses: [String!], $limit: Int = 50) {
//   Solana {
//     DEXTradeByTokens(
//       limit: {count: $limit}
//       orderBy: {descending: Block_Time}
//       where: {
//         Transaction: {Result: {Success: true}}
//         Trade: {
//           Currency: {
//             Fungible: true
//             MintAddress: {
//               notIn: [
//                 "So11111111111111111111111111111111111111112",  # WSOL
//                 "11111111111111111111111111111111111111111",   # SOL  
//                 "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", # USDC
//                 "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", # USDT
//                 "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"  # USDC (Circle)
//               ]
//             }
//           }
//         }
//         any: [
//           {Trade: {Account: {Address: {in: $walletAddresses}}}},
//           {Trade: {Account: {Token: {Owner: {in: $walletAddresses}}}}},
//           {Transaction: {Signer: {in: $walletAddresses}}}
//         ]
//       }
//     ) {
//       Block {
//         Time
//         Slot
//       }
//       Transaction {
//         Signature
//         Signer
//         FeeInUSD
//       }
//       Trade {
//         Currency {
//           Name
//           Symbol
//           MintAddress
//           Decimals
//           Fungible
//           Native
//         }
//         Amount
//         Price
//         PriceInUSD
//         Side {
//           Type
//           Amount  
//           AmountInUSD
//           Currency {
//             Name
//             Symbol
//             MintAddress
//           }
//         }
//         Account {
//           Address
//           Token {
//             Owner
//           }
//         }
//         Dex {
//           ProtocolName
//           ProtocolFamily
//           ProgramAddress
//         }
//       }
      
//       # Trade Aggregations
//       buyVolume: sum(of: Trade_Side_AmountInUSD, if: {Trade: {Side: {Type: {is: buy}}}})
//       sellVolume: sum(of: Trade_Side_AmountInUSD, if: {Trade: {Side: {Type: {is: sell}}}})
//       totalVolume: sum(of: Trade_Side_AmountInUSD)
//       tradeCount: count
//     }
//   }
// }`;

async function decodeMetadata(uri: string) {
  try {
    let url = uri;

    if (uri.startsWith("ipfs://")) {
      url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    } else if (uri.startsWith("ar://")) {
      url = uri.replace("ar://", "https://arweave.net/");
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.statusText}`);
    const data = await res.json();

    return {
      name: data.name,
      symbol: data.symbol,
      image: data.image,
      description: data.description,
    };
  } catch (err) {
    console.error("Error decoding metadata:", err);
    return null;
  }
}

export class BitqueryService {
  private webSocketService: WebSocketService;
  private ws: WebSocket | null = null;

  constructor(webSocketService: WebSocketService) {
    this.webSocketService = webSocketService;
  }

  async start() {
    // Fetch wallet addresses from DB
    const wallets = await knex("watched_addresses").select("address", "username", "profile_picture_url");
    const walletAddresses = wallets.map((w: { address: string }) => w.address);

    //build lookup map for quick enrichment
    const walletMap = wallets.reduce((map: any, w: any) => {
      map[w.address] = { username: w.username, profileUrl: w.profile_picture_url };
      return map;
    }, {});

    console.log("wallet map: ", walletMap);

    console.log("📡 Subscribing to wallets:", walletAddresses);

    this.subscribeToWallets(walletAddresses, walletMap);
  }

  private subscribeToWallets(walletAddresses: string[], walletMap: any) {
    if (this.ws) return; // already connected

    const ws = new WebSocket(`${BITQUERY_WS_URL}?token=${AUTH_TOKEN}`, [
      "graphql-ws",
    ]);
    this.ws = ws;

    ws.on("open", () => {
      console.log("✅ Connected to Bitquery (multi-wallet)");
      ws.send(JSON.stringify({ type: "connection_init" }));
    });

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case "connection_ack":
          ws.send(
            JSON.stringify({
              id: "multi-wallet-sub",
              type: "start",
              payload: {
                query: queryOne,
                variables: { walletAddresses },
              },
            })
          );
          break;

        case "data":
          const payload = msg.payload.data;
          if (!payload) return;

          // Handle DEX trades
          if (payload.dexTrades?.DEXTradeByTokens) {
            payload.dexTrades.DEXTradeByTokens.forEach((trade: any) =>
              this.handleTrade(trade, "DEX", walletMap)
            );
          }

          // Handle PumpFun trades
          if (payload.pumpFunTrades?.DEXTradeByTokens) {
            payload.pumpFunTrades.DEXTradeByTokens.forEach((trade: any) =>
              this.handleTrade(trade, "PUMPFUN", walletMap)
            );
          }

          // Handle LetsBonk trades
          if (payload.letsBonkTrades?.DEXTradeByTokens) {
            payload.letsBonkTrades.DEXTradeByTokens.forEach((trade: any) =>
              this.handleTrade(trade, "LETSBONK", walletMap)
            );
          }
          break;

        case "error":
          console.error("❌ Bitquery error:", msg.payload);
          break;
      }
    });

    ws.on("close", () => {
      console.warn("⚠️ Bitquery WS closed, retrying...");
      this.ws = null;
      setTimeout(() => this.subscribeToWallets(walletAddresses, walletMap), 5000);
    });
  }

 private async handleTrade(trade: any, platform: string, walletMap: any) {
  let metadata = null;

  if (trade.Trade.Currency?.Uri) {
    metadata = await decodeMetadata(trade.Trade.Currency.Uri);
  }

  const walletAddr = trade.Trade.Account.Address;
  const userMeta = walletMap[walletAddr];
  console.log("userMeta: ", userMeta);

  // ✅ Conform to Trade interface
  const formatted: Trade = {
    walletAddress: walletAddr,
    username: userMeta.username,
    userProfilePic: userMeta.profileUrl,
    action: trade.Trade.Side.Type?.toLowerCase() === "buy" ? "buy" : "sell",

    token: {
      name: trade.Trade.Side.Currency.Name,
      symbol: trade.Trade.Side.Currency.Symbol,
      mintAddress: trade.Trade.Side.Currency.MintAddress,
      imageUrl: metadata?.image || null,
    },

    time: trade.Block.Time,

    // ✅ placeholders you’ll calculate later
    pnl: 0, // to calculate later
    solPrice: trade.Trade.Amount || null, // price at trade time
    marketCapAtTrade: 0, // fetch from external API if needed
    currentMarketCap: 0, // fetch live
  };

  console.log(`🚀 New ${platform} trade for wallet ${formatted.walletAddress}`);
  console.log(formatted);

  this.webSocketService.io.emit("token_transfer", formatted);
}

}
