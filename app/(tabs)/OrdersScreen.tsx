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
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { router } from "expo-router";
import styles from "../styles/OrdersScreenStyles";

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
  address?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
  };
  deliveryDate?: string;
  shippingMethod?: string;
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
      console.log(
        "Sample Order Object >>>",
        JSON.stringify(response.data[0], null, 2)
      );
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
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Your Orders</Text>
      </View>

      {/* Render horizontal filter buttons for order statuses */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {["all", "pending", "confirmed", "delivered", "cancelled"].map(
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
                  <Text style={styles.orderText}>
                    Order #{order._id.slice(-6)}
                  </Text>
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
                    <View key={index} style={styles.itemRow}>
                      {item.cake?.image?.url ? (
                        <Image
                          source={{ uri: item.cake.image.url }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ color: "#999" }}>No image</Text>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>
                          🍰 {item.cake?.name || "Unknown"}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          Quantity: {item.quantity}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>💰 Total:</Text>
                    <Text style={styles.infoValue}>
                      ${order.totalPrice.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>🚚 Shipping Method:</Text>
                    <Text style={styles.infoValue}>
                      {order.shippingMethod
                        ? order.shippingMethod
                        : order.address
                          ? "Standard Delivery (2-3 days)"
                          : "Self Pickup"}
                    </Text>
                  </View>

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>
                      📅 {order.address ? "Delivery Date:" : "Pickup Date:"}
                    </Text>
                    <Text style={styles.infoValue}>
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString()
                        : "Not set"}
                    </Text>
                  </View>

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>🏠 Delivery Address:</Text>
                    <Text style={styles.infoValue}>
                      {order.address
                        ? `${order.address.fullName}, ${order.address.street}, ${order.address.city}`
                        : "Pickup at store"}
                    </Text>
                    {order.address && (
                      <Text style={styles.infoValue}>
                        📞 {order.address.phone}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{ height: 10 }} />
                {/* Trigger reordering of selected order */}
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => handleReorder(order)}
                >
                  <Text style={styles.reorderButtonText}>Re-Order</Text>
                </TouchableOpacity>
                {/* Delete/Edit buttons for pending orders */}
                {order.status === "pending" && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.reorderButton,
                        { backgroundColor: "#d9534f", flex: 1, marginRight: 5 },
                      ]}
                      onPress={() => {
                        Alert.alert(
                          "Delete Order",
                          "Are you sure you want to delete this order?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  const token = await AsyncStorage.getItem(
                                    "accessToken"
                                  );
                                  const response = await fetch(
                                    `${config.BASE_URL}/order/delete/${order._id}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                    }
                                  );
                                  if (!response.ok)
                                    throw new Error("Failed to delete order");
                                  Alert.alert(
                                    "Deleted",
                                    "Order deleted successfully"
                                  );
                                  fetchOrders(); // רענון רשימת ההזמנות
                                } catch (error) {
                                  Alert.alert(
                                    "Error",
                                    "Failed to delete order."
                                  );
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.reorderButtonText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.reorderButton, { flex: 1, marginLeft: 5 }]}
                      onPress={() => {
                        router.push({
                          pathname: "/EditOrderScreen",
                          params: { orderId: order._id },
                        });
                      }}
                    >
                      <Text style={styles.reorderButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
