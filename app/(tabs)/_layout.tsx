import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: "white",
          },
          default: {
            backgroundColor: "white",
          },
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
            <Icon name="list" size={24} color={color} />
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
