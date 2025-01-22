import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import config from "../config";

export default function SaveDraftOrderScreen() {
  const [userId, setUserId] = useState("");
  const [cakeId, setCakeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    userId?: string;
    cakeId?: string;
    quantity?: string;
  }>({});

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // עדכון ל-API החדש
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const fileUri = result.assets[0].uri;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
        Alert.alert("Error", "File size exceeds 5MB");
        return;
      }

      const fileExtension = fileUri.split(".").pop()?.toLowerCase();
      if (!["jpeg", "jpg", "png", "pdf"].includes(fileExtension || "")) {
        Alert.alert("Error", "Unsupported file format");
        return;
      }

      setImageUri(fileUri);
    }
  };

  const validateOrder = () => {
    const errors: { userId?: string; cakeId?: string; quantity?: string } = {};
    if (!userId.trim()) errors.userId = "User ID is required";
    if (!cakeId.trim()) errors.cakeId = "Cake ID is required";
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      errors.quantity = "Quantity must be a valid positive number";
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveDraftOrder = async () => {
    if (!validateOrder()) return;

    if (!imageUri) {
      Alert.alert("Error", "Please upload an image");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("accessToken");
      const formData = new FormData();

      formData.append("userId", userId);
      formData.append("cakeId", cakeId);
      formData.append("quantity", quantity);
      formData.append("image", {
        uri: imageUri,
        name: "cake-image.jpg",
        type: "image/jpeg",
      } as any);

      const response = await axios.post(
        `${config.BASE_URL}/order/draft`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Alert.alert("Success", "Order saved as draft");
    } catch (error) {
      console.error("Failed to save draft order:", error);
      Alert.alert("Error", "Failed to save draft order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f3ea" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <Text style={styles.title}>Save Draft Order</Text>
            <TextInput
              style={[styles.input, errors.userId && styles.inputError]}
              placeholder="User ID"
              value={userId}
              onChangeText={setUserId}
            />
            {errors.userId && (
              <Text style={styles.errorText}>{errors.userId}</Text>
            )}
            <TextInput
              style={[styles.input, errors.cakeId && styles.inputError]}
              placeholder="Cake ID"
              value={cakeId}
              onChangeText={setCakeId}
            />
            {errors.cakeId && (
              <Text style={styles.errorText}>{errors.cakeId}</Text>
            )}
            <TextInput
              style={[styles.input, errors.quantity && styles.inputError]}
              placeholder="Quantity"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
            {errors.quantity && (
              <Text style={styles.errorText}>{errors.quantity}</Text>
            )}
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>Upload Image</Text>
            </TouchableOpacity>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            )}
            <Button
              title={loading ? "Saving..." : "Save Draft"}
              onPress={saveDraftOrder}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 20,
  },
  input: {
    height: 40,
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    alignSelf: "flex-start",
  },
  imageButton: {
    backgroundColor: "#6b4226",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
});
