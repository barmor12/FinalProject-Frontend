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
    console.log("Login process started"); // לוג לתחילת התהליך
    console.log("User credentials:", { email, password }); // לוג פרטי התחברות (למטרות דיבאג בלבד)

    try {
      console.log("Sending request to server...");
      const response = await fetch(`${config.BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("Response received from server, parsing...");
      const data = await response.json();
      console.log("Server response:", data); // לוג תגובת השרת

      if (response.ok) {
        console.log("Login successful, navigating to dashboard...");
        Alert.alert("Success", "Logged in successfully!");
        router.push("/"); // נווט לדשבורד או לדף המתאים
      } else {
        console.warn(
          "Login failed:",
          data.message || "No specific error message"
        );
        Alert.alert("Error", data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error during login process:", error); // לוג שגיאה
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Manage your cake business with ease</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => {
          console.log("Email updated:", text); // לוג לעדכון אימייל
          setEmail(text);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          console.log("Password updated"); // לוג לעדכון סיסמה (לא נדפיס את הסיסמה עצמה)
          setPassword(text);
        }}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
          }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don’t have an account?{" "}
        <Text
          style={styles.signupLink}
          onPress={() => {
            console.log("Navigating to SignUpScreen"); // לוג למעקב אחרי ניווט
            router.push("/SignUpScreen");
          }}
        >
          Sign Up here
        </Text>
      </Text>
    </View>
  );
}
