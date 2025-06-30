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
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import styles from "./styles/LoginStyles";
import config from "../config";
import Header from "../components/Header";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);


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

      const text = await response.text(); // Get the raw response text
      console.log("🔹 Server raw response:", text);


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
      <BlurView intensity={30} tint="light" style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>
            <Header
              title="Forgot Password"
              style={{
                backgroundColor: "transparent",
                marginTop: -170     // pull header upward
              }}
            />
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
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </ImageBackground>
  );
}
