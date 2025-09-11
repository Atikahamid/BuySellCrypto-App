// ==== File: src/screens/TokensScreen.tsx ====
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { TokenCard } from "./TokenCard";
import COLORS from "@/assets/colors";
import { AppHeader } from "@/core/shared-ui";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchAlmostBondedTokens,
  fetchMigratedTokens,
  fetchNewlyCreatedTokens,
  BackendToken,
  getRelativeTime,
} from "./tokenServicefile";
import { LinearGradient } from "expo-linear-gradient";

export const TokensScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] =
    useState<"newPairs" | "finalStretch" | "migrated">("newPairs");
  const [apiTokens, setApiTokens] = useState<BackendToken[]>([]);
  const [loading, setLoading] = useState(false);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Fetch when tab changes
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setApiTokens([]);
      try {
        if (activeTab === "finalStretch") {
          const t = await fetchAlmostBondedTokens();
          if (mounted) setApiTokens(t);
        } else if (activeTab === "migrated") {
          const t = await fetchMigratedTokens();
          if (mounted) setApiTokens(t);
        } else {
          const t = await fetchNewlyCreatedTokens();
          if (mounted) setApiTokens(t);
        }
      } catch (err) {
        if (mounted) setApiTokens([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const mappedApiTokens = apiTokens.map((t) => ({
    mint: t.mint,
    logo: t.image ?? "https://dummyimage.com/42x42/666/fff.png&text=?",
    name: t.name ?? "Unknown",
    symbol: t.symbol ?? "",
    mc: `$${Number(t.analytics?.allTimeVolumeUSD ?? 0).toLocaleString()}`,
    twitterX: t.twitterX,
    telegramX: t.telegramX,
    website: t.website,
    protocolFamily: t.protocolFamily,
    holdersCount: Number(t.analytics?.holderCount ?? 0),
    volume: `$${Number(t.analytics?.currentVolumeUSD ?? 0).toFixed(2)}`,
    fee: `$${Number(t.fee ?? 0).toFixed(2)}`,
    txCount: Number(t.analytics?.totalTrades ?? 0),
    createdAgo: t.blockTime ? getRelativeTime(t.blockTime) : "0s",
    stats: {
      starUser: "-0%",
      cloud: "0%",
      target: "-0%",
      ghost: "0%",
      blocks: "-0%",
    },
  }));

  const renderTab = (key: typeof activeTab, label: string) => (
    <TouchableOpacity
      key={key}
      style={[styles.tab, activeTab === key && styles.activeTab]}
      onPress={() => setActiveTab(key)}
    >
      <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView
        style={[
          styles.container,
          Platform.OS === "android" && styles.androidSafeArea,
        ]}
      >
        <AppHeader title="App" showBackButton={true} onBackPress={handleBack} />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {renderTab("newPairs", "New Pairs")}
          {renderTab("finalStretch", "Final Stretch")}
          {renderTab("migrated", "Migrated")}
        </View>

        {/* List */}
        <FlatList
          data={mappedApiTokens}
          keyExtractor={(item, idx) => item.mint ?? `${activeTab}-${idx}`}
          renderItem={({ item }) => <TokenCard {...item} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }} // leave space for button
          ListEmptyComponent={
            <Text
              style={{
                color: COLORS.greyMid,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              {loading ? "Loading..." : "No tokens found."}
            </Text>
          }
        />

        {/* Fixed Button */}
        <TouchableOpacity
          style={styles.launchButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("MeteoraScreen" as never)} // <-- replace with your screen name
        >
          <Text style={styles.launchButtonText}>Launch a Coin</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  androidSafeArea: {
    paddingTop: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
  },
  tab: {
    paddingBottom: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brandPrimary,
  },
  tabText: {
    color: COLORS.greyMid,
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  launchButton: {
    position: "absolute",
    bottom: 80,
    left: 70,
    right: 70,
    backgroundColor: "#82a7d7ff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  launchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
