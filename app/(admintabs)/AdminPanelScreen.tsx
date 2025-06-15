import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { fetchUserData } from "../utils/fetchUserData";
import styles from "../styles/AdminScreensStyles/AdminPanelScreenStyles";
import { MaterialIcons } from "@expo/vector-icons";

export default function AdminPanelScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    profilePic: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDataAndSetState = async () => {
      try {
        // טעינת נתוני משתמש מהשרת
        const userData = await fetchUserData();
        console.log("Fetched user data:", userData);

        if (userData) {
          setUser({
            name: `Hi Admin ${userData.firstName}` || "Admin",
            profilePic:
              userData.profilePic ||
              require("../../assets/images/userIcon.png"), // תמונת ברירת מחדל לאדמין
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndSetState();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const accessToken = await AsyncStorage.getItem("accessToken");

      console.log("🧾 refreshToken:", refreshToken);
      console.log("🧾 accessToken:", accessToken);

      if (!refreshToken) {
        console.warn("⚠️ No refresh token found in AsyncStorage");
        Alert.alert("Error", "No refresh token found");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // הוסף את זה אם אתה משתמש ב־auth header בצד השרת
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      console.log("📡 Logout response status:", response.status);

      const data = await response.json();
      console.log("📡 Logout response body:", data);

      if (response.ok) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        await AsyncStorage.removeItem("role");

        Alert.alert("Success", "Logged out successfully");
        router.replace("/");
      } else {
        Alert.alert("Error", data.message || "Failed to logout");
      }
    } catch (error) {
      console.error("❌ Logout error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.profileImagePlaceholder} />
          <View style={styles.userNamePlaceholder} />
          <View style={styles.titlePlaceholder} />
          <ActivityIndicator
            size="large"
            color="#6b4226"
            style={styles.loader}
          />
          <Text style={styles.loadingText}>Loading Admin Panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Admin Icon */}
          <Image
            source={require("../../assets/images/adminIcon.png")}
            style={styles.adminIcon}
          />

          <Text style={styles.userName}>{user.name}</Text>

          <Text style={styles.title}>Admin Panel</Text>

          <TouchableOpacity
            style={[styles.button]}
            onPress={() => router.push("/adminScreens/adminOrdersScreen")}
          >
            <MaterialIcons name="list-alt" size={20} color="#fff" />
            <Text style={styles.buttonText}>Manage Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button]}
            onPress={() =>
              router.push("/adminScreens/adminDiscountCodesScreen")
            }
          >
            <MaterialIcons name="discount" size={20} color="#fff" />
            <Text style={styles.buttonText}>Manage Discount Codes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button]}
            onPress={() => router.push("/adminScreens/manageUsersScreen")}
          >
            <MaterialIcons name="people" size={20} color="#fff" />
            <Text style={styles.buttonText}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button]}
            onPress={() => router.push("/adminScreens/AdminRecipesScreen")}
          >
            <MaterialIcons name="restaurant-menu" size={20} color="#fff" />
            <Text style={styles.buttonText}>Manage Recipes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button]}
            onPress={() =>
              router.push("/adminScreens/AdminNotificationsScreen")
            }
          >
            <MaterialIcons name="notifications" size={20} color="#fff" />
            <Text style={styles.buttonText}>Send Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
