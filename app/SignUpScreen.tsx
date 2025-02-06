import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import styles from "./styles/SignUpStyles";
import config from "../config";

export default function SignUpScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = async () => {
    console.log("Starting sign-up process..."); // Log to indicate the start of the process

    // Validate form inputs
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      console.warn("Form validation failed: missing fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      console.warn("Password validation failed: passwords do not match");
      return;
    }

    // Check password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Error",
        "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character."
      );
      console.warn("Password validation failed: weak password");
      return;
    }

    try {
      console.log("Sending registration request to backend..."); // Log before sending request

      // Send request to the backend
      const response = await fetch(`${config.BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      console.log("Parsing backend response..."); // Log before parsing response
      const data = await response.json().catch(() => null);

      console.log("Backend response received:", data); // Log the server response

      if (response.ok) {
        // Show success message and inform the user about email verification
        Alert.alert(
          "Success",
          "Account created successfully! Please check your email to verify your account."
        );
        console.log("Registration successful, navigating to login screen...");
        router.push("/"); // Navigate to the login screen
      } else {
        // Show backend error message
        const errorMessage =
          data?.message || "Registration failed. Please try again.";
        Alert.alert("Error", errorMessage);
        console.warn("Registration failed:", errorMessage);
      }
    } catch (error) {
      console.error("Error during registration process:", error); // Log the error
      Alert.alert("Error", "Something went wrong. Please try again later.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>
          Join us and start managing your cake business
        </Text>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Password Instructions:</Text>
          <Text style={styles.instructionsText}>
            1. Password must be at least 8 characters long.
          </Text>
          <Text style={styles.instructionsText}>2. Password must include:</Text>
          <Text style={styles.instructionsText}>
            - At least one uppercase letter.
          </Text>
          <Text style={styles.instructionsText}>
            - At least one lowercase letter.
          </Text>
          <Text style={styles.instructionsText}>- At least one number.</Text>
          <Text style={styles.instructionsText}>
            - At least one special character (e.g., @, $, !, %, *, ?, &).
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          placeholderTextColor="#000"
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          placeholderTextColor="#000"
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          placeholderTextColor="#000"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor="#000"
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <Text style={styles.loginText}>
          Already has account?{" "}
          <Text style={styles.loginLink} onPress={() => router.push("/")}>
            Log In
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
