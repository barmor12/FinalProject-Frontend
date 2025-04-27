import React, { useState, useEffect, useCallback } from "react";
import * as ImageManipulator from "expo-image-manipulator";
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
  SafeAreaView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import config from "../../config";
import { fetchUserData } from "../utils/fetchUserData";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    lastName: string;
    profilePic: string | number;
  }>({
    name: "",
    lastName: "",
    profilePic: require("../../assets/images/userIcon.png"),
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
      const userData = await fetchUserData();
      console.log("🔄 Fetched user data:", userData);

      let profilePicUri:
        | string
        | number = require("../../assets/images/userIcon.png");

      if (userData.profilePic && userData.profilePic.url) {
        profilePicUri = userData.profilePic.url;
      }

      setUser({
        name: userData.firstName || "Guest",
        lastName: userData.lastName || "",
        profilePic: profilePicUri,
      });
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data.");
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

      // Compress and resize image before setting and uploading
      const originalUri = result.assets[0].uri;
      // First resize to width 600, then compress to 0.5 quality
      const manipResult = await ImageManipulator.manipulateAsync(
        originalUri,
        [{ resize: { width: 600 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      setUser({ ...user, profilePic: manipResult.uri });
      await uploadImage(manipResult.uri);
    } catch (error) {
      Alert.alert("Error", "Something went wrong.");
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
      console.log("Server response:", data);

      if (!response.ok)
        throw new Error(data.message || "Failed to upload image");

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
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingContainer]}>
          <View style={styles.profileImagePlaceholder} />
          <View style={styles.userNamePlaceholder} />
          <View style={styles.titlePlaceholder} />
          <ActivityIndicator
            size="large"
            color="#d49a6a"
            style={styles.loader}
          />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

        <Text style={styles.userName}>
          {user.name || "User"} {user.lastName || ""}
        </Text>
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
          onPress={() => router.push("/manageAddressScreen")}
        >
          <MaterialIcons name="receipt-long" size={20} color="#fff" />
          <Text style={styles.buttonText}>Manage Addresses</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f3ea",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#f9f3ea",
    paddingVertical: 100,
  },
  loadingContainer: {
    justifyContent: "center",
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 80,
    backgroundColor: "#e0e0e0",
    marginBottom: 40,
  },
  userNamePlaceholder: {
    width: 150,
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 10,
  },
  titlePlaceholder: {
    width: 80,
    height: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b4226",
    marginTop: 10,
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
});
