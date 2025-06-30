// src/app/SignUpScreen.tsx
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
  ImageBackground,
  Linking,
  Image
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import styles from "./styles/SignUpStyles";
import config from "../config";
import * as ImagePicker from "expo-image-picker";
import BackButton from "../components/BackButton";

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
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    // שולחים רק אם מדיניות מאושרת
    if (!acceptedPolicy) {
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email.toLowerCase().trim());
    formData.append("password", password);
    if (profileImage) {
      const fileName = profileImage.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(fileName);
      const fileType = match ? `image/${match[1]}` : `image`;
      formData.append("profileImage", {
        uri: profileImage,
        name: fileName,
        type: fileType,
      } as any);
    }

    try {
      const response = await fetch(`${config.BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        Alert.alert("Success", "Account created! Please verify via email.");
        router.push("/");
      } else {
        Alert.alert("Error", data?.error || "Registration Failed");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const checkPasswordStrength = (value: string) => {
    setPasswordRequirements({
      length: value.length >= 8,
      lowercase: /[a-z]/.test(value),
      uppercase: /[A-Z]/.test(value),
      number: /\d/.test(value),
      special: /[@$!%*?&]/.test(value),
    });
  };

  return (
    <ImageBackground
      source={require("../assets/bg-login.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
      blurRadius={10}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ alignItems: "center", paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 }}>
          <View style={{ alignSelf: "flex-start", padding: 20,marginLeft: -40, paddingTop: 50, zIndex: 10 }}>
            <TouchableOpacity onPress={() => router.replace("/")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <BackButton />
            </TouchableOpacity>
          </View>
          <View style={{ width: "100%", maxWidth: 360 }}>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>Join us and order your first cake with us</Text>

            <TouchableOpacity onPress={pickImage} style={styles.imageCircle}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.imageCircle} />
              ) : (
                <Image source={require("../assets/images/profile-user.png")} style={styles.imageCircle} />
              )}
            </TouchableOpacity>
            <Text style={styles.imagePickerText}>Tap to add profile picture</Text>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} testID="firstName-input" />
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} testID="lastName-input" />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              keyboardType="email-address"
              onChangeText={setEmail}
              testID="email-input"
            />
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.input, { flexDirection: "row", alignItems: "center", paddingRight: 15 }]}>
              <TextInput
                style={{ flex: 1, fontSize: 16, color: "black" }}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  checkPasswordStrength(t);
                }}
                testID="password-input"
                placeholder="Password"
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <FontAwesome
                  name={showPassword ? "eye" : "eye-slash"}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Password must include:</Text>
              <Text>{passwordRequirements.length ? "✔️" : "❌"} At least 8 characters</Text>
              <Text>{passwordRequirements.lowercase ? "✔️" : "❌"} One lowercase letter</Text>
              <Text>{passwordRequirements.uppercase ? "✔️" : "❌"} One uppercase letter</Text>
              <Text>{passwordRequirements.number ? "✔️" : "❌"} One number</Text>
              <Text>{passwordRequirements.special ? "✔️" : "❌"} One special character (@$!%*?&)</Text>
            </View>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={[styles.input, { flexDirection: "row", alignItems: "center", paddingRight: 15 }]}>
              <TextInput
                style={{ flex: 1, fontSize: 16, color: "black" }}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                testID="confirmPassword-input"
                placeholder="Confirm Password"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <FontAwesome
                  name={showConfirmPassword ? "eye" : "eye-slash"}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 16 }}>
              <TouchableOpacity
                onPress={() => setAcceptedPolicy(!acceptedPolicy)}
                style={{
                  height: 22,
                  width: 22,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                  backgroundColor: acceptedPolicy ? "#ba4c4c" : "#fff",
                }}
              >
                {acceptedPolicy && <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>}
              </TouchableOpacity>

              {/* כאן הוספנו onPress כדי שהבדיקה תוכל ללחוץ על הטקסט */}
              <Text
                style={{ flex: 1, color: "#333" }}
                onPress={() => setAcceptedPolicy(!acceptedPolicy)}
              >
                I have read and agree to the{" "}
                <Text
                  style={{ color: "#ba4c4c", textDecorationLine: "underline" }}
                  onPress={() =>
                    Linking.openURL(
                      "https://barmor12.github.io/Bakey/bakey_privacy_policy_modern.html"
                    )
                  }
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { opacity: acceptedPolicy ? 1 : 0.5 }]}
              onPress={handleSignUp}
              disabled={!acceptedPolicy}
              testID="signup-button"
            >
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
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
