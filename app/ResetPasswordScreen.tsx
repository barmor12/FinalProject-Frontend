import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import styles from "./styles/LoginStyles";
import config from "../config";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 📌 פונקציה לאיפוס סיסמה
  const handleResetPassword = async () => {
    if (!email || !code || !newPassword) {
      Alert.alert("Error", "Please fill in all fields.");
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
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
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

      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#000"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/")}
      >
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}
