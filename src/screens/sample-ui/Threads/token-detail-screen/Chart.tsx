import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const graphData = {
    "1H": [50, 48, 52, 51, 49, 53, 52, 50, 51, 52, 51, 53],
    "6H": [50, 48, 52, 51, 49, 53, 52, 50, 51, 52, 51, 53],
    "1D": [45, 47, 46, 52, 50, 55, 58, 56, 60, 58, 62, 65],
    "1W": [40, 45, 43, 48, 52, 50, 55, 58, 54, 60, 58, 63],
    "1M": [30, 35, 45, 42, 55, 52, 58, 65, 75, 72, 78, 85],
    MAX: [10, 15, 25, 35, 32, 45, 55, 65, 75, 85, 88, 95],
};

const Chart: React.FC = () => {
    const [selectedRange, setSelectedRange] = useState<keyof typeof graphData>("1H");

    return (
        <View style={styles.chartContainer}>

            {/* Chart Placeholder */}
            <View style={styles.fakeChart}>
                <Text style={{ color: "#fff" }}>
                    Showing {selectedRange} data:{" "}
                    {graphData[selectedRange].join(", ")}
                </Text>
            </View>
            {/* Time Range Tabs */}
            <View style={styles.tabRow}>
                {Object.keys(graphData).map((range) => (
                    <TouchableOpacity
                        key={range}
                        style={[
                            styles.tab,
                            selectedRange === range && styles.tabActive,
                        ]}
                        onPress={() => setSelectedRange(range as keyof typeof graphData)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                selectedRange === range && styles.tabTextActive,
                            ]}
                        >
                            {range}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.noTrades}>No trades yet 😕 {"\n"}Trading history shows here once you make your first trade. </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    chartContainer: { paddingHorizontal: 16, marginTop: 16 },
    tabRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 12,
        marginTop: 10
    },
    tab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#222",
    },
     noTrades: { color: "#aaa", textAlign: "center", fontSize: 16, fontWeight: "600", marginHorizontal: 20, marginTop: 30 },
    tabActive: {
        backgroundColor: "#77aae7ff",
    },
    tabText: {
        color: "#aaa",
        fontSize: 14,
    },
    tabTextActive: {
        color: "#000",
        fontWeight: "600",
    },
    fakeChart: {
        height: 200,
        backgroundColor: "#131b39ff",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default Chart;
