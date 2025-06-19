import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useSearchParams } from "expo-router/build/hooks";
import config from "../config";

export default function EmailVerificationScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage("Invalid or missing verification token.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${config.BASE_URL}/auth/verify-email?token=${encodeURIComponent(
            token
          )}`
        );
        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          setMessage(
            "Thank you! Your email has been successfully verified. 🎉"
          );
        } else {
          setMessage(data.message || "Verification failed. Please try again.");
        }
      } catch (error) {
        console.log(error);
        setMessage("Something went wrong. Please try again later.");
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
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.message}>Verifying your email...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={success ? styles.successBox : styles.errorBox}>
        <Text style={styles.icon}>{success ? "🎉" : "❌"}</Text>
        <Text style={styles.title}>
          {success ? "Email Verified!" : "Verification Failed"}
        </Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    padding: 20,
  },
  successBox: {
    backgroundColor: "#e3fcef",
    padding: 30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: "85%",
    alignItems: "center",
  },
  errorBox: {
    backgroundColor: "#fdecea",
    padding: 30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: "85%",
    alignItems: "center",
  },
  icon: {
    fontSize: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    color: "#555",
  },
});
