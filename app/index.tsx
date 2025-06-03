import React, { useState, useEffect } from "react";
import { Buffer } from "buffer";

// Utility to decode JWT payload without external library
function decodeJwt(token: string): any {
  const payload = token.split(".")[1];
  const decoded = Buffer.from(payload, "base64").toString("utf-8");
  return JSON.parse(decoded);
}
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google"; // Import the Google auth hook
import styles from "./styles/LoginStyles";
import config from "../config";
import { FontAwesome } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [tempTokens, setTempTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  const [tempUserData, setTempUserData] = useState<{
    userID: string;
    role: string;
  } | null>(null);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

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

  // פונקציה לאתחול האפליקציה: בודקת התחברות, מוודאת טעינת role, ומבצעת ניווט בטוח
  const initializeApp = async () => {
    let accessToken = await AsyncStorage.getItem("accessToken");
    const role = await AsyncStorage.getItem("role");

    if (accessToken) {
      try {
        const decoded = decodeJwt(accessToken);
        // Always update userId in storage from token
        if (decoded.userId) {
          await AsyncStorage.setItem("userId", decoded.userId);
        }
        // בדיקה אם הטוקן פג תוקף
        if (decoded.exp * 1000 < Date.now()) {
          console.log("🔄 Token expired, refreshing...");
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            console.log("⚠️ Token refresh failed, but user is still logged in");
            return;
          }
          accessToken = await AsyncStorage.getItem("accessToken");
        }
      } catch (error) {
        console.log("⚠️ Error during token validation, but user is still logged in:", error);
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          console.log("⚠️ Token refresh failed, but user is still logged in");
          return;
        }
        accessToken = await AsyncStorage.getItem("accessToken");
      }
    } else {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        console.log("⚠️ No access token found and refresh failed");
        return;
      }
    }

    // Only navigate if both accessToken and role exist
    const finalAccessToken = await AsyncStorage.getItem("accessToken");
    const finalRole = await AsyncStorage.getItem("role");
    if (finalAccessToken && finalRole) {
      console.log("🔄 User is logged in, navigating...");
      if (finalRole === "admin") {
        router.replace("/(admintabs)/AdminDashboardScreen");
      } else {
        router.replace("/(tabs)/DashboardScreen");
      }
    }
  };

  // נריץ את אתחול האפליקציה פעם אחת כשהמסך נטען
  useEffect(() => {
    initializeApp();
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
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();
      console.log("🔹 Server response:", data);

      if (response.ok) {
        // Check if the response has the expected structure
        if (
          !data.tokens ||
          !data.tokens.accessToken ||
          !data.tokens.refreshToken
        ) {
          throw new Error("Invalid response format from server");
        }

        if (data.requires2FA && data.role !== "admin") {
          // Store temporary tokens and user data
          setTempTokens(data.tokens);
          setTempUserData({
            userID: data.userId || "",
            role: data.role || "user",
          });
          setShow2FAModal(true);
        } else {
          // No 2FA required, proceed with normal login
          await completeLogin(
            data.tokens,
            data.userId || "",
            data.role || "user"
          );
        }
      } else {
        console.warn("⚠️ Login failed:", data?.error || "Unknown error");
        Alert.alert("Error", data?.error || "Login failed");
      }
    } catch (error) {
      console.error("❌ Error during login process:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.BASE_URL}/auth/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempTokens?.accessToken}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // 2FA verification successful, complete login
        if (tempTokens && tempUserData) {
          await completeLogin(
            tempTokens,
            tempUserData.userID,
            tempUserData.role
          );
        }
      } else {
        Alert.alert("Error", data?.error || "Invalid verification code");
      }
    } catch (error) {
      console.error("❌ Error during 2FA verification:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (
    tokens: { accessToken: string; refreshToken: string },
    userID: string,
    role: string
  ) => {
    await AsyncStorage.setItem("accessToken", tokens.accessToken);
    await AsyncStorage.setItem("refreshToken", tokens.refreshToken);
    await AsyncStorage.setItem("userId", userID);
    await AsyncStorage.setItem("role", role);

    Alert.alert("Success", "Logged in successfully!");
    setShow2FAModal(false);
    setVerificationCode("");
    setTempTokens(null);
    setTempUserData(null);

    if (role === "admin") {
      router.replace("/(admintabs)/AdminDashboardScreen");
    } else {
      router.replace("/(tabs)/DashboardScreen");
    }
  };

  // פונקציה להתחברות עם גוגל
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Platform.select({
      ios: config.googleClientIdIos, // ה-Client ID שלך עבור iOS
      android: config.googleClientIdAndroid, // ה-Client ID שלך עבור אנדרואיד
      web: config.googleClientIdWeb, // ה-Client ID שלך עבור Web
    }),
    redirectUri: Platform.select({
      ios: "com.avielandbar.cakebusinessapp:/oauth2redirect",
      android: "exp://localhost:8081",
      web: "http://localhost:8081",
    }),
    scopes: ["profile", "email"],
  });

  // Add a safe method to handle Google authentication
  const handleGoogleAuth = async () => {
    // Prevent multiple auth sessions
    if (isAuthInProgress) {
      console.log("Auth already in progress, skipping...");
      return;
    }

    try {
      // Set auth in progress flag
      setIsAuthInProgress(true);

      // Clear keyboard and any existing auth sessions
      Keyboard.dismiss();

      // Add a small delay to ensure any existing auth context is cleared
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Start Google auth
      await promptAsync();
    } catch (error) {
      console.error("Google auth error:", error);
      Alert.alert(
        "Error",
        "Failed to start Google authentication. Please try again."
      );
    } finally {
      // Reset auth flag after a delay
      setTimeout(() => setIsAuthInProgress(false), 1000);
    }
  };

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      console.log("🔹 Google login success, token:", id_token);

      fetch(`${config.BASE_URL}/auth/google/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Google login failed with status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("🔹 Google login server response:", data);

          if (
            (data.accessToken && data.refreshToken) ||
            (data.tokens?.accessToken && data.tokens?.refreshToken)
          ) {
            const accessToken = data.accessToken || data.tokens.accessToken;
            const refreshToken = data.refreshToken || data.tokens.refreshToken;
            if (data.requires2FA && data.role !== "admin") {
              // 2FA for non-admin
              setTempTokens({
                accessToken,
                refreshToken,
              });
              setTempUserData({
                userID: data.userId || "",
                role: data.role || "user",
              });
              setShow2FAModal(true);
            } else {
              // Normal login
              AsyncStorage.setItem("accessToken", accessToken);
              AsyncStorage.setItem("refreshToken", refreshToken);
              AsyncStorage.setItem("userId", data.userId || "");
              AsyncStorage.setItem("role", data.role || "user");

              if (data.role === "admin") {
                router.replace("/(admintabs)/AdminDashboardScreen");
              } else {
                router.replace("/(tabs)/DashboardScreen");
              }
            }
          } else {
            throw new Error("Missing tokens in response");
          }
        })
        .catch((error) => {
          console.error("❌ Google login error:", error);
          Alert.alert("Error", "Google login failed. Please try again.");
        });
    }
  }, [response]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require("../assets/bg-login.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#000"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                textContentType="username"
                autoComplete="email"
              />
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#000"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                textContentType="password"
                autoComplete="password"
                onSubmitEditing={handleLogin}
              />

              <View
                style={{
                  width: "90%",
                  alignItems: "flex-end",
                  marginBottom: 50,
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push("/ForgotPasswordScreen")}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

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

              {/* Google Sign In Button */}
              <Text
                style={{
                  color: "#5d3a1a",
                  marginTop: 12,
                  marginBottom: 16,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                or
              </Text>
              <TouchableOpacity
                onPress={handleGoogleAuth}
                onPressIn={() => {
                  Keyboard.dismiss();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 30,
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  marginBottom: 20,
                }}
              >
                <FontAwesome
                  name="google"
                  size={22}
                  color="#DB4437"
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{ fontSize: 16, color: "#3c4043", fontWeight: "500" }}
                >
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  Don&apos;t have an account?{" "}
                  <Text
                    style={styles.signupLink}
                    onPress={() => router.push("/SignUpScreen")}
                  >
                    Sign Up here
                  </Text>
                </Text>
              </View>
            </View>

            {/* 2FA Verification Modal */}
            <Modal
              visible={show2FAModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => {
                setShow2FAModal(false);
                setVerificationCode("");
                setTempTokens(null);
                setTempUserData(null);
              }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    Two-Factor Authentication
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Please enter the 6-digit verification code sent to your
                    email
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Verification Code"
                    placeholderTextColor="#000"
                    keyboardType="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handle2FAVerification}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setShow2FAModal(false);
                      setVerificationCode("");
                      setTempTokens(null);
                      setTempUserData(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
