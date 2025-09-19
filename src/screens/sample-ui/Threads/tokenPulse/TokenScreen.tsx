// ==== File: src/screens/TokensScreen.tsx ====
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import Icons from "@/assets/svgs";
import { TokenCard } from "./TokenCard";
import COLORS from "@/assets/colors";
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
import { getValidImageSource, IPFSAwareImage } from "@/shared/utils/IPFSImage";
import { DEFAULT_IMAGES } from "@/shared/config/constants";
import { useAppSelector } from "@/shared/hooks/useReduxHooks";

const TABS = [
  { key: "newPairs", label: "New Pairs", icon: Icons.NewTokensIcon, darkIcon: Icons.NewTokensDark },
  { key: "finalStretch", label: "Final Stretch", icon: Icons.FinalStretchicon, darkIcon: Icons.FinalStretchDark },
  { key: "migrated", label: "Migrated", icon: Icons.MigratedIcon, darkIcon: Icons.MigratedDark },
];

export const TokensScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"newPairs" | "finalStretch" | "migrated">("newPairs");
  const [apiTokens, setApiTokens] = useState<BackendToken[]>([]);
  const [loading, setLoading] = useState(false);
  const storedProfilePic = useAppSelector((state) => state.auth.profilePicUrl);
  const showHeader = true;

  const handleProfilePress = () => {
    navigation.navigate("ProfileScreen" as never);
  };

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

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.container}>
        {showHeader && (
          <SafeAreaView edges={["top"]} >
            <Animated.View style={[styles.header, { padding: 16, height: 80,  }]}>
              <View style={headerStyles.container}>
                <TouchableOpacity onPress={() => navigation.navigate("FiltersScreen" as never)} style={headerStyles.profileContainer}>
                  <Icons.SettingsIcon width={28} height={28} color={COLORS.white} />
                </TouchableOpacity>
                <View style={headerStyles.iconsContainer}>
                  <TouchableOpacity onPress={handleProfilePress} style={headerStyles.profileContainer}>
                    <IPFSAwareImage
                      source={storedProfilePic ? getValidImageSource(storedProfilePic) : DEFAULT_IMAGES.user}
                      style={headerStyles.profileImage}
                      defaultSource={DEFAULT_IMAGES.user}
                      key={Platform.OS === "android" ? `profile-${Date.now()}` : "profile"}
                    />
                  </TouchableOpacity>
                </View>
                <View style={headerStyles.absoluteLogoContainer}>
                  <Icons.AppLogo width={28} height={28} />
                </View>
              </View>
            </Animated.View>
          </SafeAreaView>
        )}

        {/* Tabs */}
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => {
            const IconComp = activeTab === tab.key ? tab.icon : tab.darkIcon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key as typeof activeTab)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <IconComp width={16} height={16} />
                  <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>


        {/* List */}
        <FlatList
          data={mappedApiTokens}
          keyExtractor={(item, idx) => item.mint ?? `${activeTab}-${idx}`}
          renderItem={({ item }) => <TokenCard {...item} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={{ color: COLORS.greyMid, textAlign: "center", marginTop: 20 }}>
              {loading ? "Loading..." : "No tokens found."}
            </Text>
          }
        />

        {/* Fixed Button */}
        <TouchableOpacity
          style={styles.launchButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("MeteoraScreen" as never)}
        >
          <Text style={styles.launchButtonText}>Launch a Coin</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { width: "100%", backgroundColor: COLORS.background, alignItems: "center" },

  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 14,
    marginLeft: 2,
    marginRight: 8,
    borderRadius: 20,
    // paddingVertical: 12,
  },
  activeTab: {
    backgroundColor: "#1C2233",
    borderWidth: 1,
    borderColor: "#2F3848",
    paddingBottom: 3,
    paddingTop: 3,
  },
  tabText: {
    fontWeight: "600",
    color: COLORS.greyMid,
    fontSize: 12.75,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
  launchButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});


export const headerStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", position: "relative" },
  profileContainer: { width: 36, height: 36, borderRadius: 18, overflow: "hidden" },
  profileImage: { width: "100%", height: "100%", borderRadius: 18, backgroundColor: COLORS.greyDark },
  absoluteLogoContainer: { position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center", zIndex: -1 },
  iconsContainer: { flexDirection: "row", alignItems: "center" },
  iconButton: { paddingHorizontal: 4 },
});
