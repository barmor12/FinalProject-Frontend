import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

export default function ProfileScreen() {
  const router = useRouter();

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

      const data = await response.json();

      if (response.ok) {
        // Remove tokens from AsyncStorage
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");

        Alert.alert("Success", "You have been logged out successfully");
        router.push("/"); // Navigate back to login screen
      } else {
        Alert.alert("Error", data.message || "Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
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
