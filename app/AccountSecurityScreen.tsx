import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles/AccountSecurityStyles";

export default function AccountSecurityScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !verifyPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== verifyPassword) {
      Alert.alert("Error", "New password and verify password must match.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in to update your password.");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/auth/update-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (response.status === 400) {
        Alert.alert("Old Password Is Incorrect");
        return;
      }
      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to update password.");
        return;
      }

      Alert.alert("Success", "Password updated successfully!");
    } catch (error) {
      console.error("❌ Error updating password:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecoveryEmail = async () => {
    if (!recoveryEmail.trim()) {
      Alert.alert("Error", "Please provide a valid recovery email.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert(
          "Error",
          "You must be logged in to update your recovery email."
        );
        return;
      }

      const response = await fetch(
        `${config.BASE_URL}/user/update-recovery-email`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recoveryEmail,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 400) {
        Alert.alert("Error", data.message || "Bad Request");
        return;
      }

      if (!response.ok) {
        Alert.alert(
          "Error",
          data.message || "Failed to update recovery email."
        );
        return;
      }

      Alert.alert("Success", "Recovery email updated successfully!");
    } catch (error) {
      console.error("❌ Error updating recovery email:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              console.log("🚨 Deleting account...");
              const token = await AsyncStorage.getItem("accessToken");
              if (!token) {
                Alert.alert(
                  "Error",
                  "You must be logged in to delete your account."
                );
                return;
              }

              const response = await fetch(`${config.BASE_URL}/user/delete`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                console.error("❌ Account deletion failed");
                Alert.alert("Error", "Failed to delete account.");
                return;
              }

              await AsyncStorage.removeItem("accessToken");
              Alert.alert("Success", "Your account has been deleted.");
              router.push("/");
            } catch (error) {
              console.error("❌ Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Account Security</Text>

          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Old Password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Verify Password"
              secureTextEntry
              value={verifyPassword}
              onChangeText={setVerifyPassword}
            />

            <TouchableOpacity
              onPress={handleUpdatePassword}
              style={styles.button}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Enable Two-Factor Authentication</Text>
              <Switch
                value={isTwoFAEnabled}
                onValueChange={() => setIsTwoFAEnabled(!isTwoFAEnabled)}
              />
            </View>

            <Text style={styles.sectionTitle}>Change Recovery Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Recovery Email"
              value={recoveryEmail}
              onChangeText={setRecoveryEmail}
            />

            <TouchableOpacity
              onPress={handleUpdateRecoveryEmail}
              style={styles.button}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Recovery Email</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={[styles.button, styles.deleteButton]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Delete Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
