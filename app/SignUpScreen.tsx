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
    console.log("SignUp initiated"); // לוג להתחלה
    console.log("User details:", { firstName, lastName, email }); // לוג פרטי משתמש

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      console.log("Validation failed: Missing fields");
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      console.log("Validation failed: Passwords do not match");
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      console.log("Sending request to server...");
      const response = await fetch(`${config.BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Server response: Success", data); // לוג עבור תגובת הצלחה מהשרת
        Alert.alert("Success", "Account created successfully!");
        router.push("/"); // נווט לדף ההתחברות
      } else {
        console.log("Server response: Error", data); // לוג עבור תגובת שגיאה מהשרת
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error connecting to server:", error); // לוג לשגיאות
      Alert.alert("Error", "Failed to connect to the server");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
      <Text style={styles.subtitle}>
        Join us and start managing your cake business
      </Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        keyboardType="default"
        value={firstName}
        onChangeText={(text) => {
          console.log("First name updated:", text); // לוג עבור שינוי שדה
          setFirstName(text);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        keyboardType="default"
        value={lastName}
        onChangeText={(text) => {
          console.log("Last name updated:", text);
          setLastName(text);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => {
          console.log("Email updated:", text);
          setEmail(text);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          console.log("Password updated");
          setPassword(text);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={(text) => {
          console.log("Confirm Password updated");
          setConfirmPassword(text);
        }}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
          }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign up with Google</Text>
      </TouchableOpacity>

      <Text style={styles.loginText}>
        Already have an account?{" "}
        <Text style={styles.loginLink} onPress={() => router.back()}>
          Log In here
        </Text>
      </Text>
    </View>
  );
}
