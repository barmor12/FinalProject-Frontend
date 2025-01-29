import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
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

export default function AccountSecurityScreen() {
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [verifyPassword, setVerifyPassword] = useState("");
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false);
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
                        const token = await AsyncStorage.getItem("accessToken");
                        if (!token) {
                            Alert.alert("Error", "You must be logged in to delete your account.");
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
                                Alert.alert("Error", "Failed to delete account.");
                                return;
                            }

                            await AsyncStorage.removeItem("accessToken");
                            Alert.alert("Success", "Your account has been deleted.");
                            router.push("/");
                        } catch (error) {
                            console.error("Error deleting account:", error);
                            Alert.alert("Error", "Failed to delete account.");
                        }
                    },
                },
            ]
        );
    };
    const handleUpdatePassword = async () => {

    };
    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flexContainer}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* כפתור חזרה */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>{"< Back"}</Text>
                    </TouchableOpacity>

                    {/* כותרת ממורכזת */}
                    <Text style={styles.title}>Account Security</Text>

                    <View style={styles.container}>
                        {/* כותרת קטנה מעל שדות הסיסמה */}
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
                        <TouchableOpacity onPress={() => { }} style={styles.button}>
                            <Text style={styles.buttonText}>Update Password</Text>
                        </TouchableOpacity>

                        {/* אימות דו-שלבי */}
                        <View style={styles.switchContainer}>
                            <Text style={styles.label}>Enable Two-Factor Authentication</Text>
                            <Switch value={isTwoFAEnabled} onValueChange={() => setIsTwoFAEnabled(!isTwoFAEnabled)} />
                        </View>
                        <View>
                            <Text style={styles.sectionTitle}>Change Recovery Email</Text>

                            {/* אימייל לשחזור */}
                            <TextInput
                                style={styles.input}
                                placeholder="Recovery Email"
                                value={recoveryEmail}
                                onChangeText={setRecoveryEmail}
                            />
                            <TouchableOpacity onPress={() => { }} style={styles.button}>
                                <Text style={styles.buttonText}>Update Recovery Email</Text>
                            </TouchableOpacity>
                        </View>


                        {/* מחיקת חשבון */}
                        <TouchableOpacity onPress={handleDeleteAccount} style={[styles.button, { backgroundColor: "red" }]}>
                            <Text style={styles.buttonText}>Delete Account</Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#f9f3ea" },
    flexContainer: { flex: 1 },
    scrollContainer: { flexGrow: 1, paddingBottom: 20 },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center", // ממורכז
        marginVertical: 60,
        marginBottom: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333",
    },
    input: {
        width: "100%",
        padding: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: "#fff",
    },
    button: {
        backgroundColor: "#d49a6a",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    switchContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    label: { fontSize: 16, fontWeight: "bold" },

    // סגנון לכפתור חזרה
    backButton: {
        position: "absolute",
        top: 10,
        left: 10,
        backgroundColor: "#d49a6a",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        zIndex: 10,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
});
