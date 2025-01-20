import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import styles from "./styles/LoginStyles";
import config from "../config";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    console.log("Login process started"); // Log to indicate the login process has begun

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Password validation
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    try {
      console.log("Sending request to server..."); // Log before sending the request
      const response = await fetch(`${config.BASE_URL}/auth/login`, {
        method: "POST", // HTTP method
        headers: {
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify({
          email, // User's email
          password, // User's password
        }),
      });

      console.log("Response received from server, parsing..."); // Log to indicate response is being processed
      const data = await response.json(); // Parse the response as JSON
      console.log("Server response:", data); // Log the server's response

      if (response.ok) {
        console.log("Login successful, navigating to dashboard..."); // Log on successful login
        Alert.alert("Success", "Logged in successfully!");
        router.push("/"); // Navigate to the dashboard or appropriate page
      } else {
        console.warn(
          "Login failed:",
          data.message || "No specific error message"
        ); // Log when login fails
        Alert.alert("Error", data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error during login process:", error); // Log errors during the login process
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Manage your cake business with ease</Text>

      {/* Email input field */}
      <TextInput
        style={styles.input}
        placeholder="Email" // Placeholder text for the email field
        keyboardType="email-address" // Keyboard type specific for email input
        value={email} // Bind to email state
        onChangeText={setEmail} // Update email state
      />

      {/* Password input field */}
      <TextInput
        style={styles.input}
        placeholder="Password" // Placeholder text for the password field
        secureTextEntry // Hide the text for password security
        value={password} // Bind to password state
        onChangeText={setPassword} // Update password state
      />

      {/* Login button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      {/* Google login button */}
      <TouchableOpacity style={styles.googleButton}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
          }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>

      {/* Link to SignUpScreen */}
      <Text style={styles.signupText}>
        Don’t have an account?{" "}
        <Text
          style={styles.signupLink}
          onPress={() => router.push("/SignUpScreen")}
        >
          Sign Up here
        </Text>
      </Text>
    </View>
  );
}
