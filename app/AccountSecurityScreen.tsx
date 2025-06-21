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
import Header from "../components/Header";

export default function AccountSecurityScreen() {
  const router = useRouter();
  // For password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });
  const [oldPassword, setOldPassword] = useState("");
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Delete User Confirmation Modal state and handlers
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

  // Show confirmation modal for user deletion
  const showDeleteConfirmation = () => {
    setDeleteModalVisible(true);
  };

  // Confirm and proceed with user deletion
  const confirmDeleteUser = async () => {
    setDeleteModalVisible(false);
    await handleDeleteUser(); // הפעולה המקורית למחיקה
  };

  // Password requirements list and checker
  const requirementList = [
    { label: "At least 8 characters", key: "length" },
    { label: "Lowercase letter", key: "lowercase" },
    { label: "Uppercase letter", key: "uppercase" },
    { label: "Number", key: "number" },
    { label: "Special character", key: "special" },
  ];

  const checkPasswordStrength = (value: string) => {
    setPasswordRequirements({
      length: value.length >= 8,
      lowercase: /[a-z]/.test(value),
      uppercase: /[A-Z]/.test(value),
      number: /\d/.test(value),
      special: /[@$!%*?&]/.test(value),
    });
  };

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

  // For clarity, use currentPassword and newPassword as requested
  // oldPassword = currentPassword, newPassword = newPassword
  const currentPassword = oldPassword;
  // newPassword already defined above

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    // New condition: new password must be different from current password
    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password must be different from the current password.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
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
          oldPassword: currentPassword,
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
      router.push("/ProfileScreen");
    } catch (error) {
      console.error("❌ Error updating password:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // The original delete handler, now called from confirmDeleteUser
  const handleDeleteUser = async () => {
    setShowDeletePasswordModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Account Security" />
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
              onChangeText={(text) => {
                setNewPassword(text);
                checkPasswordStrength(text);
                const isSameAsCurrent = text === oldPassword;
              }}
              placeholderTextColor={placeholderColor}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholderTextColor={placeholderColor}
            />
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
              <Text style={{ color: newPassword && newPassword === oldPassword ? "red" : "green" }}>
                {newPassword && newPassword === oldPassword ? "❌" : "✔️"} Password must be different from current password
              </Text>
            </View>

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

            <TouchableOpacity onPress={() => setShowForgotPasswordModal(true)}>
              <Text style={{ textAlign: "center", color: "#6b4226", textDecorationLine: "underline", marginBottom: 20 }}>
                Forgot your password?
              </Text>
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
              onPress={showDeleteConfirmation}
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

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>Enter your email to receive reset instructions.</Text>
            <TextInput
              style={styles.verificationInput}
              placeholder="Email"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={placeholderColor}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={async () => {
                try {
                  const res = await fetch(`${config.BASE_URL}/auth/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: forgotEmail }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setShowForgotPasswordModal(false);
                    router.push(`/ResetPasswordScreen?email=${forgotEmail}`);
                    setForgotEmail("");
                  } else {
                    Alert.alert("Error", data.message || "Failed to send reset email.");
                  }
                } catch (err) {
                  Alert.alert("Error", "Something went wrong.");
                }
              }}
            >
              <Text style={styles.buttonText}>Send Reset Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowForgotPasswordModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Password Modal */}
      <Modal
        visible={showDeletePasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeletePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
              <Text style={styles.modalSubtitle}>
                Before deleting your account, please read and confirm the following:
              </Text>
              <Text style={[styles.modalText, { marginVertical: 10 }]}>
                • Your account data will be retained for 30 days before permanent deletion.{"\n"}
                • Your previous orders will still be visible to admins for record purposes.{"\n"}
                • You won&apos;t be able to restore this account after 30 days.{"\n"}
                • Logging in again within 30 days will cancel the deletion request.
              </Text>
              <Text style={styles.modalSubtitle}>Enter your password to confirm:</Text>
              <TextInput
                style={styles.verificationInput}
                placeholder="Current Password"
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholderTextColor={placeholderColor}
              />
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={async () => {
                  try {
                    setLoading(true);
                    const token = await AsyncStorage.getItem("accessToken");
                    if (!token) {
                      Alert.alert("Error", "You must be logged in.");
                      return;
                    }
                    const res = await fetch(`${config.BASE_URL}/user/delete-profile`, {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ password: deletePassword }),
                    });
                    if (res.ok) {
                      await AsyncStorage.removeItem("accessToken");
                      Alert.alert("Account Deletion Initiated", "You have 30 days to change your mind.");
                      setShowDeletePasswordModal(false);
                      router.push("/");
                    } else {
                      const data = await res.json();
                      Alert.alert("Error", data.message || "Failed to delete account.");
                    }
                  } catch (err) {
                    Alert.alert("Error", "Something went wrong.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text style={styles.buttonText}>I Understand, Delete My Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowDeletePasswordModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Delete User Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            width: '85%',
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 20,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 5
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              Confirm Deletion
            </Text>
            <Text style={{ marginBottom: 15 }}>
              You&apos;re about to delete this user. Their information will be retained securely in our system for up to 30 days for administrative and legal purposes. Orders associated with the user will remain visible to admins.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={{ marginRight: 15 }}>
                <Text style={{ color: '#999' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteUser}>
                <Text style={{ color: '#d00', fontWeight: 'bold' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
