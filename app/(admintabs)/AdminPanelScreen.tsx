import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { fetchUserData } from "../utils/fetchUserData";

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

      if (!refreshToken) {
        Alert.alert("Error", "No refresh token found");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        await AsyncStorage.removeItem("role");

        Alert.alert("Success", "Logged out successfully");
        router.replace("/");
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b4226" />
        <Text style={styles.loadingText}>Loading Admin Panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* תמונת פרופיל ושם משתמש */}
      <Image
        source={
          user.profilePic
            ? { uri: user.profilePic }
            : require("../../assets/images/userIcon.png")
        }
        style={styles.profileImage}
      />
      <Text style={styles.userName}>{user.name}</Text>

      <Text style={styles.title}>Admin Panel</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/adminOrdersScreen")}
      >
        <Text style={styles.buttonText}>Manage Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/InventoryScreen")}
      >
        <Text style={styles.buttonText}>Manage Inventory</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/StatisticsScreen")}
      >
        <Text style={styles.buttonText}>View Statistics</Text>
      </TouchableOpacity>

      {/* כפתור התנתקות */}
      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    color: "#6b4226",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#6b4226",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#b22222", // אדום להתנתקות
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#888",
  },
});
