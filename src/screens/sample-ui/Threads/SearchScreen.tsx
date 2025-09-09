// ==== File: src/screens/SearchScreen.tsx ====
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import TokenCard from "./TokenCardComponent";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/core/shared-ui";
import { useNavigation } from "@react-navigation/native";
import COLORS from "@/assets/colors";
import { LinearGradient } from "expo-linear-gradient";

// ✅ Correct import for token fetchers
import {
  fetchXstockTokens,
  fetchLSTsTokens,
  fetchBlueChipMemes,
  fetchAITokens,
} from "./tokenPulse/tokenServicefile";

import { ensureCompleteTokenInfo } from "@/modules/data-module";

const TABS = [
  { key: "Trending", label: "Trending" },
  { key: "Popular", label: "Popular" },
  { key: "Featured", label: "Featured" },
  { key: "Stocks", label: "Stocks" },
  { key: "AI", label: "AI" },
  { key: "LSTs", label: "LSTs" },
  { key: "BlueChip", label: "Blue Chip Memes" },
  { key: "Holding", label: "Holding" },
];

// static placeholder data for non-API tabs
const TAB_DATA: Record<string, any[]> = {
  Trending: [
    { name: "Baby Troll", symbol: "TROLL", mc: "$31.46K", liq: "$99.07K", vol: "$5.67M", change: 192.44 },
    { name: "Pengu", symbol: "PENGU", mc: "$2.21B", liq: "$8.28M", vol: "$2.79M", change: 0.30 },
  ],
  Popular: [
    { name: "BOOG", symbol: "BOOG", mc: "$8.32K", liq: "$11.74K", vol: "$2.74M", change: -93.78 },
    { name: "TAELS", symbol: "TAELS", mc: "$9.13K", liq: "$13.06K", vol: "$2.55M", change: -59.82 },
  ],
  Featured: [
    { name: "JUMBA", symbol: "JUMBA", mc: "$8.3K", liq: "$11.53K", vol: "$2.56M", change: 133.31 },
  ],
  AI: [{ name: "AICoin", symbol: "AI", mc: "$1.2M", liq: "$300K", vol: "$50K", change: 12.3 }],
  BlueChip: [{ name: "Doge", symbol: "DOGE", mc: "$9B", liq: "$2B", vol: "$800M", change: 4.5 }],
  Holding: [{ name: "MyHold", symbol: "HOLD", mc: "$500K", liq: "$50K", vol: "$20K", change: -2.1 }],
};

function formatCompactNumber(value: number | string | undefined): string {
  const num = Number(value ?? 0);
  if (isNaN(num)) return "0";
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Trending");
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Fetch when tab changes
  useEffect(() => {
    ensureCompleteTokenInfo;
    let mounted = true;

    async function load() {
      setLoading(true);
      setTokens([]);
      try {
        if (activeTab === "Stocks") {
          const res = await fetchXstockTokens();
          if (!mounted) return;
          setTokens(
            res.map((t: any) => ({
              name: t.name ?? "Unknown",
              symbol: t.symbol ?? "",
              logo: t.image,
              mc: t.marketCap ? `$${formatCompactNumber(t.marketCap)}` : "-",
              liq: t.liquidity ? `$${formatCompactNumber(t.liquidity)}` : "-",
              vol: `$${formatCompactNumber(t.totalVolume ?? 0)}`,
              change: 0,
            }))
          );
        } else if (activeTab === "LSTs") {
          const res = await fetchLSTsTokens();
          if (!mounted) return;
          setTokens(
            res.map((t: any) => ({
              mint: t.mint,
              name: t.name ?? "Unknown",
              symbol: t.symbol ?? "",
              logo: t.image,
              mc: "-",
              liq: "-",
              vol: `$${formatCompactNumber(t.volume7dUSD ?? 0)}`,
              change: 0,
            }))
          );
        } else if (activeTab === "BlueChip") {
          const res = await fetchBlueChipMemes();
          if (!mounted) return;
          setTokens(
            res.map((t: any) => ({
              mint: t.mint,
              name: t.name ?? "Unknown",
              symbol: t.symbol ?? "",
              logo: t.image,
              mc: t.marketcap ? `$${formatCompactNumber(t.marketcap)}` : "-",
              liq: "-",
              vol: "-",
              change: 0,
            }))
          );
        } else if (activeTab === "AI") {
          const res = await fetchAITokens();
          if (!mounted) return;
          setTokens(
            res.map((t: any) => ({
              mint: t.mint,
              name: t.name ?? "Unknown",
              symbol: t.symbol ?? "",
              logo: t.image,
              mc: t.marketCap ? `$${formatCompactNumber(t.marketCap)}` : "-",
              liq: t.liquidity ? `$${formatCompactNumber(t.liquidity)}` : "-",
              vol: "-",
              change: 0,
            }))
          );
        } else {
          setTokens(TAB_DATA[activeTab] || []);
        }
      } catch (err) {
        console.error("[SearchScreen] Error loading tokens:", err);
        if (mounted) setTokens([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={[styles.container, Platform.OS === "android" && styles.androidSafeArea]}>
        <AppHeader title="App" showBackButton={true} onBackPress={handleBack} />

        <View style={styles.subcontainer}>
          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={{ paddingHorizontal: 8 }}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Token list */}
          {loading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator size="small" color={COLORS.brandPrimary} />
              <Text style={{ color: COLORS.greyMid, marginTop: 8 }}>
                Loading {activeTab}...
              </Text>
            </View>
          ) : (
            <FlatList
              data={tokens}
              keyExtractor={(item, idx) =>
                (item.mint ?? item.symbol ?? item.name ?? idx.toString()) + "-" + idx
              }
              renderItem={({ item }) => <TokenCard {...item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={{ color: COLORS.greyMid, textAlign: "center", marginTop: 20 }}>
                  No tokens found.
                </Text>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  androidSafeArea: { paddingTop: 0 },
  subcontainer: {},
  tabBar: {
    flexDirection: "row",
    paddingVertical: 15,
  },
  tab: {
    paddingHorizontal: 16,
    marginRight: 18,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: "#2E7D32",
    paddingBottom: 5,
    paddingTop: 3,
  },
  tabText: {
    color: "#AAA",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFF",
  },
});
