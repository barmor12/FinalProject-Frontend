import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { useRouter } from "expo-router";
import { fetchUserData } from "./utils/fetchUserData";
import styles from "./styles/EditProfileStyles"; // Importing styles
import Header from "../components/Header";
import ImagePickerModal from '../components/ImagePickerModal';

const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export default function EditProfileScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    profilePic: string | number;
  }>({
    firstName: "",
    lastName: "",
    profilePic: require("../assets/images/Welcome.jpg"),
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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
      setFirstName(userData.firstName || "Guest");
      setLastName(userData.lastName || "Null");
      setEmail(userData.email || "");
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndSetState();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserDataAndSetState();
    setRefreshing(false);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "You need to allow access to photos.");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        Alert.alert("No Image Selected", "You need to select an image.");
        return;
      }

      setSelectedImage(result.assets[0].uri);
      setShowPreview(true);
    } catch (error) {
      Alert.alert("Error", "Something went wrong.");
      console.log("error upload image", error)
    }
  };

  const handleConfirmImage = async () => {
    if (!selectedImage) return;
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        selectedImage,
        [{ resize: { width: 600 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      setUser({ ...user, profilePic: manipResult.uri });
      await handleUpdateProfilePic(manipResult.uri);
    } catch (err) {
      Alert.alert("Error", "Image processing failed.");
      console.log("error", err)
      setShowPreview(false);
      setSelectedImage(null);
      return;
    }
    setShowPreview(false);
    setSelectedImage(null);
  };

  const handleCancelImage = () => {
    setShowPreview(false);
    setSelectedImage(null);
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
      console.log("error upload image", error)
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
            firstName: capitalizeFirstLetter(firstName.trim()),
            lastName: capitalizeFirstLetter(lastName.trim()),
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
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Header title="Edit Profile" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d49a6a" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={pickImage} disabled={isUploading} style={styles.imageContainer}>
            <View style={{ alignItems: "center" }}>
              {isUploading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : (
                <Image
                  testID="profile-image"
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

          <ImagePickerModal
            visible={showPreview && !!selectedImage}
            imageUri={selectedImage}
            onConfirm={handleConfirmImage}
            onCancel={handleCancelImage}
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#eee", color: "#888" }]}
            value={email}
            editable={false}
            selectTextOnFocus={false}
            placeholderTextColor="#888"
          />

          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            placeholderTextColor={"#000"}
            value={firstName || ""}
            onChangeText={setFirstName}
          />
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            placeholderTextColor={"#000"}
            value={lastName || ""}
            onChangeText={setLastName}
          />

          <TouchableOpacity onPress={handleUpdateName} style={styles.button}>
            <Text style={styles.buttonText}>Update Profile</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}