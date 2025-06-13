import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Button,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles/userDetailsScreenStyles";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Order {
  _id: string;
  totalPrice: number;
  createdAt: string;
  status: string;
}

export default function UserDetailsScreen() {
  const { userId } = useLocalSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchUserDetails();
    fetchUserOrders();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoadingUser(true);
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${config.BASE_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("❌ Error loading user:", err);
      alert("Failed to load user");
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${config.BASE_URL}/order/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error("❌ Error loading orders:", err);
      alert("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${config.BASE_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      const updatedUser = await res.json();
      setUser(updatedUser);
      alert(`Role updated to ${newRole}`);
      // Navigate back and signal refresh
      router.push({
        pathname: "/adminScreens/manageUsersScreen",
        params: { shouldRefresh: "true" },
      });
    } catch (err) {
      console.error("❌ Failed to update role:", err);
      alert("Error updating role");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return styles.pending;
      case "confirmed":
        return styles.confirmed;
      case "delivered":
        return styles.delivered;
      case "cancelled":
        return styles.cancelled;
      default:
        return {};
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>👤 User Details</Text>

        {loadingUser ? (
          <ActivityIndicator size="large" color="#6b4226" />
        ) : user ? (
          <View style={styles.card}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {user.firstName} {user.lastName}
            </Text>

            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user.email}</Text>

            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{user.role}</Text>

            <Text style={styles.label}>Joined:</Text>
            <Text style={styles.value}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>

            <View style={styles.updateStatusButton}>
              <Text
                style={styles.updateStatusText}
                onPress={() =>
                  handleUpdateRole(user.role === "admin" ? "user" : "admin")
                }
              >
                Change Role to {user.role === "admin" ? "User" : "Admin"}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>User not found</Text>
        )}

        <Text style={styles.sectionTitle}>📦 Orders</Text>

        {loadingOrders ? (
          <ActivityIndicator size="small" color="#6b4226" />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <Text style={styles.orderText}>Order ID: {item._id}</Text>
                <Text style={styles.orderText}>Total: ${item.totalPrice}</Text>
                <Text style={styles.orderText}>
                  Date: {new Date(item.createdAt).toLocaleString()}
                </Text>
                <Text
                  style={[
                    styles.orderText,
                    styles.status,
                    getStatusStyle(item.status),
                  ]}
                >
                  Status: {item.status}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.noOrders}>No orders found</Text>
            }
            contentContainerStyle={{ paddingBottom: 30 }}
            scrollEnabled={false} // כדי ש־ScrollView ימשיך לשלוט בגלילה
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


