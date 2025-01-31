import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";
import config from "../../config";

export default function StatisticsScreen() {
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${config.BASE_URL}/stats`);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6b4226" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>
      <Text style={styles.statText}>Total Sales: ${stats.totalSales}</Text>
      <Text style={styles.statText}>Total Orders: {stats.totalOrders}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 20,
  },
  statText: { fontSize: 18, color: "#6b4226", marginBottom: 10 },
});
