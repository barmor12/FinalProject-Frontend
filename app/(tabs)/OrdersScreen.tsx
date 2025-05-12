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
  Image,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { router } from "expo-router";

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
      image: {
        public_id: string;
        url: string;
      };
    };
    quantity: number;
  }>;
  totalPrice: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<null | string>(null);

  // Fetch user orders from the backend API
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("accessToken");
      const userId = await AsyncStorage.getItem("userId");
      console.log("userId", userId);
      console.log("token", token);
      if (!token || !userId) {
        Alert.alert("Error", "Missing access token or user ID.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(
        `${config.BASE_URL}/order/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(
        "[DEBUG] Fetched items (expanded):",
        JSON.stringify(response.data, null, 2)
      );

      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error("[ERROR] Failed to fetch orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Refresh the orders list when pulled down
  const onRefresh = useCallback(() => {
    fetchOrders();
  }, []);

  // Filter the orders list by selected status
  const filterOrders = (status: string | null) => {
    setSelectedFilter(status);
    if (!status) {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) => order.status.toLowerCase() === status.toLowerCase()
      );
      setFilteredOrders(filtered);
    }
  };

  // Duplicate a previous order and add items to the cart
  const handleReorder = async (order: Order) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      // Filter out items where the cake is null or undefined
      const validItems = order.items.filter(
        (item) => item.cake && item.cake._id
      );

      if (validItems.length === 0) {
        Alert.alert(
          "Cannot Reorder",
          "All products in this order are no longer available.",
          [{ text: "OK" }]
        );
        return;
      }

      // Create array of items to add to cart
      const itemsToAdd = validItems.map((item) => ({
        cakeId: item.cake._id,
        quantity: item.quantity,
      }));

      // Call API to add items to cart
      const response = await fetch(`${config.BASE_URL}/order/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsToAdd }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to add items to cart");
      }

      // Show success message with information about unavailable items
      if (validItems.length < order.items.length) {
        Alert.alert(
          "Partial Reorder",
          `${validItems.length} out of ${order.items.length} items were added to your cart. Some items are no longer available.`,
          [{ text: "OK", onPress: () => router.push("/CartScreen") }]
        );
      } else {
        // Navigate to cart screen
        router.push("/CartScreen");
      }
    } catch (error: any) {
      console.error("Error in reorder:", error.message);
      Alert.alert("Error", "Failed to reorder, please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Orders</Text>

      {/* Render horizontal filter buttons for order statuses */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {["all", "pending", "confirmed", "completed", "cancelled"].map(
          (status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedFilter === status ||
                (status === "all" && !selectedFilter)
                  ? styles.activeFilter
                  : null,
              ]}
              onPress={() => filterOrders(status === "all" ? null : status)}
            >
              <Text style={styles.filterText}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* Render the list of filtered orders */}
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
                  <Text
                    style={[
                      styles.statusText,
                      styles[order.status.toLowerCase()],
                    ]}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.orderDetails}>
                  {order.items.map((item, index) => (
                    <View key={index} style={styles.itemContainer}>
                      {item.cake?.image?.url ? (
                        <Image
                          source={{ uri: item.cake.image.url }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ color: "#999" }}>
                          No image available
                        </Text>
                      )}
                      <Text style={styles.orderText}>
                        🍰 {item.cake?.name || "Unknown"}
                      </Text>
                      <Text style={styles.orderText}>
                        🛒 Quantity: {item.quantity}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.totalPrice}>
                    💰 Total: ${order.totalPrice.toFixed(2)}
                  </Text>
                </View>
                {/* Trigger reordering of selected order */}
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => handleReorder(order)}
                >
                  <Text style={styles.reorderButtonText}>Re-Order</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles: { [key: string]: any } = StyleSheet.create({
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
  filterScroll: {
    marginBottom: 10,
  },
  filterButton: {
    height: 45,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#ddd",
    marginRight: 10,
    flexShrink: 0,
    minWidth: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  filterText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    lineHeight: 45,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  activeFilter: {
    backgroundColor: "#6b4226",
  },
  scrollViewContent: {
    paddingBottom: 120,
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
  pending: { color: "#FFA500" },
  confirmed: { color: "#0066cc" },
  completed: { color: "#28a745" },
  cancelled: { color: "#d9534f" },
  emptyMessage: {
    fontSize: 18,
    color: "#6b4226",
    textAlign: "center",
    marginTop: 20,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6b4226",
    marginTop: 10,
  },
  itemContainer: {
    marginBottom: 5,
  },
  itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  reorderButton: {
    backgroundColor: "#6b4226",
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  reorderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
