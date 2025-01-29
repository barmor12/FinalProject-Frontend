import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { fetchUserData } from "../utils/fetchUserData";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    profilePic: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDataAndSetState = async () => {
      try {
        // קריאה ל-Backend כדי להביא נתוני משתמש
        const userData = await fetchUserData();
        console.log("Fetched user data:", userData); // הדפס את הנתונים המתקבלים

        // עדכון המשתמש במידע מהשרת
        if (userData) {
          setUser({
            name: `Hi ${userData.firstName}` || "Guest",
            profilePic:
              userData.profilePic || require("../../assets/images/userIcon.png"), // תמונת ברירת מחדל אם אין תמונת פרופיל
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false); // עדכון מצב ה-loading כאשר הקריאה הושלמה
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
        // מחיקת הטוקנים
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");

        Alert.alert("Success", "You have been logged out successfully");
        router.push("/");
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleEditProfile = () => {
    router.push("/EditProfileScreen");
  };
  const handleSecACC = () => {
    router.push("/AccountSecurityScreen");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d49a6a" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={
          user.profilePic
            ? { uri: user.profilePic }
            : require("../../assets/images/userIcon.png")
        }
        style={styles.profileImage}
      />
      <Text style={styles.userName}>{user.name || "User"}</Text>
      <Text style={styles.title}>Profile</Text>

      <TouchableOpacity style={styles.button} onPress={() => ""}>
        <Text style={styles.buttonText}>My Orders</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSecACC}>
        <Text style={styles.buttonText}>Account Security</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
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
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  userName: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  title: { fontSize: 18, color: "#888", marginBottom: 20 },
  button: {
    backgroundColor: "#d49a6a",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
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
