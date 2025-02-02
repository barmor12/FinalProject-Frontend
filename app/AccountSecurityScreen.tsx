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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles/AccountSecurityStyles"; // Importing styles from a separate file

export default function AccountSecurityScreen() {
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [verifyPassword, setVerifyPassword] = useState("");
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false);

    // Function to handle account deletion
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
                        console.log("🚨 Deleting account...");
                        const token = await AsyncStorage.getItem("accessToken");
                        if (!token) {
                            Alert.alert(
                                "Error",
                                "You must be logged in to delete your account."
                            );
                            return;
                        }

                        try {
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
                        }
                    },
                },
            ]
        );
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
        }
    };
    const handleUpdateRecoveryEmail = async () => {
        if (!recoveryEmail.trim()) {
            Alert.alert("Error", "Please provide a valid recovery email.");
            return;
        }

        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You must be logged in to update your recovery email.");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/user/update-recovery-email`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    recoveryEmail,
                }),
            });

            const data = await response.json();

            if (response.status === 400) {
                Alert.alert("Error", data.message || "Bad Request");
                return;
            }

            if (!response.ok) {
                Alert.alert("Error", data.message || "Failed to update recovery email.");
                return;
            }

            Alert.alert("Success", "Recovery email updated successfully!");
        } catch (error) {
            console.error("❌ Error updating recovery email:", error);
            Alert.alert("Error", "Something went wrong.");
        }
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
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>{"< Back"}</Text>
                    </TouchableOpacity>

                    {/* Title */}
                    <Text style={styles.title}>Account Security</Text>

                    <View style={styles.container}>
                        {/* Password change section */}
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

                        <TouchableOpacity onPress={handleUpdatePassword} style={styles.button}>
                            <Text style={styles.buttonText}>Update Password</Text>
                        </TouchableOpacity>

                        {/* Two-factor authentication toggle */}
                        <View style={styles.switchContainer}>
                            <Text style={styles.label}>Enable Two-Factor Authentication</Text>
                            <Switch
                                value={isTwoFAEnabled}
                                onValueChange={() => setIsTwoFAEnabled(!isTwoFAEnabled)}
                            />
                        </View>

                        {/* Recovery email update */}
                        <Text style={styles.sectionTitle}>Change Recovery Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Recovery Email"
                            value={recoveryEmail}
                            onChangeText={setRecoveryEmail}
                        />

                        <TouchableOpacity onPress={() => { Alert.alert("need to add handle") }} style={styles.button}>
                            <Text style={styles.buttonText}>Update Recovery Email</Text>
                        </TouchableOpacity>

                        {/* Delete account button */}
                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            style={[styles.button, { backgroundColor: "red" }]}
                        >
                            <Text style={styles.buttonText}>Delete Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
