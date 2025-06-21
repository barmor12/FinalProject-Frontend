import React, { useState, useEffect, useCallback } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Linking,
  TextInput,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import config from "../../config";
import { fetchUserData } from "../utils/fetchUserData";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import styles from "../styles/ProfileScreenStyles";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    lastName: string;
    profilePic: string | number;
    lastLogin?: string | null;
  }>({
    name: "",
    lastName: "",
    profilePic: require("../../assets/images/userIcon.png"),
    lastLogin: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "whatsapp" | null>(null);

  const handleSendContact = () => {
    const fullMessage = contactMessage;

    if (contactMethod === "email") {
      const email = "mybakeyapp@gmail.com";
      const subject = "Need Assistance";
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`;
      Linking.openURL(mailtoUrl);
    } else if (contactMethod === "whatsapp") {
      const whatsappUrl = `https://wa.me/972509667461?text=${encodeURIComponent(fullMessage)}`;
      Linking.openURL(whatsappUrl);
    }

    setContactMessage("");
    setContactMethod(null);
  };

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
        lastLogin: userData.lastLogin ?? null,
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
      console.log(error);
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>

          <TouchableOpacity onPress={pickImage} >
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

          <Text style={[styles.userName, { marginTop: 15 }]}>
            {user.name || "User"} {user.lastName || ""}
          </Text>




          <TouchableOpacity
            style={[styles.button, { marginTop: 6 }]}
            onPress={() => router.push("/EditProfileScreen")}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 6 }]}
            onPress={() => router.push("/OrdersScreen")}
          >
            <MaterialIcons name="receipt-long" size={20} color="#fff" />
            <Text style={styles.buttonText}>My Orders</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.button, { marginTop: 6 }]}
            onPress={() => router.push("/CreditCardScreen")}
          >
            <MaterialIcons name="credit-card" size={20} color="#fff" />
            <Text style={styles.buttonText}>My Credit Cards</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.button, { marginTop: 6 }]}
            onPress={() => router.push("/AddressScreen")}
          >
            <MaterialIcons name="location-pin" size={20} color="#fff" />
            <Text style={styles.buttonText}>Manage Addresses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 6 }]}
            onPress={() => router.push("/AccountSecurityScreen")}
          >
            <MaterialIcons name="security" size={20} color="#fff" />
            <Text style={styles.buttonText}>Account Security</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.button, styles.logoutButton, { marginTop: 25 }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>

          <View style={styles.contactButtonsWrapper}>
            <View style={styles.contactButtonsContainer}>
              <TouchableOpacity
                onPress={() => setContactMethod("email")}
                style={styles.iconButton}
              >
                <MaterialIcons name="email" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setContactMethod("whatsapp")}
                style={styles.iconButton}
              >
                <FontAwesome name="whatsapp" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Linking.openURL("tel:0509667461")}
                style={styles.iconButton}
              >
                <MaterialIcons name="phone" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {contactMethod && (
            <View style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              zIndex: 998
            }} />
          )}

          {contactMethod && (
            <View style={styles.contactModal}>
              <TouchableOpacity
                onPress={() => setContactMethod(null)}
                style={styles.contactModalCloseButton}
              >
                <Ionicons name="close-circle" size={24} color="#d49a6a" />
              </TouchableOpacity>
              <Text style={styles.contactInputLabel}>Write your message below:</Text>
              <TextInput
                style={styles.contactInput}
                multiline
                numberOfLines={4}
                value={contactMessage}
                onChangeText={setContactMessage}
                placeholder="Type your message here..."
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendContact}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
