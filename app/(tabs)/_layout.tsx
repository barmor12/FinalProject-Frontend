import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import config from "@/config";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ פונקציה להבאת תפקיד המשתמש מה-AsyncStorage
  const fetchRole = async () => {
    try {
      const storedRole = await AsyncStorage.getItem("role");
      setRole(storedRole || "user");
      console.log("🔹 User role loaded:", storedRole);
    } catch (error) {
      console.error("⚠️ Error fetching role:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ פונקציה להבאת מספר המוצרים בעגלה מהשרת
  const fetchCartItems = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

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
      await AsyncStorage.setItem("cartItemCount", totalItems.toString()); // ✅ שמירה ב-AsyncStorage
    } catch (error) {
      console.error("⚠️ Error fetching cart items:", error);
    }
  };

  useEffect(() => {
    fetchRole();
    fetchCartItems();

    // ✅ מאזין לשינויים ומעדכן כל 2 שניות
    const interval = setInterval(fetchCartItems, 2000);
    return () => clearInterval(interval);
  }, []);

  // ✅ מאזין למעבר לטאב ומרענן את מספר הפריטים
  useFocusEffect(
    React.useCallback(() => {
      fetchCartItems();
    }, [])
  );

  if (loading) return null; // מחכה לטעינת הנתונים

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

// ✅ סגנון מתוקן ללא שגיאות TypeScript
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
    fontWeight: "bold", // ✅ החלפת "700" ל-"bold"
  },
});
