import React, { useState, useEffect } from "react";
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
// שימוש בייבוא require אם אין esModuleInterop
const { default: jwtDecode } = require("jwt-decode");
import styles from "./styles/LoginStyles";
import config from "../config";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // פונקציה לרענון ה-Access Token
  const refreshAccessToken = async () => {
    try {
      console.log("🔄 Refreshing access token...");
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.warn("⚠️ No refresh token found, redirecting to login...");
        return false;
      }

      const response = await fetch(`${config.BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Token refreshed successfully!");
        await AsyncStorage.setItem("accessToken", data.accessToken);
        return true;
      } else {
        console.warn("⚠️ Refresh token expired, user must log in again.");
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        return false;
      }
    } catch (error) {
      console.error("❌ Error refreshing token:", error);
      return false;
    }
  };

  // פונקציה לבדיקה אוטומטית של התחברות
  const checkLoginStatus = async () => {
    let accessToken = await AsyncStorage.getItem("accessToken");
    const role = await AsyncStorage.getItem("role");

    if (accessToken) {
      try {
        const decoded = jwtDecode(accessToken);
        // בדיקה אם הטוקן פג תוקף
        if (decoded.exp * 1000 < Date.now()) {
          console.log("🔄 Token expired, refreshing...");
          const refreshed = await refreshAccessToken();
          if (!refreshed) return;
          accessToken = await AsyncStorage.getItem("accessToken");
        }
      } catch (error) {
        console.error("❌ Error decoding token:", error);
        const refreshed = await refreshAccessToken();
        if (!refreshed) return;
        accessToken = await AsyncStorage.getItem("accessToken");
      }
    } else {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return;
    }

    console.log("🔄 User is logged in, navigating...");
    if (role === "admin") {
      router.replace("/(admintabs)/AdminDashboardScreen");
    } else {
      router.replace("/(tabs)/DashboardScreen");
    }
  };

  // נריץ את הבדיקה פעם אחת כשהמסך נטען
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // פונקציה להתחברות
  const handleLogin = async () => {
    console.log("🔄 Login process started");

    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
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
        const userid = data.userID || "null";

        await AsyncStorage.setItem("userID", userid);

        const role = data.role || "user";
        await AsyncStorage.setItem("role", role);
        console.log("🗂 Tokens & role saved successfully:", role);

        Alert.alert("Success", "Logged in successfully!");

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Manage your cake business with ease</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#000"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#000"
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

      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={() => router.push("/ForgotPasswordScreen")}
      >
        <Text style={styles.signupLink}>Forgot Password?</Text>
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
