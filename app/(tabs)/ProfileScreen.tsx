import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import config from "../../config";
import { fetchUserData } from "../utils/fetchUserData";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    profilePic: "",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserDataAndSetState();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserDataAndSetState();
    }, [])
  );

  const fetchUserDataAndSetState = async () => {
    try {
      console.log("Fetching user data...");
      const userData = await fetchUserData();
      console.log("Fetched user data:", userData);

      const profilePicUrl = userData.profilePic
        ? `${config.BASE_URL}${userData.profilePic}`
        : require("../../assets/images/userIcon.png");

      console.log("Profile picture URL:", profilePicUrl);

      setUser({
        name: `Hi ${userData.firstName}` || "Guest",
        profilePic: profilePicUrl,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    console.log("Refreshing profile data...");
    setRefreshing(true);
    await fetchUserDataAndSetState();
  };

  const pickImage = async () => {
    console.log("Requesting permission to access gallery...");
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "You need to allow access to photos.");
      return;
    }

    console.log("Opening image picker...");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      console.log("Selected image URI:", selectedImage);
      uploadImage(selectedImage);
    } else {
      console.log("Image selection canceled.");
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      console.log("Fetching access token...");
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        Alert.alert("Error", "You need to be logged in.");
        return;
      }

      console.log("Creating form data for image upload...");
      const formData = new FormData();
      formData.append("profilePic", {
        uri: imageUri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      console.log("Uploading image to server...");
      const response = await fetch(
        `${config.BASE_URL}/auth/upload-profile-pic`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok)
        throw new Error(data.message || "Failed to upload image");

      const newProfilePicUrl = data.profilePicUrl.startsWith("http")
        ? `${data.profilePicUrl}?timestamp=${new Date().getTime()}`
        : `${config.BASE_URL}${
            data.profilePicUrl
          }?timestamp=${new Date().getTime()}`;

      setUser((prev) => ({
        ...prev,
        profilePic: newProfilePicUrl,
      }));

      console.log("Final Profile Pic URL:", newProfilePicUrl);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      Alert.alert("Success", "You have been logged out successfully!");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d49a6a" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <TouchableOpacity onPress={pickImage}>
        {user.profilePic ? (
          <Image
            source={
              typeof user.profilePic === "string"
                ? { uri: user.profilePic }
                : user.profilePic
            }
            style={styles.profileImage}
          />
        ) : (
          <Ionicons name="person-circle" size={100} color="black" />
        )}
      </TouchableOpacity>

      <Text style={styles.userName}>{user.name || "User"}</Text>
      <Text style={styles.title}>Profile</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/EditProfileScreen")}
      >
        <MaterialIcons name="edit" size={20} color="#fff" />
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/OrdersScreen")}
      >
        <MaterialIcons name="receipt-long" size={20} color="#fff" />
        <Text style={styles.buttonText}>My Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/AccountSecurityScreen")}
      >
        <MaterialIcons name="security" size={20} color="#fff" />
        <Text style={styles.buttonText}>Account Security</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#f9f3ea",
    paddingVertical: 100,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 80,
    marginBottom: 40,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6b4226",
  },
  title: {
    fontSize: 18,
    color: "#6b4226",
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d49a6a",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    justifyContent: "center",
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#e63946",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea",
  },
  loadingText: {
    fontSize: 18,
    color: "#6b4226",
    marginTop: 10,
  },
});
