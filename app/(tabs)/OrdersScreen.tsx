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
  Alert
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

  // **שליפת הזמנות מהשרת**
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("accessToken");
      const userID = await AsyncStorage.getItem("userID");

      if (!token || !userID) {
        console.error("[ERROR] Missing access token or user ID.");
        return;
      }

      const response = await axios.get(`${config.BASE_URL}/order/user/${userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("[DEBUG] Fetched items (expanded):", JSON.stringify(response.data, null, 2));

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
      const filtered = orders.filter(
        (order) => order.status.toLowerCase() === status.toLowerCase()
      );
      setFilteredOrders(filtered);
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      // יצירת מערך פריטים להוספה לעגלה
      const itemsToAdd = order.items.map((item) => ({
        cakeId: item.cake._id,
        quantity: item.quantity,
      }));

      // קריאה ל־API להוספת כל הפריטים לעגלה בבת אחת
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

      // מעבר לעמוד הקופה
      router.push("/CartScreen");
    } catch (error: any) {
      console.error("Error in reorder:", error.message);
      Alert.alert("Error", "Failed to reorder, please try again.");
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Orders</Text>

      {/* כפתורי סינון סטטוס בתוך גלילה אופקית */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              selectedFilter === status ||
                (status === "all" && !selectedFilter) ? styles.activeFilter : null,
            ]}
            onPress={() => filterOrders(status === "all" ? null : status)}
          >
            <Text style={styles.filterText}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
                        <Text style={{ color: "#999" }}>No image available</Text>
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
                {/* כפתור להזמנה מחדש */}
                <TouchableOpacity style={styles.reorderButton} onPress={() => handleReorder(order)}>
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
    height: 45, // קובע גובה קבוע לכפתור
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#ddd",
    marginRight: 10,
    flexShrink: 0,
    minWidth: 90,
    justifyContent: "center", // ממרכז אנכית את תוכן הכפתור
    alignItems: "center",      // ממרכז אופקית את התוכן
    marginBottom: 10
  },
  filterText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    lineHeight: 45, // מקביל לגובה הכפתור, כך שהטקסט יתמרכז
    textAlign: "center",
    textAlignVertical: "center", // עוזר בהמרת הטקסט גם באנדרואיד
    includeFontPadding: false,  // יכול לעזור במקרים מסוימים
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
