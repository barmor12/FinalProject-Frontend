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
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

export default function SignUpScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });
  type RequirementKey = "length" | "lowercase" | "uppercase" | "number" | "special";

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };
  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);

    if (profileImage) {
      const fileName = profileImage.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(fileName);
      const fileType = match ? `image/${match[1]}` : `image`;

      formData.append("profileImage", {
        uri: profileImage,
        name: fileName,
        type: fileType,
      } as any); // אם אתה מקבל טעות על זה, תשתמש ב־any
    }

    try {
      const response = await fetch(`${config.BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        Alert.alert("Success", "Account created! Please verify via email.");
        router.push("/");
      } else {
        Alert.alert("Error", data?.error || "Registration Failed");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const checkPasswordStrength = (value: string) => {
    const updatedReqs = {
      length: value.length >= 8,
      lowercase: /[a-z]/.test(value),
      uppercase: /[A-Z]/.test(value),
      number: /\d/.test(value),
      special: /[@$!%*?&]/.test(value),
    };
    setPasswordRequirements(updatedReqs);
  };

  const requirementList: { label: string; key: RequirementKey }[] = [
    { label: "At least 8 characters", key: "length" },
    { label: "Lowercase letter", key: "lowercase" },
    { label: "Uppercase letter", key: "uppercase" },
    { label: "Number", key: "number" },
    { label: "Special character", key: "special" },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={{ width: "100%", maxWidth: 360 }}>

          <Text style={styles.title}>Create an Account</Text>
          <Text style={styles.subtitle}>
            Join us and order your first cake with us
          </Text>

          <TouchableOpacity onPress={pickImage} style={styles.imageCircle}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.imageCircle} />
            ) : (
              <Image source={require("../assets/images/profile-user.png")} style={styles.imageCircle} />
            )}
          </TouchableOpacity>

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
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              checkPasswordStrength(text);
            }}
          />
          <View style={styles.passwordContainer}>
            {requirementList.map((item) => (
              <View key={item.key} style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>
                  {passwordRequirements[item.key] ? "✔️" : "❌"}
                </Text>
                <Text
                  style={[
                    styles.requirementText,
                    { color: passwordRequirements[item.key] ? "green" : "red" },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>



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
            <Text style={styles.loginLink} onPress={() => router.replace("/")}>
              Log In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView >
  );
}
