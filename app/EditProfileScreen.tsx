import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { useRouter } from "expo-router";
import { fetchUserData } from "./utils/fetchUserData";
import styles from "./styles/EditProfileStyles"; // Importing styles

export default function EditProfileScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<{
    name: string;
    profilePic: string | number;
  }>({
    name: "",
    profilePic: require("../assets/images/Welcome.jpg"),
  });

  useEffect(() => {
    const fetchUserDataAndSetState = async () => {
      try {
        const userData = await fetchUserData();
        console.log("🔄 Fetched user data:", userData);

        let profilePicUri:
          | string
          | number = require("../assets/images/Welcome.jpg");

        if (userData.profilePic) {
          profilePicUri = userData.profilePic.startsWith("http")
            ? userData.profilePic
            : `${config.BASE_URL}${userData.profilePic}`;
        }

        setUser({
          name: `Hi ${userData.firstName}` || "Guest",
          profilePic: profilePicUri,
        });
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
        Alert.alert("Error", "Failed to load user data.");
      }
    };

    fetchUserDataAndSetState();
  }, [refreshKey]);

  // Function to pick an image from the gallery
  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "You need to allow access to photos.");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        Alert.alert("No Image Selected", "You need to select an image.");
        return;
      }

      console.log("📸 Selected Image:", result.assets[0].uri);
      setUser({ ...user, profilePic: result.assets[0].uri });
    } catch (error) {
      console.error("❌ Error picking image:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert("Error", "Please fill in all fields.");
        return;
      }

      let formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);

      if (
        typeof user.profilePic === "string" &&
        user.profilePic.startsWith("http")
      ) {
        formData.append("profilePic", {
          uri: user.profilePic,
          name: "profile.jpg",
          type: "image/jpeg",
        } as any);
      }

      const response = await fetch(`${config.BASE_URL}/user/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to update profile.");
        return;
      }

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => setRefreshKey((prev) => prev + 1) },
      ]);
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={
            typeof user.profilePic === "string"
              ? { uri: user.profilePic }
              : user.profilePic
          }
          style={styles.profileImage}
          resizeMode="cover"
        />
        <Text style={styles.changePhotoText}>Change Photo</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      <TouchableOpacity onPress={handleUpdateProfile} style={styles.button}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
