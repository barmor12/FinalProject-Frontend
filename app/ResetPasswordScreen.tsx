import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ImageBackground,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import styles from "./styles/LoginStyles";
import { FontAwesome } from "@expo/vector-icons";
import config from "../config";
import BackButton from "../components/BackButton";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = params.email;
  const [email, setEmail] = useState(initialEmail || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const checkPasswordStrength = (value: string) => {
    setPasswordRequirements({
      length: value.length >= 8,
      lowercase: /[a-z]/.test(value),
      uppercase: /[A-Z]/.test(value),
      number: /\d/.test(value),
      special: /[@$!%*?&]/.test(value),
    });
    setNewPassword(value);
  };


  const handleResetPassword = async () => {
    if (!email || !code || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    // Check that all requirements are met
    if (
      !passwordRequirements.length ||
      !passwordRequirements.lowercase ||
      !passwordRequirements.uppercase ||
      !passwordRequirements.number ||
      !passwordRequirements.special
    ) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters long and include lowercase, uppercase, number, and special character."
      );
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${config.BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Your password has been reset successfully!", [
          { text: "OK", onPress: () => router.replace("/") },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to reset password.");
      }
    } catch (error) {
      console.error("❌ Error resetting password:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require("../assets/bg-login.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
        blurRadius={4}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={Platform.OS === "ios" ? true : false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={{ position: "absolute", top: 60, left: 20, zIndex: 10 }}>
              <BackButton />
            </View>
            <Text
              style={[
                styles.title,
                {
                  color: "#6b4226",
                  textShadowColor: "rgba(0, 0, 0, 0.15)",
                  textShadowOffset: { width: 1, height: 2 },
                  textShadowRadius: 3,
                },
              ]}
            >
              Reset Password
            </Text>
            <Text style={styles.subtitle}>Enter the reset code and new password</Text>

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
              placeholder="Reset Code"
              placeholderTextColor="#000"
              value={code}
              onChangeText={setCode}
            />

            <View style={[styles.input, { flexDirection: "row", alignItems: "center", paddingRight: 15 }]}>
              <TextInput
                style={{ flex: 1, fontSize: 16, color: "black" }}
                placeholder="New Password"
                placeholderTextColor="#000"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={checkPasswordStrength}
              />
              <TouchableOpacity onPress={() => setShowNewPassword((prev) => !prev)}>
                <FontAwesome
                  name={showNewPassword ? "eye" : "eye-slash"}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            {/* Password requirements display */}
            <View style={[styles.input, { flexDirection: "row", alignItems: "center", paddingRight: 15 }]}>
              <TextInput
                style={{ flex: 1, fontSize: 16, color: "black" }}
                placeholder="Confirm Password"
                placeholderTextColor="#000"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <FontAwesome
                  name={showConfirmPassword ? "eye" : "eye-slash"}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 10, marginBottom: 5 }}>
              <Text style={{ fontWeight: "bold", color: "#6b4226", marginBottom: 2 }}>
                Password must include:
              </Text>
              <Text style={{ color: passwordRequirements.length ? "green" : "red" }}>
                {passwordRequirements.length ? "✔️" : "❌"} At least 8 characters
              </Text>
              <Text style={{ color: passwordRequirements.lowercase ? "green" : "red" }}>
                {passwordRequirements.lowercase ? "✔️" : "❌"} Lowercase letter
              </Text>
              <Text style={{ color: passwordRequirements.uppercase ? "green" : "red" }}>
                {passwordRequirements.uppercase ? "✔️" : "❌"} Uppercase letter
              </Text>
              <Text style={{ color: passwordRequirements.number ? "green" : "red" }}>
                {passwordRequirements.number ? "✔️" : "❌"} Number
              </Text>
              <Text style={{ color: passwordRequirements.special ? "green" : "red" }}>
                {passwordRequirements.special ? "✔️" : "❌"} Special character (@$!%*?&)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#c49b72", marginTop: 40 }]}
              onPress={handleResetPassword}
              disabled={loading}
              testID="reset-password-button"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
