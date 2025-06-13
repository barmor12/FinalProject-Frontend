import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
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
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    profilePic: string | number;
  }>({
    firstName: "",
    lastName: "",
    profilePic: require("../assets/images/Welcome.jpg"),
  });

  useEffect(() => {
    const fetchUserDataAndSetState = async () => {
      try {
        setLoading(true);
        const userData = await fetchUserData();
        console.log("🔄 Fetched user data:", userData);

        let profilePicUri:
          | string
          | number = require("../assets/images/userIcon.png");

        if (userData.profilePic && userData.profilePic.url) {
          profilePicUri = userData.profilePic.url;
        }

        setUser({
          firstName: userData.firstName || "Guest",
          lastName: userData.lastName || "Null",
          profilePic: profilePicUri,
        });
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
        Alert.alert("Error", "Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndSetState();
  }, []);

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

      setUser({ ...user, profilePic: result.assets[0].uri });
      await handleUpdateProfilePic(result.assets[0].uri);
    } catch (error) {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const handleUpdateProfilePic = async (imageUri: string) => {
    try {
      setIsUploading(true);

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in.");
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("profilePic", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile_pic.jpg",
      } as any);

      const response = await fetch(
        `${config.BASE_URL}/user/update-profile-pic`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Error",
          data.message || "Failed to update profile picture."
        );
        setIsUploading(false);
        return;
      }

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateName = async () => {
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

      const response = await fetch(
        `${config.BASE_URL}/user/updateNameProfile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName,
            lastName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to update name.");
        return;
      }

      Alert.alert("Success", "Name updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.back(); // Navigate back to the previous screen
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Error updating name:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d49a6a" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={pickImage} disabled={isUploading}>
            <View>
              {isUploading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : (
                <Image
                  source={
                    typeof user.profilePic === "string"
                      ? { uri: user.profilePic }
                      : user.profilePic
                  }
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder={user.firstName}
            placeholderTextColor={"#000"}
            value={firstName}
            onChangeText={setFirstName}
          />
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={"#000"}
            placeholder={user.lastName}
            value={lastName}
            onChangeText={setLastName}
          />

          <TouchableOpacity onPress={handleUpdateName} style={styles.button}>
            <Text style={styles.buttonText}>Update Profile</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
