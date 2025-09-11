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
export const LatestSubscriptionQuery = `
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
export const queryOne = `
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


export const NEWLY_CREATED_TOKENS_SUB = /* GraphQL */ `
subscription NewlyCreatedTokensRealTime {
  Solana {
    Instructions(
      where: {
        Instruction: {
          Program: { Address: { is: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s" }, Method: { is: "CreateMetadataAccountV3" } }
        }
        Transaction: { Result: { Success: true } }
      }
      orderBy: { descending: Block_Time }
    ) {
      Block { Time Slot }
      Instruction {
        Accounts {
          Address
          Token { Mint Owner ProgramId }
        }
        Program {
          Address
          Name
          Method
          Arguments {
            Name
            Type
            Value {
              ... on Solana_ABI_Json_Value_Arg { json }
              ... on Solana_ABI_String_Value_Arg { string }
              ... on Solana_ABI_Address_Value_Arg { address }
              ... on Solana_ABI_Boolean_Value_Arg { bool }
              ... on Solana_ABI_Integer_Value_Arg { integer }
              ... on Solana_ABI_Float_Value_Arg { float }
              ... on Solana_ABI_Bytes_Value_Arg { hex }
              ... on Solana_ABI_BigInt_Value_Arg { bigInteger }
            }
          }
          AccountNames
        }
      }
      Transaction { Fee FeeInUSD FeePayer Index }
    }
  }
}
`;
export const NEWLY_CREATED_TOKENS_QUERY = `
query NewlyCreatedTokensLast10Minutes {
  Solana {
    Instructions(
      where: {
        Block: { Time: { since_relative: { minutes_ago: 10 } } }
        Instruction: {
          Program: { 
            Address: { is: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s" }, 
            Method: { is: "CreateMetadataAccountV3" } 
          }
        }
        Transaction: { Result: { Success: true } }
      }
      orderBy: { descending: Block_Time }
      limit: { count: 25 }
    ) {
      Block { 
        Time 
        Slot 
      }
      Instruction {
        Accounts {
          Address
          Token { 
            Mint 
            Owner 
            ProgramId 
          }
        }
        Program {
          Arguments {
            Name
            Value {
              ... on Solana_ABI_Json_Value_Arg { json }
            }
          }
        }
      }
      Transaction { 
        Fee 
        FeeInUSD 
        FeePayer 
      }
    }
  }
}`;

export const GET_TOKEN_ANALYTICS_QUERY = /* GraphQL */ `
query GetTokenAnalyticsSummary($tokenMint: String!) {
  Solana {
    # 1. HOLDER COUNT
    holder_count: BalanceUpdates(
      where: {
        BalanceUpdate: {
          Currency: { MintAddress: { is: $tokenMint } }
          PostBalance: { gt: "0" }
        }
      }
    ) {
      total_holders: uniq(of: BalanceUpdate_Account_Owner)
    }

    # 2. ALL-TIME TRADING STATS
    all_time_trading_stats: DEXTradeByTokens(
      where: {
        Trade: { Currency: { MintAddress: { is: $tokenMint } } }
        Transaction: { Result: { Success: true } }
      }
    ) {
      total_buys: count(if: { Trade: { Side: { Type: { is: buy } } } })
      total_sells: count(if: { Trade: { Side: { Type: { is: sell } } } })
      total_trades: count
    }

    # 3. CURRENT TRADING STATS (24H)
    current_trading_stats: DEXTradeByTokens(
      where: {
        Trade: { Currency: { MintAddress: { is: $tokenMint } } }
        Transaction: { Result: { Success: true } }
        Block: { Time: { since: "2024-12-04T00:00:00Z" } } # last 24h
      }
    ) {
      current_volume_usd: sum(of: Trade_Side_AmountInUSD)
    }
  }
}

`;
export const SIMPLE_PAST_TRADES_QUERY = `
query SimplePastTrades($walletAddresses: [String!]) {
  Solana {
    DEXTradeByTokens(
      limit: {count: 20}
      orderBy: {descending: Block_Time}
      where: {Transaction: {Result: {Success: true}}, Trade: {Currency: {Fungible: true, MintAddress: {notIn: ["So11111111111111111111111111111111111111112", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"]}}, Amount: {gt: "0"}}, any: [{Trade: {Account: {Address: {in: $walletAddresses}}}}]}
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

export const ALMOST_BONDED_QUERY = `
query GetTokensByBondingCurveAndAge {
  Solana {
    DEXPools(
      where: {Pool: {Base: {PostAmount: {ge: "230693000", le: "801725000"}}, 
        Dex: {ProgramAddress: {
          in: [
            "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", 
            "MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG", 
            "FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1", 
            "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN",
            "virEFLZsQm1iFAs8py1XnziJ67gTzW2bfCWhxNPfccD"
            ]}}, 
        Market: {QuoteCurrency: {
          MintAddress: {
            in: [
              "11111111111111111111111111111111", 
              "So11111111111111111111111111111111111111112"
            ]}}}}, 
        Transaction: {
          Result: {Success: true}}, Block: {Time: {since_relative: {hours_ago: 10}}}}
          limitBy: {by: Pool_Market_BaseCurrency_MintAddress, count: 1}
          orderBy: {descending: Block_Time}
          limit: {count: 25}
    ) {
      Bonding_Curve_Progress_Percentage: calculate(
        expression: "100 - ((($Pool_Base_Balance - 206900000) * 100) / 793100000)"
      )
      Pool {
        Market {
          BaseCurrency {
            MintAddress
            Name
            Symbol
            Decimals
            Uri
          }
          MarketAddress
        }
        Dex {
          ProtocolName
          ProtocolFamily
          ProgramAddress
        }
        Base {
          Balance: PostAmount
        }
        Quote {
          PostAmount
          PriceInUSD
          PostAmountInUSD
        }
      }
      Block {
        Time
        Slot
        Hash
      }
    }
  }
}
`;

export const GET_MIGRATED_TOKENS_QUERY = `
query GetMigratedTokensLast10Hours {
  Solana {
    Instructions(
      where: {
        Block: { Time: { since_relative: { hours_ago: 10 } } }
        Transaction: { Result: { Success: true } }
        Instruction: {
          Program: {
            Address: {
              in: [
                "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
                "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN",
                "boop8hVGQGqehUK2iVEMEnMrL5RbjywRzHKBmBE7ry4",
                "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj"
              ]
            }
            Method: {
              in: ["withdraw", "migrate_meteora_damm", "migration_damm_v2", "graduate", "complete", "finalize"]
            }
          }
        }
      }
      limit: { count: 25 }
      orderBy: { descending: Block_Time }
    ) {
      Block {
        Time
        Slot
        Hash
      }
      Transaction {
        Signature
        Signer
        Fee
        FeeInUSD
      }
      Instruction {
        Accounts {
          Address
          Token {
            Mint
            Owner
            ProgramId
          }
        }
        Program {
          Address
          Name
          Method
        }
      }
    }
  }
}
`;
export const metadataQuery = `
        query GetTokenMetadataByMintAddress($mintAddress: String!) {
          Solana {
            DEXPools(
              where: {
                Pool: {
                  Market: {
                    BaseCurrency: {
                      MintAddress: { is: $mintAddress }
                    }
                  }
                }
              }
              limitBy: { by: Pool_Market_BaseCurrency_MintAddress, count: 1 }
              orderBy: { descending: Block_Time }
            ) {
              Pool {
                Market {
                  BaseCurrency {
                    MintAddress
                    Name
                    Symbol
                    Decimals
                    Uri
                  }
                  MarketAddress
                }
                Dex {
                  ProtocolName
                  ProtocolFamily
                  ProgramAddress
                }
              }
              Block {
                Time
              }
            }
          }
        }
 `;

export const xSTOCK_TOKENS_QUERY = `
query XStockTokenizedAssets {
  Solana {
    DEXTradeByTokens(
      orderBy: {}
      limit: {count: 100}
      where: {
        any: [
          {Trade: {Currency: {Name: {includesCaseInsensitive: "xStock"}}}}, 
          
        ],
        Transaction: {Result: {Success: true}},
        Block: {Time: {since_relative: {days_ago: 7}}}  # ← Added 7-day filter
      }
    ) {
      Trade {
        Currency {
          Name
          Symbol
          MintAddress
          Decimals
          Uri
        }
        latest_price: PriceInUSD(maximum: Block_Time)
        Market {
          MarketAddress
        }
        Dex {
          ProtocolName
          ProtocolFamily
        }
        Side {
          Currency {
            Name
            Symbol
            MintAddress
          }
        }
      }
      total_volume: sum(of: Trade_Side_AmountInUSD)
      total_trades: count
      unique_traders: uniq(of: Transaction_Signer)
      unique_dexs: uniq(of: Trade_Dex_ProtocolName)
    }
  }
}
`;

export const VERIFIED_LSTS_QUERY = `
query VerifiedLSTsOnly {
  Solana {
    DEXTradeByTokens(
      orderBy: {descendingByField: "volume_7d_usd"}
      where: {
        Trade: {
          Currency: {
            MintAddress: {
              in: [
                "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
                "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
                "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
                "BNso1VUJnh4zcfpZa6986Ea66P6TCp59hvtNJ8b1X85",
                "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
                "kySo1nETpsZE2NWe5vj2C64mPSciH1SppmHb4XieQ7B",
                "CDCSoLckzozyktpAp9FWT3w92KFJVEUxAU7cNu2Jn3aX",
                "7cBuurYDdaqxnem7KyMTci6SWhjJKroZ6NUjqH2ewEPB",
                "GEJpt3Wjmr628FqXxTgxMce1pLntqPinPzks4eu9BC26",
                "Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ",
                "7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn",
                "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A",
                "Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B"
              ]
            }
          }
        },
        Transaction: {Result: {Success: true}},
        Block: {Time: {since_relative: {days_ago: 90}}}  # ← Extended to 90 days
      }
    ) {
      Trade {
        Currency {
          Name
          Symbol
          MintAddress
          Uri
        }
        latest_price_usd: PriceInUSD(maximum: Block_Time)
        latest_price_sol: Price(maximum: Block_Time)
        Dex {
          ProtocolName
        }
      }
      
      # Get metrics for different time periods
      volume_7d_usd: sum(
        of: Trade_Side_AmountInUSD
        if: {Block: {Time: {since_relative: {days_ago: 7}}}}
      )
      volume_30d_usd: sum(
        of: Trade_Side_AmountInUSD
        if: {Block: {Time: {since_relative: {days_ago: 30}}}}
      )
      
      trades_7d: count(if: {Block: {Time: {since_relative: {days_ago: 7}}}})
      trades_30d: count(if: {Block: {Time: {since_relative: {days_ago: 30}}}})
      
      unique_traders_7d: uniq(
        of: Transaction_Signer
        if: {Block: {Time: {since_relative: {days_ago: 7}}}}
      )
    }
  }
}
`;

export const TRENDING_TOKENS_QUERY = `
query TrendingByActivitySimple {
  Solana {
    # ========== 1 MINUTE ==========
    trending_1min: DEXTradeByTokens(
      limit: {count: 50}
      orderBy: {descendingByField: "tradesCountWithUniqueTraders"}
      where: {
        Block: {Time: {since_relative: {minutes_ago: 1}}}
        Trade: {Currency: {MintAddress: {notIn: ["So11111111111111111111111111111111111111112","11111111111111111111111111111111", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB","cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij","3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh","7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"]}}}
        Transaction: {Result: {Success: true}}
      }
    ) {
      Trade {Currency {Name Symbol MintAddress Uri}}
      tradesCountWithUniqueTraders: count(distinct: Transaction_Signer)
      traded_volume: sum(of: Trade_Side_AmountInUSD)
      trades: count
    }

    # ========== 5 MINUTES ==========
    trending_5min: DEXTradeByTokens(
      limit: {count: 50}
      orderBy: {descendingByField: "tradesCountWithUniqueTraders"}
      where: {
        Block: {Time: {since_relative: {minutes_ago: 5}}}
        Trade: {Currency: {MintAddress: {notIn: ["So11111111111111111111111111111111111111112","11111111111111111111111111111111", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB","cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij","3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh","7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"]}}}
        Transaction: {Result: {Success: true}}
      }
    ) {
      Trade {Currency {Name Symbol MintAddress Uri}}
      tradesCountWithUniqueTraders: count(distinct: Transaction_Signer)
      traded_volume: sum(of: Trade_Side_AmountInUSD)
      trades: count
    }

    # ========== 30 MINUTES ==========
    trending_30min: DEXTradeByTokens(
      limit: {count: 50}
      orderBy: {descendingByField: "tradesCountWithUniqueTraders"}
      where: {
        Block: {Time: {since_relative: {minutes_ago: 30}}}
        Trade: {Currency: {MintAddress: {notIn: ["So11111111111111111111111111111111111111112","11111111111111111111111111111111", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB","cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij","3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh","7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"]}}}
        Transaction: {Result: {Success: true}}
      }
    ) {
      Trade {Currency {Name Symbol MintAddress Uri}}
      tradesCountWithUniqueTraders: count(distinct: Transaction_Signer)
      traded_volume: sum(of: Trade_Side_AmountInUSD)
      trades: count
    }

    # ========== 1 HOUR ==========
    trending_1hour: DEXTradeByTokens(
      limit: {count: 20}
      orderBy: {descendingByField: "tradesCountWithUniqueTraders"}
      where: {
        Block: {Time: {since_relative: {hours_ago: 1}}}
        Trade: {Currency: {MintAddress: {notIn: ["So11111111111111111111111111111111111111112","11111111111111111111111111111111", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB","cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij","3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh","7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"]}}}
        Transaction: {Result: {Success: true}}
      }
    ) {
      Trade {Currency {Name Symbol MintAddress Uri}}
      tradesCountWithUniqueTraders: count(distinct: Transaction_Signer)
      traded_volume: sum(of: Trade_Side_AmountInUSD)
      trades: count
    }
  }
}
`;

export const POPULAR_TOKENS_QUERY = `
query PopularTokensByActivity {
  Solana {
    # ========== 24 HOURS ==========
    popular_24h: DEXTradeByTokens(
      limit: {count: 50}
      orderBy: {descendingByField: "tradesCountWithUniqueTraders"}
      where: {
        Block: {Time: {since_relative: {hours_ago: 24}}}
        Trade: {
          Currency: {
            MintAddress: {
              notIn: [
                "So11111111111111111111111111111111111111112", # Wrapped SOL
                "11111111111111111111111111111111",           # Native SOL
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", # USDC
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", # USDT
                "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij", # Excluded token
                "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh", # Excluded token
                "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"  # ETH
              ]
            }
          }
        }
        Transaction: {Result: {Success: true}}
      }
    ) {
      Trade { Currency { Name Symbol MintAddress Uri} }
      tradesCountWithUniqueTraders: count(distinct: Transaction_Signer)
      traded_volume: sum(of: Trade_Side_AmountInUSD)
      trades: count
    }

    # ========== 7 DAYS ==========
    popular_7d: DEXTradeByTokens(
      limit: {count: 50}
      orderBy: {descendingByField: "tradesCountWithUniqueTraders"}
      where: {
        Block: {Time: {since_relative: {days_ago: 7}}}
        Trade: {
          Currency: {
            MintAddress: {
              notIn: [
                "So11111111111111111111111111111111111111112",
                "11111111111111111111111111111111",
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
                "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
                "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"
              ]
            }
          }
        }
        Transaction: {Result: {Success: true}}
      }
    ) {
      Trade { Currency { Name Symbol MintAddress Uri} }
      tradesCountWithUniqueTraders: count(distinct: Transaction_Signer)
      traded_volume: sum(of: Trade_Side_AmountInUSD)
      trades: count
    }
  }
}
`;

export const BLUECHIP_MEMES_QUERY = `
query BlueChipMemes {
  Solana {
    TokenSupplyUpdates(
      where: {
        TokenSupplyUpdate: {
          PostBalanceInUSD: { ge: "50000000" } # threshold: 50M USD
        }
      }
      orderBy: {descending: TokenSupplyUpdate_PostBalanceInUSD}
      limitBy: {by: TokenSupplyUpdate_Currency_MintAddress, count: 1}
    ) {
      TokenSupplyUpdate {
        Marketcap: PostBalanceInUSD
        Currency {
          Name
          Symbol
          MintAddress
          Fungible
          Decimals
          Uri
        }
      }
    }
  }
}

`;
export const AI_TOKENS_QUERY = `
query AITokensOnSolana {
  Solana {
    DEXTradeByTokens(
      orderBy: {descending: Trade_Side_AmountInUSD}
      limit: {count: 100}
      where: {
        any: [
          # Core AI Keywords
          {Trade: {Currency: {Name: {includesCaseInsensitive: "AI"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "AI"}}}},
          {Trade: {Currency: {Uri: {includesCaseInsensitive: "AI"}}}},
          
          # Artificial Intelligence Variants
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Artificial Intelligence"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Artificial"}}}},
          
          # AGI
          {Trade: {Currency: {Name: {includesCaseInsensitive: "AGI"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "AGI"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "AGIX"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "AGIX"}}}},
          
          # Neural / ML
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Neuro"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "Neuro"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Neural"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Machine Learning"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Deep Learning"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "ML"}}}},
          
          # Bots
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Bot"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "Bot"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Chatbot"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Assistant"}}}},
          
          # Singularity
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Singularity"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "SingularityNET"}}}},
          
          # Infra
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Compute"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "GPU"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Data"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Oracle"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Prediction"}}}},
          
          # Known AI Tokens
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Ocean"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "OCEAN"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Fetch"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "FET"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Render"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "RNDR"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "Akash"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "AKT"}}}},
          {Trade: {Currency: {Name: {includesCaseInsensitive: "ai16z"}}}},
          {Trade: {Currency: {Symbol: {includesCaseInsensitive: "AI16Z"}}}}
        ],
        # Exclude common tokens
        Trade: {
          Currency: {
            MintAddress: {
              notIn: [
                "So11111111111111111111111111111111111111112", # wSOL
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # USDC
              ]
            }
          }
        },
        Transaction: {Result: {Success: true}},
        Block: {Time: {since_relative: {days_ago: 30}}}
      }
    ) {
      Trade {
        Currency {
          Name
          Symbol
          MintAddress
          Decimals
          Uri
        }
        
        # Price Metrics
        latest_price: PriceInUSD(maximum: Block_Time)
        price_24h_ago: PriceInUSD(
          maximum: Block_Time
          if: {Block: {Time: {since_relative: {hours_ago: 24}}}}
        )
        price_7d_ago: PriceInUSD(
          maximum: Block_Time
          if: {Block: {Time: {since_relative: {days_ago: 7}}}}
        )
        # highest_price_7d: max(of: Trade_PriceInUSD)
        # lowest_price_7d: min(of: Trade_PriceInUSD)
        
        # Market Data
        Market {
          MarketAddress
        }
        Dex {
          ProtocolName
          ProtocolFamily
        }
      }
      
      # Volumes
      volume_24h: sum(
        of: Trade_Side_AmountInUSD
        if: {Block: {Time: {since_relative: {hours_ago: 24}}}}
      )
      volume_7d: sum(of: Trade_Side_AmountInUSD)
      
      # Traders
      unique_traders_24h: uniq(
        of: Transaction_Signer
        if: {Block: {Time: {since_relative: {hours_ago: 24}}}}
      )
      unique_traders_7d: uniq(of: Transaction_Signer)
      
      # Trade Count
      total_trades_24h: count(
        if: {Block: {Time: {since_relative: {hours_ago: 24}}}}
      )
      total_trades_7d: count
      
      # Buy/Sell Breakdown
      buy_volume_24h: sum(
        of: Trade_Side_AmountInUSD
        if: {Block: {Time: {since_relative: {hours_ago: 24}}}, Trade: {Side: {Type: {is: buy}}}}
      )
      sell_volume_24h: sum(
        of: Trade_Side_AmountInUSD
        if: {Block: {Time: {since_relative: {hours_ago: 24}}}, Trade: {Side: {Type: {is: sell}}}}
      )
      
      buy_trades_24h: count(
        if: {Block: {Time: {since_relative: {hours_ago: 24}}}, Trade: {Side: {Type: {is: buy}}}}
      )
      sell_trades_24h: count(
        if: {Block: {Time: {since_relative: {hours_ago: 24}}}, Trade: {Side: {Type: {is: sell}}}}
      )
      
      # DEX Spread
      unique_dexs: uniq(of: Trade_Dex_ProtocolName)
      
      # Avg Trade Size
      avg_trade_size_24h: average(
        of: Trade_Side_AmountInUSD
        if: {Block: {Time: {since_relative: {hours_ago: 24}}}}
      )
    }
  }
}
`;

export const TOKEN_DETAIL = `
query TokenMarketCapAndPriceChange($mintAddress: String!) {
  Solana {
    # --- Market Cap & Supply ---
    TokenSupplyUpdates(
      where: {TokenSupplyUpdate: {Currency: {MintAddress: {is: $mintAddress}}}}
      limit: {count: 1}
      orderBy: {descending: Block_Time}
    ) {
      TokenSupplyUpdate {
        PostBalance          # Total supply
        PostBalanceInUSD     # Market cap
        Currency {
          Name
          Symbol
          MintAddress
          Decimals
        }
      }
    }

    # --- Current Price (Latest) ---
    LatestPrice: DEXTradeByTokens(
      where: {
        Transaction: { Result: { Success: true } }
        Trade: {Currency: {MintAddress: {is: $mintAddress}}}
      }
      limit: {count: 1}
      orderBy: {descendingByField: "Block_Time"}
    ) {
      Block {
        Time
      }
      Trade {
        Price
        PriceInUSD
      }
    }

    # --- 24h Price Change Data ---
    PriceChange24h: DEXTradeByTokens(
      where: {
        Transaction: { Result: { Success: true } }
        Trade: {
          Currency: { MintAddress: { is: $mintAddress } }
        }
        Block: { Time: { since_relative: { hours_ago: 24 } } }
      }
    ) {
      Trade {
        CurrentPrice: PriceInUSD(maximum: Block_Time)    # Latest price in 24h window
        Price24hAgo: PriceInUSD(minimum: Block_Time)     # Oldest price in 24h window
      }
      
      PriceChange24h: calculate(
        expression: "(($Trade_CurrentPrice - $Trade_Price24hAgo) / $Trade_Price24hAgo) * 100"
      )
      
      # PriceChangeAbsolute: calculate(
      #   expression: "$Trade_CurrentPrice - $Trade_Price24hAgo"
      # )
    }
  }
}`;

export const GET_MARKETCAP_OF_TOKEN = `
query TokenMarketCapAndPrice($mintAddress: String!) {
  Solana {
    # --- Supply ---
    TokenSupplyUpdates(
      where: {TokenSupplyUpdate: {Currency: {MintAddress: {is: $mintAddress}}}}
      limit: {count: 1}
      orderBy: {descending: Block_Time}
    ) {
      TokenSupplyUpdate {
        PostBalance
        PostBalanceInUSD
      }
    }

    # --- Latest Price ---
    DEXTradeByTokens(
      where: {Trade: {Currency: {MintAddress: {is: $mintAddress}}}}
      limit: {count: 1}
      orderBy: {descendingByField: "Block_Time"}
    ) {
      Block {
        Time
      }
      Trade {
        Price
        PriceInUSD
      }
    }
  }
}

`;

const tokenHolders = `
query TokenHolders($mintAddress: String!) {
  Solana {
    BalanceUpdates(
      where: {BalanceUpdate: {Currency: {MintAddress: {is: $mintAddress}}, PostBalance: {gt: "0"}}}
      orderBy: {descending: Block_Time}
      limitBy: {by: BalanceUpdate_Account_Address, count: 1}
    ) {
      HoldersCount: uniq(of: BalanceUpdate_Account_Address)
      # AllHolders: sum(of: HoldersCount)
      TotalSupply: sum(of: BalanceUpdate_PostBalance)
      BalanceUpdate {
        Account {
          Address
        }
        PostBalance
        PostBalanceInUSD
        
      }
    }
  }
}
`;
const volumeOfTokenBy24Hour= `
query MyQuery {
  Solana {
    DEXTradeByTokens(
      where: {Trade: {Currency: {MintAddress: {is: "9YKeGRC5XoaBNusQLG8fZKMQKPcMj1L1E4RffhNBBunz"}}}, Block: {Time: {since_relative: {hours_ago: 1}}}}
    ) {
      # Trade {
      #   Currency {
      #     MintAddress
      #     Name
      #     Symbol
      #   }
      # }
      Trade_volume_1h: sum(of: Trade_Side_AmountInUSD)
    }
  }
}
`;

const creationTimeOfToken = `
query MyQuery {
  Solana {
    Instructions(
      where: {Instruction: {Accounts: {includes: {Address: {is: "49w3MYrcXEYK5d7GccARFJ6NRsjHdGTqFMqGEKJkbonk"}}}, Program: {Method: {is: "create"}, Name: {}}}}
    ) {
      Block {
        Time
      }
      Transaction {
        Signature
        Signer
      }
      Instruction {
        Accounts {
          Address
        }
      }
    }
  }
}
`;

const priceChange_24Hour = `
query SolanaTokenPriceChange1Hour {
  Solana {
    DEXTradeByTokens(
      where: {
        Transaction: { Result: { Success: true } }
        Trade: {
          Currency: { MintAddress: { is: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv" } }
        }
        Block: { Time: { since_relative: { hours_ago: 24 } } }
      }
    ) {
      Trade {
        Currency {
          Name
          Symbol
          MintAddress
        }
        CurrentPrice: PriceInUSD(maximum: Block_Time)
        Price_1h_ago: PriceInUSD(
          minimum: Block_Time
          if: { Block: { Time: { since_relative: { hours_ago: 24 } } } }
        )
      }
      
      Price_Change_1h: calculate(
        expression: "(($Trade_CurrentPrice - $Trade_Price_1h_ago) / $Trade_Price_1h_ago) * 100"
      )
    }
  }
}`;

// ✅ New route for fetching BlueChip Meme tokens
export const blacklist = [
// Stablecoins
"USDC","USDT","FDUSD","USDY","USD1","DAI","TUSD","USDD",


// Staking derivatives
"mSOL","JitoSOL","JupSOL","bnSOL","bbSOL","JSOL","BNSOL","hSOL","sSOL","MXSOL","JTO","RENDER","W","SAROS","HNT","DBR","STIK",


// Wrapped assets
"WBTC","WETH","cbBTC","renBTC","SPX",


// Infra/DeFi
"JUP","RAY","ORCA","KMNO","DRIFT","SONIC",
"NEON","HUMA","MPLX","ZBCN","ME","JLP"
];

// --------------------volum1----------------------------
// query GetTokenVolume24hTotal($mintAddress: String!) {
//   Solana {
//     DEXTradeByTokens(
//       where: {
//         Trade: { Currency: { MintAddress: { is: $mintAddress } } }
//         Transaction: { Result: { Success: true } }
//         Block: { Time: { since_relative: { hours_ago: 24 } } }
//       }
//     ) {
//       total_volume_24h_USD: sum(of: Trade_Side_AmountInUSD)
//       # total_trades_count: sum(of: Trade_Side_Count)
//     }
//   }
// }

// -------------------volum2-------------------------
// query GetTokenVolume24hTotal($mintAddress: String!) {
//   Solana {
//     DEXTradeByTokens(
//       where: {
//         Trade: {
//           Currency: {
//             MintAddress: { is: $mintAddress }
//           }
//         }
//         Transaction: { Result: { Success: true } }
//         Block: { Time: { since_relative: { hours_ago: 24 } } }
//       }
//     ) {
//       # 🎯 SINGLE AGGREGATED RESULT
//       total_volume_24h_USD: sum(of: Trade_Side_AmountInUSD)
//       total_trades_count: count
//     }
//   }
// }
// ----------------------liquidity-----------------
// query GetTokenLiquidity($mintAddress: String!) {
//   Solana {
//     # 🎯 TOKEN AS BASE CURRENCY
//     AsBaseCurrency: DEXPools(
//       where: {
//         Pool: {
//           Market: {
//             BaseCurrency: {
//               MintAddress: { is: $mintAddress }
//             }
//           }
//         }
//       }
//       limitBy: { by: Pool_Market_MarketAddress, count: 1 }
//     ) {
//       Pool {
//         Base {
//           PostAmountInUSD
//         }
//         Quote {
//           PostAmountInUSD
//         }
//       }
//       TotalLiquidityUSD: calculate(
//         expression: "$Pool_Base_PostAmountInUSD + $Pool_Quote_PostAmountInUSD"
//       )
//     }
    
//     # 🎯 TOKEN AS QUOTE CURRENCY  
//     AsQuoteCurrency: DEXPools(
//       where: {
//         Pool: {
//           Market: {
//             QuoteCurrency: {
//               MintAddress: { is: $mintAddress }
//             }
//           }
//         }
//       }
//       limitBy: { by: Pool_Market_MarketAddress, count: 1 }
//     ) {
//       Pool {
//         Base {
//           PostAmountInUSD
//         }
//         Quote {
//           PostAmountInUSD
//         }
//       }
//       # TotalLiquidityUSD: calculate(
//       #   expression: "$Pool_Base_PostAmountInUSD + $Pool_Quote_PostAmountInUSD"
//       # )
//     }
//   }
// }

// ------------------------blue chip memes---------------------
// query HighLiquidityTokensSimple {
//   Solana {
//     DEXPools(
//       limit: {count: 100}
//       limitBy: {by: Pool_Market_BaseCurrency_MintAddress, count: 1}
//       where: {
//         Pool: {
//           Base: {PostAmountInUSD: {ge: "10000000"}},
//           Market: {
//             QuoteCurrency: {
//               MintAddress: {
//                 in: [
//                   "So11111111111111111111111111111111111111112",
//                   "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
//                   "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
//                 ]
//               }
//             }
//           }
//         }
//       }
//       orderBy: {descending: Pool_Base_PostAmountInUSD}
//     ) {
//       # Token Details
//       Pool {
//         Market {
//           MarketAddress
//           BaseCurrency {
//             MintAddress
//             Name
//             Symbol
//             Decimals
//             Uri
//             UpdateAuthority
//             IsMutable
//             ProgramAddress
//           }
//           QuoteCurrency {
//             MintAddress
//             Name
//             Symbol
//             Decimals
//           }
//         }
        
//         # Liquidity Data
//         Base {
//           PostAmount
//           PostAmountInUSD
//           Price
//           PriceInUSD
//         }
        
//         Quote {
//           PostAmount
//           PostAmountInUSD
//           Price
//           PriceInUSD
//         }
        
//         # DEX Protocol
//         Dex {
//           ProtocolName
//           ProtocolFamily
//           ProgramAddress
//         }
//       }
      
//       # Timing Information
//       Block {
//         Time
//         Date
//       }
//     }
//   }
// }