import React, { useState, useEffect } from "react";
import { Buffer } from "buffer";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';


import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ImageBackground,
  ScrollView,
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
  const [isInitializing, setIsInitializing] = useState(true);

  // Utility to decode JWT payload without external library
  function decodeJwt(token: string): any {
    const payload = token.split(".")[1];
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded);
  }

  // Register for push notifications and send token to backend
  async function registerForPushNotificationsAsync(accessToken: string) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('📵 Notification permission not granted');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'fbc9882c-5a50-4890-ac90-04995b12cff7',
      });

      const pushToken = tokenData.data;

      console.log('📱 Expo Push Token:', pushToken);

      await fetch(`${config.BASE_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: pushToken }),
      });
    } catch (error) {
      console.error('❌ Error registering push token:', error);
    }
  }
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


  const initializeApp = async () => {
    try {
      let accessToken = await AsyncStorage.getItem("accessToken");

      if (accessToken) {
        try {
          const decoded = decodeJwt(accessToken);
          // Always update userId in storage from token
          if (decoded.userId) {
            await AsyncStorage.setItem("userId", decoded.userId);
          }

          if (decoded.exp * 1000 < Date.now()) {
            console.log("🔄 Token expired, refreshing...");
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
              console.log(
                "⚠️ Token refresh failed, but user is still logged in"
              );
              return;
            }
            accessToken = await AsyncStorage.getItem("accessToken");
          }
        } catch (error) {
          console.log(
            "⚠️ Error during token validation, but user is still logged in:",
            error
          );
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            console.log(
              "⚠️ Token refresh failed, but user is still logged in"
            );
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

      // Always fetch user data from server to get isPasswordSet
      const finalAccessToken = await AsyncStorage.getItem("accessToken");
      if (finalAccessToken) {
        try {
          const response = await fetch(`${config.BASE_URL}/auth/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${finalAccessToken}`,
            },
          });
          const data = await response.json();
          if (response.ok) {
            // Store userId/role again if needed
            if (data.userId) await AsyncStorage.setItem("userId", data.userId);
            if (data.role) await AsyncStorage.setItem("role", data.role);
            // Main logic: redirect based on isPasswordSet
            if (!data.isPasswordSet) {
              router.replace("/SetPasswordScreen");
            } else if (data.role === "admin") {
              router.replace("/(admintabs)/AdminDashboardScreen");
            } else {
              router.replace("/(tabs)/DashboardScreen");
            }
          } else {
            // If error, fallback to login
            await AsyncStorage.multiRemove([
              "accessToken",
              "refreshToken",
              "userId",
              "role",
            ]);
          }
        } catch (err) {
          // On error, fallback to login
          await AsyncStorage.multiRemove([
            "accessToken",
            "refreshToken",
            "userId",
            "role",
          ]);
        }
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // נריץ את אתחול האפליקציה פעם אחת כשהמסך נטען
  useEffect(() => {
    initializeApp();
  }, []);


  // login handler
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${config.BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data?.error || "Login failed");
      } else if (data.requires2FA) {
        setTempTokens(data.tokens);
        setTempUserData({ userID: data.userId, role: data.role });
        setShow2FAModal(true);
      } else {
        await AsyncStorage.setItem("accessToken", data.tokens.accessToken);
        await AsyncStorage.setItem("refreshToken", data.tokens.refreshToken);
        await AsyncStorage.setItem("userId", data.userId);
        await AsyncStorage.setItem("role", data.role);
        Alert.alert("Success", "Logged in successfully!");
        router.replace(data.role === "admin" ? "/(admintabs)/AdminDashboardScreen" : "/(tabs)/DashboardScreen");
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong.");
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
    await registerForPushNotificationsAsync(tokens.accessToken);

    Alert.alert("Success", "Logged in successfully!");
    setShow2FAModal(false);
    setVerificationCode("");
    setTempTokens(null);
    setTempUserData(null);

    // Check if user needs to set password
    try {
      const meRes = await fetch(`${config.BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      const meData = await meRes.json();
      if (meRes.ok) {
        if (!meData.isPasswordSet) {
          router.replace("/SetPasswordScreen");
        } else if (role === "admin") {
          router.replace("/(admintabs)/AdminDashboardScreen");
        } else {
          router.replace("/(tabs)/DashboardScreen");
        }
      } else {
        console.warn("Failed to fetch user status from /auth/me", meData);
        // Fallback to role-based navigation
        if (role === "admin") {
          router.replace("/(admintabs)/AdminDashboardScreen");
        } else {
          router.replace("/(tabs)/DashboardScreen");
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Fallback to role-based navigation
      if (role === "admin") {
        router.replace("/(admintabs)/AdminDashboardScreen");
      } else {
        router.replace("/(tabs)/DashboardScreen");
      }
    }
  };

  // פונקציה להתחברות עם גוגל
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: Platform.select({
      ios: config.googleClientIdIos, // ה-Client ID שלך עבור iOS
      android: config.googleClientIdAndroid, // ה-Client ID שלך עבור אנדרואיד
      web: config.googleClientIdWeb, // ה-Client ID שלך עבור Web
    }),
    redirectUri: Platform.select({
      ios: "com.avielandbar.cakebusinessapp:/oauth2redirect",
      android: "com.avielandbar.cakebusinessapp:/oauth2redirect",
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
        .then(async (data) => {
          const accessToken = data.accessToken || data.tokens?.accessToken;
          const refreshToken = data.refreshToken || data.tokens?.refreshToken;
          if (accessToken && refreshToken) {
            if (data.requires2FA) {
              setTempTokens({ accessToken, refreshToken });
              setTempUserData({
                userID: data.userId || "",
                role: data.role || "user",
              });
              setShow2FAModal(true);
            } else {
              await AsyncStorage.setItem("accessToken", accessToken);
              await AsyncStorage.setItem("refreshToken", refreshToken);
              await AsyncStorage.setItem("userId", data.userId || "");
              await AsyncStorage.setItem("role", data.role || "user");
              await registerForPushNotificationsAsync(accessToken);

              try {
                const meRes = await fetch(`${config.BASE_URL}/auth/me`, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                });

                const meData = await meRes.json();
                if (meRes.ok) {
                  if (!meData.isPasswordSet) {
                    router.replace("/SetPasswordScreen");
                  } else if (meData.role === "admin") {
                    router.replace("/(admintabs)/AdminDashboardScreen");
                  } else {
                    router.replace("/(tabs)/DashboardScreen");
                  }
                } else {
                  console.warn(
                    "Failed to fetch user status from /auth/me",
                    meData
                  );
                  Alert.alert("Error", "Failed to verify user status.");
                }
              } catch (err) {
                console.error("Error fetching user profile:", err);
                Alert.alert(
                  "Error",
                  "Something went wrong while checking user status."
                );
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

  // Keyboard visibility state and effect
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const renderLoginContent = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.backgroundOverlay} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={keyboardVisible}
        >
          <ImageBackground
            source={require("../assets/bg-login.jpg")}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <View style={{ flex: 1, justifyContent: "center" }}>
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
                    testID="emailInput"
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
                    testID="passwordInput"
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
                    testID="loginButton"
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
                    testID="googleLoginButton"
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
            </View>
          </ImageBackground>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  return isInitializing ? (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f7f1e7",
      }}
    >
      <ActivityIndicator size="large" color="#6b4226" />
    </View>
  ) : (
    renderLoginContent()
  );
}

