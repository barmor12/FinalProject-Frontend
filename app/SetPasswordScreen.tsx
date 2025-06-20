import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import styles from "../app/styles/LoginStyles";

import config from "../config";
import { BlurView } from "expo-blur";
import BackButton from "../components/BackButton";

export default function SetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  type RequirementKey =
    | "length"
    | "lowercase"
    | "uppercase"
    | "number"
    | "special";

  const requirementList: { label: string; key: RequirementKey }[] = [
    { label: "At least 8 characters", key: "length" },
    { label: "Lowercase letter", key: "lowercase" },
    { label: "Uppercase letter", key: "uppercase" },
    { label: "Number", key: "number" },
    { label: "Special character", key: "special" },
  ];

  const checkPasswordStrength = (value: string) => {
    const updatedReqs = {
      length: value.length >= 8,
      lowercase: /[a-z]/.test(value),
      uppercase: /[A-Z]/.test(value),
      number: /\d/.test(value),
      special: /[@$!%*?&]/.test(value),
    };
    setPasswordRequirements(updatedReqs);
  };

  const handleSetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (
      !passwordRequirements.length ||
      !passwordRequirements.lowercase ||
      !passwordRequirements.uppercase ||
      !passwordRequirements.number ||
      !passwordRequirements.special
    ) {
      Alert.alert("Error", "Password does not meet security requirements.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const accessToken = await AsyncStorage.getItem("accessToken");

      const response = await fetch(
        `${config.BASE_URL}/auth/set-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ userId, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Password set successfully!");
        const role = await AsyncStorage.getItem("role");
        if (role === "admin") {
          router.replace("/(admintabs)/AdminDashboardScreen");
        } else {
          router.replace("/(tabs)/DashboardScreen");
        }
      } else {
        Alert.alert("Error", data?.error || "Failed to set password.");
      }
    } catch (error) {
      console.error("Error setting password:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/bg-login.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <BlurView intensity={40} tint="light" style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
            <View style={{ position: "absolute", top: 60, left: 20, zIndex: 1 }}>
              <BackButton
                onPress={async () => {
                  await AsyncStorage.removeItem("accessToken");
                  await AsyncStorage.removeItem("refreshToken");
                  await AsyncStorage.removeItem("isPasswordSet");
                  await AsyncStorage.removeItem("role");
                  await AsyncStorage.removeItem("userId");
                  router.replace("/");
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 35,
                fontWeight: "bold",
                color: "#a2785c", // חום בהיר יותר
                textAlign: "center",
                marginTop: -50, // מרווח מלמעלה
                marginBottom: 60,
                textShadowColor: "rgba(0, 0, 0, 0.15)",
                textShadowOffset: { width: 1, height: 3 },
                textShadowRadius: 4,
              }}
            >
              Set Your Password
            </Text>
            <Text
              style={{
                color: "#5d3a1a",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 10,
                backgroundColor: "#ecdcc6",
                padding: 10,
                borderRadius: 6,
                textAlign: "center",
              }}
            >
              Your password must include:
              {"\n"}✔ At least 8 characters
              {"\n"}✔ One lowercase letter
              {"\n"}✔ One uppercase letter
              {"\n"}✔ One number
              {"\n"}✔ One special character (e.g. @$!%*?&)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              onChangeText={(text) => {
                setPassword(text);
                checkPasswordStrength(text);
              }}
            />
            <View style={{ marginBottom: 10 }}>
              {requirementList.map((item) => (
                <Text key={item.key} style={{ color: passwordRequirements[item.key] ? "green" : "red" }}>
                  {passwordRequirements[item.key] ? "✔️" : "❌"} {item.label}
                </Text>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSetPassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Saving..." : "Set Password"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </BlurView>
    </ImageBackground>
  );
}