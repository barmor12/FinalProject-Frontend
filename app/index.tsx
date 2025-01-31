import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles/LoginStyles";
import config from "../config";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log("🔄 Login process started");

    try {
      console.log("📡 Sending request to server...");
      const response = await fetch(`${config.BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("🔹 Server response:", data);

      if (response.ok) {
        console.log("✅ Login successful, saving tokens...");

        await AsyncStorage.setItem("accessToken", data.tokens.accessToken);
        await AsyncStorage.setItem("refreshToken", data.tokens.refreshToken);

        // ✅ שמירת התפקיד של המשתמש
        const role = data.role || "user";
        await AsyncStorage.setItem("role", role);
        console.log("🗂 Tokens & role saved successfully:", role);

        Alert.alert("Success", "Logged in successfully!");

        // ✅ ניווט בהתאם ל-role
        if (role === "admin") {
          router.replace("/(admintabs)/AdminDashboardScreen");
        } else {
          router.replace("/(tabs)/DashboardScreen");
        }
      } else {
        console.warn("⚠️ Login failed:", data?.error || "Unknown error");
        Alert.alert("Error", data?.error || "Login failed");
      }
    } catch (error) {
      console.error("❌ Error during login process:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Manage your cake business with ease</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
          }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don’t have an account?{" "}
        <Text
          style={styles.signupLink}
          onPress={() => router.push("/SignUpScreen")}
        >
          Sign Up here
        </Text>
      </Text>
    </View>
  );
}
