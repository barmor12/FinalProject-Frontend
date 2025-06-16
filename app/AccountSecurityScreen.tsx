import React, { useState, useEffect } from "react";
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
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import styles, { placeholderColor } from "./styles/AccountSecurityStyles";

export default function AccountSecurityScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);

  // Fetch current 2FA status when component mounts
  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/auth/2fa/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsTwoFAEnabled(data.isEnabled);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
    }
  };

  const handle2FAToggle = async (value: boolean) => {
    if (value) {
      // Enabling 2FA
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          Alert.alert("Error", "You must be logged in to enable 2FA.");
          return;
        }

        const response = await fetch(`${config.BASE_URL}/auth/2fa/enable`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsEnabling2FA(true);
          setShowVerificationModal(true);
        } else {
          const data = await response.json();
          Alert.alert("Error", data.message || "Failed to enable 2FA.");
        }
      } catch (error) {
        console.error("Error enabling 2FA:", error);
        Alert.alert("Error", "Something went wrong while enabling 2FA.");
      } finally {
        setLoading(false);
      }
    } else {
      // Disabling 2FA
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          Alert.alert("Error", "You must be logged in to disable 2FA.");
          return;
        }

        const response = await fetch(`${config.BASE_URL}/auth/2fa/disable`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsTwoFAEnabled(false);
          Alert.alert("Success", "2FA has been disabled successfully.");
        } else {
          const data = await response.json();
          Alert.alert("Error", data.message || "Failed to disable 2FA.");
        }
      } catch (error) {
        console.error("Error disabling 2FA:", error);
        Alert.alert("Error", "Something went wrong while disabling 2FA.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode.trim()) {
      Alert.alert("Error", "Please enter the verification code.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in to verify 2FA.");
        return;
      }
      console.log("checking 2fa");
      const response = await fetch(`${config.BASE_URL}/auth/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.ok) {
        setIsTwoFAEnabled(true);
        setShowVerificationModal(false);
        setVerificationCode("");
        setIsEnabling2FA(false);
        Alert.alert("Success", "2FA has been enabled successfully.");
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Invalid verification code.");
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      Alert.alert("Error", "Something went wrong while verifying 2FA.");
    } finally {
      setLoading(false);
    }
  };

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

              const response = await fetch(
                `${config.BASE_URL}/user/delete-profile`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Security</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Old Password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholderTextColor={placeholderColor}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor={placeholderColor}
            />
            <TextInput
              style={styles.input}
              placeholder="Verify Password"
              secureTextEntry
              value={verifyPassword}
              onChangeText={setVerifyPassword}
              placeholderTextColor={placeholderColor}
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
                onValueChange={handle2FAToggle}
                disabled={loading}
              />
            </View>

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

      {/* 2FA Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowVerificationModal(false);
          setIsEnabling2FA(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEnabling2FA
                ? "Enable Two-Factor Authentication"
                : "Verify 2FA Setup"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isEnabling2FA
                ? "A verification code has been sent to your email. Please enter it below to enable 2FA."
                : "Please enter the verification code sent to your email"}
            </Text>
            <TextInput
              style={styles.verificationInput}
              placeholder="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor={placeholderColor}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerify2FA}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isEnabling2FA ? "Enable 2FA" : "Verify"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowVerificationModal(false);
                setIsEnabling2FA(false);
                setVerificationCode("");
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
