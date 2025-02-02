import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("role");
        setRole(storedRole || "user"); // ברירת מחדל למשתמש רגיל
        console.log("🔹 User role loaded:", storedRole);
      } catch (error) {
        console.error("⚠️ Error fetching role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  if (loading) return null; // ממתין לטעינת ה-role

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: Platform.select({
          ios: { position: "absolute", backgroundColor: "white" },
          default: { backgroundColor: "white" },
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
            <Icon name="shopping-cart" size={24} color={color} />
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
