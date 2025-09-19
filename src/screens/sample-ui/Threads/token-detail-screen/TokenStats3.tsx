// src/components/TokenStats3.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Image,
} from "react-native";
import COLORS from "@/assets/colors";
import SampleAvatar from "@/assets/images/User2.png";
type Holder = {
    id: string;
    address: string;
    percentage: string;
    amount: string;
    value: string;
};

type Activity = {
    id: string;
    user: string;
    type: "BUY" | "SELL";
    amount: string;
    price: string;
    change: string;
    time: string;
};

const TokenStats3: React.FC = () => {
    const [showAllHolders, setShowAllHolders] = useState(false);
    const [showAllActivity, setShowAllActivity] = useState(false);

    const holders: Holder[] = [
        { id: "1", address: "7AN6...rdfk", percentage: "36.55%", amount: "365.46B", value: "$2.95B" },
        { id: "2", address: "5Sbg...thwf", percentage: "8.00%", amount: "80B", value: "$646.58M" },
        { id: "3", address: "GGNK...VaAM", percentage: "3.50%", amount: "35B", value: "$282.88M" },
        { id: "4", address: "1XXk...ZZ12", percentage: "2.10%", amount: "20B", value: "$150.00M" },
    ];

    const activities: Activity[] = [
        { id: "1", user: "HUSHPIXIE", type: "BUY", amount: "-0.16 SOL", price: "@ 8.08B", change: "-0.02%", time: "8h" },
        { id: "2", user: "HUSHPIXIE", type: "BUY", amount: "-0.17 SOL", price: "@ 8.09B", change: "-0.01%", time: "8h" },
        { id: "3", user: "HUSHPIXIE", type: "SELL", amount: "+0.12 SOL", price: "@ 7.95B", change: "+0.03%", time: "9h" },
        { id: "4", user: "MOONCAT", type: "BUY", amount: "-0.22 SOL", price: "@ 8.15B", change: "-0.05%", time: "10h" },
    ];

    const displayedHolders = showAllHolders ? holders : holders.slice(0, 3);
    const displayedActivities = showAllActivity ? activities : activities.slice(0, 2);

    return (
        <View style={styles.container}>
            {/* Holders Section */}
            <Text style={styles.sectionTitle}>Top Holders</Text>
            <FlatList
                data={displayedHolders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.holderRow}>
                        <View style={styles.holderIcon} />
                        <View style={styles.holderInfo}>
                            <Text style={styles.holderAddress}>{item.address}</Text>
                            <Text style={styles.holderAmount}>{item.amount}</Text>
                        </View>
                        <View style={styles.holderRight}>
                            <Text style={styles.holderPercent}>{item.percentage}</Text>
                            <Text style={styles.holderValue}>{item.value}</Text>
                        </View>
                    </View>
                )}
            />
            <TouchableOpacity onPress={() => setShowAllHolders(!showAllHolders)}>
                <Text style={styles.viewMore}>
                    {showAllHolders ? "VIEW LESS" : "VIEW MORE"}
                </Text>
            </TouchableOpacity>

            {/* Activity Section */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Activity</Text>
            <FlatList
                data={displayedActivities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.activityRow}>
                        <Image
                            source={SampleAvatar}
                            style={styles.avatar}
                        />
                        <View style={styles.activityInfo}>
                            <Text style={styles.username}>{item.user}</Text>
                            <View style={styles.innerActivity}>
                                <Text
                                    style={[
                                        styles.activityType,
                                        item.type === "BUY" ? styles.buy : styles.sell,
                                    ]}
                                >
                                    {item.type}
                                </Text>
                                <Text style={styles.activityAmount}>
                                    {item.amount} {item.price}
                                </Text>
                            </View>

                        </View>
                        <View style={styles.activityRight}>
                            <Text style={styles.activityChange}>{item.change}</Text>
                            <Text style={styles.activityTime}>{item.time}</Text>
                        </View>
                    </View>
                )}
            />
            <TouchableOpacity onPress={() => setShowAllActivity(!showAllActivity)}>
                <Text style={styles.viewMore}>
                    {showAllActivity ? "VIEW LESS" : "VIEW MORE"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
    },
    viewMore: {
        color: "#888",
        fontSize: 13,
        textAlign: "center",
        marginVertical: 10,
    },
    innerActivity:{
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    holderRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        // borderBottomColor: "#333",
    },
    holderIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#444",
        marginRight: 12,
    },
    holderInfo: { flex: 1 },
    holderAddress: { color: "#fff", fontSize: 14, fontWeight: "600" },
    holderAmount: { color: "#aaa", fontSize: 12 },
    holderRight: { alignItems: "flex-end" },
    holderPercent: { color: "#fff", fontSize: 14, fontWeight: "600" },
    holderValue: { color: "#aaa", fontSize: 12 },
    activityRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
    },
    avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
    activityInfo: { flex: 1 },
    username: { color: "#fff", fontSize: 14, fontWeight: "600" },
    activityType: { fontSize: 12, marginVertical: 2 },
    buy: { color: "limegreen" },
    sell: { color: "red" },
    activityAmount: { color: "#aaa", fontSize: 12 },
    activityRight: { alignItems: "flex-end" },
    activityChange: { color: "#ff00aa", fontSize: 12 },
    activityTime: { color: "#777", fontSize: 10, marginTop: 2 },
});

export default TokenStats3;
