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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.profileImagePlaceholder} />
          <View style={styles.userNamePlaceholder} />
          <View style={styles.titlePlaceholder} />
          <ActivityIndicator size="large" color="#6b4226" style={styles.loader} />
          <Text style={styles.loadingText}>Loading Admin Panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
          onPress={() => router.push("/adminDiscountCodesScreen")}
        >
          <Text style={styles.buttonText}>Manage Discount Codes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/manageUsersScreen")}
        >
          <Text style={styles.buttonText}>Manage Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/AdminRecipesScreen")}
        >
          <Text style={styles.buttonText}>Manage Recipes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/AdminNotificationsScreen")}
        >
          <Text style={styles.buttonText}>Send Notifications</Text>
        </TouchableOpacity>

        {/* כפתור התנתקות */}
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f3ea",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea",
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  userNamePlaceholder: {
    width: 150,
    height: 22,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 5,
  },
  titlePlaceholder: {
    width: 120,
    height: 18,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b4226",
  },
});
