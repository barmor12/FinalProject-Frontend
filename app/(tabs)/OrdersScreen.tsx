import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import config from "../../config";

// מבנה נתונים להזמנה
interface Order {
  _id: string;
  user: {
    _id: string;
    email: string;
  };
  items: Array<{
    cake: {
      _id: string;
      name: string;
      image?: string;
    };
    quantity: number;
  }>;
  totalPrice: number;
  status: "Pending" | "Completed" | "Cancelled";
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  // **שליפת ההזמנות מהשרת**
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        console.error("❌ [ERROR] No access token found.");
        return;
      }

      const response = await axios.get(`${config.BASE_URL}/order/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📥 Orders Fetched:", response.data); // ✅ בדוק שהנתונים מתקבלים

      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error("❌ [ERROR] Failed to fetch orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // **משיכת מסך לרענון**
  const onRefresh = useCallback(() => {
    fetchOrders();
  }, []);

  // **סינון ההזמנות לפי סטטוס**
  const filterOrders = (status: string | null) => {
    setSelectedFilter(status);
    if (!status) {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === status));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Orders</Text>

      {/* **כפתורי סינון סטטוס** */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === null && styles.activeFilter,
          ]}
          onPress={() => filterOrders(null)}
        >
          <Text style={styles.filterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "Pending" && styles.activeFilter,
          ]}
          onPress={() => filterOrders("Pending")}
        >
          <Text style={styles.filterText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "Completed" && styles.activeFilter,
          ]}
          onPress={() => filterOrders("Completed")}
        >
          <Text style={styles.filterText}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "Cancelled" && styles.activeFilter,
          ]}
          onPress={() => filterOrders("Cancelled")}
        >
          <Text style={styles.filterText}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      {/* **רשימת ההזמנות עם אפשרות למשוך לרענון** */}
      {loading ? (
        <ActivityIndicator size="large" color="#6b4226" />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollViewContent}
        >
          {filteredOrders.length === 0 ? (
            <Text style={styles.emptyMessage}>No orders found</Text>
          ) : (
            filteredOrders.map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderText}>Order ID: {order._id}</Text>
                  <Text style={[styles.statusText, styles[order.status]]}>
                    {order.status}
                  </Text>
                </View>
                <View style={styles.orderDetails}>
                  {order.items.map((item, index) => (
                    <View key={index}>
                      <Text style={styles.orderText}>
                        Cake: {item.cake?.name || "Unknown"}
                      </Text>
                      <Text style={styles.orderText}>
                        Quantity: {item.quantity}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.orderText}>
                    Total: ${order.totalPrice}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f3ea" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#ddd",
  },
  activeFilter: {
    backgroundColor: "#6b4226",
  },
  filterText: {
    color: "#fff",
    fontWeight: "bold",
  },
  scrollViewContent: {
    paddingBottom: 120, // מוסיף ריווח לכפתור התחתון
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  orderText: { fontSize: 16, color: "#6b4226" },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderDetails: {
    marginTop: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  Pending: { color: "#FFA500" },
  Completed: { color: "#28a745" },
  Cancelled: { color: "#d9534f" },
  emptyMessage: {
    fontSize: 18,
    color: "#6b4226",
    textAlign: "center",
    marginTop: 20,
  },
});
