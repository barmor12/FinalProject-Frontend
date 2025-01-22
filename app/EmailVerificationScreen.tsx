import React, { useEffect, useState } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import styles from "./styles/EmailVerificationStyles";
import config from "./config";

export default function EmailVerificationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Extract token from the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setToken(searchParams.get("token"));
  }, []);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        Alert.alert("Error", "Invalid or missing verification token");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${config.BASE_URL}/auth/verify-email?token=${token}`
        );
        const data = await response.json();

        if (response.ok) {
          Alert.alert("Success", "Email verified successfully!");
          router.push("/"); // Navigate to the login screen
        } else {
          Alert.alert("Error", data.message || "Verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        Alert.alert("Error", "Something went wrong during verification");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Verifying your email...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Complete</Text>
      <Text style={styles.subtitle}>You can now log in with your account.</Text>
    </View>
  );
}
