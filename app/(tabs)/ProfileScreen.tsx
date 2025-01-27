import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    profilePic: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          Alert.alert("Error", "No access token found");
          // router.push("/"); // Redirect to login if no token
          return;
        }

        const response = await fetch(`${config.BASE_URL}/user/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Pass token in Authorization header
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUser({
            name: data.name,
            profilePic: data.profilePic, // Assuming this field contains the image URL
          });
        } else {
          Alert.alert("Error", data.message || "Failed to fetch user profile");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        Alert.alert("Error", "Something went wrong");
      }
    };

    fetchUserProfile();
  }, []);
  const handleLogout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      console.log("[INFO] Refresh token from AsyncStorage:", refreshToken);

      if (!refreshToken) {
        Alert.alert("Error", "No refresh token found");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      console.log("[INFO] Logout response from server:", data);

      if (response.ok) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        Alert.alert("Success", "You have been logged out successfully");
        router.push("/");
      } else {
        Alert.alert("Error", data.message || "Failed to logout");
      }
    } catch (error) {
      console.error("[ERROR] Logout error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleEditProfile = () => {
    router.push("/EditProfileScreen");
  };

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
      <Text style={styles.userName}>{user.name || "Loading..."}</Text>
      <Text style={styles.title}>Profile</Text>

      <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
        <Text style={styles.buttonText}>Edit Profile</Text>
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
    backgroundColor: "#f9f9f9",
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
});
