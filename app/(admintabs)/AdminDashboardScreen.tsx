import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<{
    orders: number;
    users: number;
    revenue: number;
  }>({
    orders: 0,
    users: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");

        if (!token) {
          console.error("No access token found");
          return;
        }

        const response = await axios.get(
          `${config.BASE_URL}/admin/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // נניח שהשרת מחזיר את הנתונים בצורה:
        // { ordersCount, usersCount, totalRevenue }
        const { ordersCount, usersCount, totalRevenue } = response.data;
        setStats({
          orders: ordersCount,
          users: usersCount,
          revenue: totalRevenue,
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
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
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.statText}>Total Orders: {stats.orders}</Text>
      <Text style={styles.statText}>Total Users: {stats.users}</Text>
      <Text style={styles.statText}>
        Total Revenue: ${stats.revenue.toFixed(2)}
      </Text>

      {/* ניווט למסכים נוספים */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("InventoryScreen")}
      >
        <Text style={styles.buttonText}>Manage Inventory</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("StatisticsScreen")}
      >
        <Text style={styles.buttonText}>View Statistics</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("AdminPanelScreen")}
      >
        <Text style={styles.buttonText}>Admin Panel</Text>
      </TouchableOpacity>
    </View>
  );
}

// 🌟 עיצוב המסך
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 20,
  },
  statText: {
    fontSize: 18,
    color: "#6b4226",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#6b4226",
    padding: 15,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
