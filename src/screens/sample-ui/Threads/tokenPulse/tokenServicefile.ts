// ==== File: src/services/tokenService.ts ====
import { SERVER_URL } from "@env";

const ALMOST_BONDED_RELATIVE = "/api/tokenRelatedData/almost-bonded-tokens";
const MIGRATED_RELATIVE = "/api/tokenRelatedData/migrated-tokens";
const NEWLY_CREATED_RELATIVE = "/api/tokenRelatedData/newly-created-tokens"; // ✅ new
const XSTOCK_RELATIVE = "/api/tokenRelatedData/xstock-tokens"; // <-- new
const LSTS_RELATIVE = "/api/tokenRelatedData/lsts-tokens"; // <--- new
// ==== Add below existing imports/consts ====
const BLUECHIP_RELATIVE = "/api/tokenRelatedData/bluechip-memes";
const AI_RELATIVE = "/api/tokenRelatedData/ai-tokens";

export const BLUECHIP_ENDPOINT = `${SERVER_URL}${BLUECHIP_RELATIVE}`;
export const AI_ENDPOINT = `${SERVER_URL}${AI_RELATIVE}`;
export const ALMOST_BONDED_ENDPOINT = `${SERVER_URL}${ALMOST_BONDED_RELATIVE}`;
export const MIGRATED_ENDPOINT = `${SERVER_URL}${MIGRATED_RELATIVE}`;
export const NEWLY_CREATED_ENDPOINT = `${SERVER_URL}${NEWLY_CREATED_RELATIVE}`; // ✅ new
export const XSTOCK_ENDPOINT = `${SERVER_URL}${XSTOCK_RELATIVE}`; // <-- new
export const LSTS_ENDPOINT = `${SERVER_URL}${LSTS_RELATIVE}`; // <--- new

export type BackendAnalytics = {
  totalBuys?: string | number;
  totalSells?: string | number;
  totalTrades?: string | number;
  allTimeVolumeUSD?: number | string;
  currentVolumeUSD?: number | string;
  holderCount?: string | number;
};

export type BackendToken = {
  mint: string;
  name: string | null;
  symbol: string | null;
  uri: string | null;
  image: string | null;
  createdOn?: string | null;
  twitterX?: string | null;
  telegramX?: string | null;
  website?: string | null;
  blockTime?: string | null; // ISO string
  slot?: string | null;
  bondingProgress?: number | null;
  analytics?: BackendAnalytics | null;
  protocolFamily?: string | null;
  method?: string | null;
  feePayer?: string | null;
  fee?: string | null;
  feeInUSD?: string | null;
};

async function fetchJson(url: string) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tokens)) return data.tokens;
  return data?.data ?? data;
}

export async function fetchAlmostBondedTokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(ALMOST_BONDED_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchAlmostBondedTokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchMigratedTokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(MIGRATED_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchMigratedTokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchXstockTokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(XSTOCK_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchXstockTokens error:", err?.message ?? err);
    return [];
  }
}
// ✅ New function for newly created tokens
export async function fetchNewlyCreatedTokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(NEWLY_CREATED_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchNewlyCreatedTokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchLSTsTokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(LSTS_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchLSTsTokens error:", err?.message ?? err);
    return [];
  }
}

// Fetch BlueChip Meme tokens
export async function fetchBlueChipMemes(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(BLUECHIP_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchBlueChipMemes error:", err?.message ?? err);
    return [];
  }
}

// Fetch AI tokens
export async function fetchAITokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(AI_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchAITokens error:", err?.message ?? err);
    return [];
  }
}

/** getRelativeTime: accepts ISO string or unix seconds/ms number */
export function getRelativeTime(blockTime: string | number | undefined): string {
  if (!blockTime) return "0s";
  let ts: number;
  if (typeof blockTime === "string") {
    const parsed = new Date(blockTime).getTime();
    if (isNaN(parsed)) return "invalid";
    ts = parsed;
  } else {
    ts = blockTime < 1e12 ? blockTime * 1000 : blockTime;
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - ts);
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

