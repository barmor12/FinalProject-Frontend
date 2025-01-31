import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { useRouter } from "expo-router";
import { fetchUserData } from "./utils/fetchUserData";

export default function EditProfileScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<{ name: string; profilePic: string | number }>({
    name: "",
    profilePic: require("../assets/images/Welcome.jpg"), // ברירת מחדל
  });
  const [originalProfilePic, setOriginalProfilePic] = useState<string | number>(user.profilePic);

  useEffect(() => {
    const fetchUserDataAndSetState = async () => {
      try {
        const userData = await fetchUserData();
        console.log("Fetched user data:", userData);

        let profilePicUri: string | number = require("../assets/images/Welcome.jpg");

        if (userData.profilePic) {
          if (userData.profilePic.startsWith("http")) {
            profilePicUri = userData.profilePic;
          } else {
            profilePicUri = `${config.BASE_URL}${userData.profilePic}`;
          }
        }

        setUser({
          name: `Hi ${userData.firstName}` || "Guest",
          profilePic: profilePicUri,
        });

        setOriginalProfilePic(profilePicUri); // שמירת תמונת הפרופיל המקורית
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load user data.");
      }
    };

    fetchUserDataAndSetState();
  }, [refreshKey]);

  // פונקציה לבחירת תמונה מהגלריה
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "You need to allow access to photos to change your profile picture.");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        Alert.alert("No Image Selected", "You need to select an image to update your profile.");
        return;
      }

      console.log("Selected Image:", result.assets[0].uri);
      const newProfilePic = result.assets[0].uri;

      // שמירת התמונה הנוכחית לפני ההעלאה כדי שנוכל לחזור אליה במקרה של שגיאה
      const previousProfilePic = user.profilePic;
      setUser({ ...user, profilePic: newProfilePic });

      await uploadProfilePic(newProfilePic, previousProfilePic);

    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Something went wrong while picking an image.");
    }
  };

  // פונקציה להעלאת תמונה לשרת
  const uploadProfilePic = async (imageUri: string, previousProfilePic: string | number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in to update your profile picture.");
        setUser({ ...user, profilePic: previousProfilePic }); // חזרה לתמונה הקודמת
        return;
      }

      let formData = new FormData();
      formData.append("profilePic", {
        uri: imageUri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${config.BASE_URL}/user/upload-profile-pic`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Upload failed:", data);
        Alert.alert("Error", data.message || "Failed to upload profile picture.", [
          { text: "OK", onPress: () => setUser({ ...user, profilePic: previousProfilePic }) }, // חזרה לתמונה המקורית
        ]);
        return;
      }

      Alert.alert("Success", "Profile picture updated successfully!", [
        { text: "OK", onPress: () => setRefreshKey(prev => prev + 1) }
      ]);

    } catch (error) {
      console.error("Error uploading profile picture:", error);
      Alert.alert("Error", "Something went wrong while uploading your profile picture.", [
        { text: "OK", onPress: () => setUser({ ...user, profilePic: previousProfilePic }) } // חזרה לתמונה הקודמת
      ]);
    }
  };
  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in to update your profile.");
        return;
      }

      // בדיקה אם השדות ריקים
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert("Error", "Please fill in all fields.");
        return;
      }

      // יצירת FormData לשדות טקסט (שם פרטי ושם משפחה)
      let formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);

      // אם הוספנו תמונה חדשה, נוסיף אותה ל-FormData
      if (user.profilePic && typeof user.profilePic === "string" && user.profilePic.startsWith("http")) {
        formData.append("profilePic", {
          uri: user.profilePic, // במקרה שהתמונה היא URL
          name: "profile.jpg",
          type: "image/jpeg",
        } as any);
      } else if (user.profilePic && typeof user.profilePic !== "string") {
        formData.append("profilePic", {
          uri: user.profilePic,
          name: "profile.jpg",
          type: "image/jpeg",
        } as any);
      }

      // קריאה לשרת לעדכון פרופיל
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

      // הצגת הודעת הצלחה ורענון המסך
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => setRefreshKey(prev => prev + 1) }
      ]);

    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Something went wrong while updating your profile.");
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {/* תמונת פרופיל לחיצה לפתיחת גלריה */}
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={typeof user.profilePic === "string" ? { uri: user.profilePic } : user.profilePic}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    backgroundColor: "gray",
  },
  changePhotoText: {
    fontSize: 14,
    color: "#007BFF",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#d49a6a",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
