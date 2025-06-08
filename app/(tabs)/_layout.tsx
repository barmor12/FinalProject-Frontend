import * as Notifications from "expo-notifications";
/**
 * Defines the notification handler (determines how each notification is displayed).
 */
export function registerNotifications() {
  // Already set the handler in the top-level configuration
}
import { Subscription } from "expo-notifications";
import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import config from "../../config";
import {
  registerPushToken,
  scheduleTestNotification,
  setupNotificationListeners,
} from "../utils/notifications";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch user role from AsyncStorage
  const fetchRole = async () => {
    try {
      const storedRole = await AsyncStorage.getItem("role");
      console.log("📌 Retrieved role from AsyncStorage:", storedRole);
      setRole(storedRole || "user");
      console.log("User role loaded:", storedRole);
    } catch (error) {
      console.error("Error fetching role:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart item count from backend
  const fetchCartItems = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        return;
      }

      const response = await fetch(`${config.BASE_URL}/cart`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cart data");
      }

      const data = await response.json();
      const totalItems = data.items.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0
      );

      setCartItemCount(totalItems);
      await AsyncStorage.setItem("cartItemCount", totalItems.toString());
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  useEffect(() => {
    fetchRole();
    fetchCartItems();

    // Poll cart item count every 2 seconds
    const interval = setInterval(fetchCartItems, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    registerNotifications();

    const setup = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        console.log("📲 Registering push token");
        await registerPushToken();
      } else {
        console.warn(
          "⚠️ No access token found, skipping push token registration"
        );
      }
    };

    setup();

    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  // Refresh cart item count when tab gains focus
  useFocusEffect(
    React.useCallback(() => {
      fetchCartItems();
    }, [])
  );

  if (loading) return null; // Wait for initial data load

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: Platform.select({
          ios: { position: "absolute", backgroundColor: "white", height: 75 },
          default: { backgroundColor: "white", height: 75 },
        }),
      }}
    >
      <Tabs.Screen
        name="DashboardScreen"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="OrdersScreen"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <Icon name="list-alt" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CartScreen"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => (
            <View>
              <Icon name="shopping-cart" size={24} color={color} />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="RecipeScreen"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => (
            <Icon name="menu-book" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Icon name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cartBadge: {
    position: "absolute",
    right: -8,
    top: -5,
    backgroundColor: "red",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
