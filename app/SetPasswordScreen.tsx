import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import styles from "../app/styles/LoginStyles";
import config from "../config";
import BackButton from "../components/BackButton";

// Fallback for expo-blur in tests
let BlurView: React.ComponentType<any> = View;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BlurView: BV } = require("expo-blur");
  BlurView = BV;
} catch {
  /* no-op */
}

export default function SetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [phone, setPhone] = useState("");

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  type RequirementKey =
    | "length"
    | "lowercase"
    | "uppercase"
    | "number"
    | "special";

  const requirementList: { label: string; key: RequirementKey }[] = [
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

  const handleSetPassword = async () => {
    if (!password || !confirmPassword || !phone.trim()) {
      Alert.alert("Error", "Please fill in all fields, including phone number.");
      return;
    }
    if (password !== confirmPassword) {
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
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const accessToken = await AsyncStorage.getItem("accessToken");
      const response = await fetch(`${config.BASE_URL}/auth/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId, password, phone: phone.trim() }),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Password set successfully!");
        const role = await AsyncStorage.getItem("role");
        router.replace(
          role === "admin"
            ? "/(admintabs)/AdminDashboardScreen"
            : "/(tabs)/DashboardScreen"
        );
      } else {
        Alert.alert("Error", data?.error || "Failed to set password.");
      }
    } catch (err) {
      console.error("Error setting password:", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/bg-login.jpg")}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    >
      {/* BlurView for background blur */}
      <BlurView intensity={120} tint="light" style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={localStyles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={localStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={localStyles.backButton}>
            <BackButton
              onPress={async () => {
                await AsyncStorage.multiRemove([
                  "accessToken",
                  "refreshToken",
                  "isPasswordSet",
                  "role",
                  "userId",
                ]);
                router.replace("/");
              }}
            />
          </View>

          <Text style={styles.title}>Set Your Password</Text>

          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            onChangeText={(text) => {
              setPassword(text);
              checkPasswordStrength(text);
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            onChangeText={setConfirmPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={15}
          />

          <View style={localStyles.requirements}>
            {requirementList.map((item) => (
              <Text
                key={item.key}
                style={{
                  color: passwordRequirements[item.key] ? "green" : "red",
                  marginBottom: 4,
                }}
              >
                {passwordRequirements[item.key] ? "✔️" : "❌"} {item.label}
              </Text>
            ))}
          </View>


          <TouchableOpacity
            style={styles.button}
            onPress={handleSetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Saving..." : "Set Password"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const localStyles = StyleSheet.create({
  flex: { flex: 1 },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 100,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
  },
  requirementHeader: {
    color: "#5d3a1a",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
    backgroundColor: "#ecdcc6",
    padding: 10,
    borderRadius: 6,
    textAlign: "center",
  },
  requirements: {
    width: "100%",
    marginVertical: 12,
  },
});
