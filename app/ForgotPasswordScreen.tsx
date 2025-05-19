import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import styles from "./styles/LoginStyles";
import config from "../config";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // 📌 פונקציה לשליחת בקשת שחזור סיסמה
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const text = await response.text(); // קרא את התגובה כטקסט כדי לבדוק אותה
      console.log("🔹 Server raw response:", text);

      // ננסה לנתח את התגובה ל-JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error("❌ JSON parsing error:", jsonError);
        Alert.alert("Error", "Unexpected response from server.");
        return;
      }

      if (response.ok) {
        Alert.alert("Success", "A reset code has been sent to your email.", [
          {
            text: "OK",
            onPress: () =>
              router.push({
                pathname: "/ResetPasswordScreen",
                params: { email: email.toLowerCase().trim() },
              }),
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to send reset email.");
      }
    } catch (error) {
      console.error("❌ Error sending reset email:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={[styles.title, { opacity: 0 }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { opacity: 0 }]}>
              Enter your email to reset your password
            </Text>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor="#000"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.signupLink}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
