import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function AdminTabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("role");
        setRole(storedRole || "admin");
        console.log("🔹 Admin User role loaded:", storedRole);
      } catch (error) {
        console.error("⚠️ Error fetching role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  if (loading) return null;
  if (role !== "admin") return null;

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
        name="AdminDashboardScreen"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Icon name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="InventoryScreen"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color }) => (
            <Icon name="inventory" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="StatisticsScreen"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color }) => (
            <Icon name="bar-chart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AdminPanelScreen"
        options={{
          title: "Admin Panel",
          tabBarIcon: ({ color }) => (
            <Icon name="admin-panel-settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};