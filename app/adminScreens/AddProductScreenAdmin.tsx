import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import styles from "../styles/AdminScreensStyles/AddProductScreenAdminStyles";

export default function AddProductScreenAdmin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [stock, setStock] = useState("");
  const [allergens, setAllergens] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("יש צורך בהרשאות גישה לגלריה!");
      return;
    }

    setImageLoading(true);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as ImagePicker.MediaType[],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const pickedUri = result.assets[0].uri;
      setImage(pickedUri);
    }

    setImageLoading(false);
  };

  const handleSubmit = async () => {
    if (!name || !description || !cost || !price || !ingredients || !image) {
      Alert.alert("Error", "All fields including image are required");
      return;
    }

    const costValue = parseFloat(cost);
    const priceValue = parseFloat(price);

    if (isNaN(costValue) || isNaN(priceValue)) {
      Alert.alert("Error", "Cost and price must be valid numbers");
      return;
    }

    if (costValue >= priceValue) {
      Alert.alert("Error", "Price must be higher than cost");
      return;
    }

    setUploading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "Authorization token is required");
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("cost", cost);
      formData.append("price", price);
      formData.append("ingredients", ingredients);
      formData.append("stock", stock);
      formData.append("allergens", allergens);
      const imageName =
        image
          .split("/")
          .pop()
          ?.replace(/[^a-zA-Z0-9.-]/g, "_") || `image_${Date.now()}.jpg`;
      formData.append("image", {
        uri: image,
        name: imageName,
        type: "image/*",
      } as any);

      const responseBackend = await fetch(`${config.BASE_URL}/cakes/addcake`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!responseBackend.ok) {
        throw new Error("Failed to add product");
      }

      Alert.alert("Success", "Product added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.formItem}>
      {item === "image" && (
        <>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Text style={styles.imagePickerText}>📸 Tap here to choose a cake image</Text>
          </TouchableOpacity>
          {imageLoading ? (
            <ActivityIndicator
              size="large"
              color="#6b4226"
              style={{ marginBottom: 10 }}
            />
          ) : (
            image && (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            )
          )}
        </>
      )}
      {item === "submitButton" && (
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Product</Text>
          )}
        </TouchableOpacity>
      )}
      {item === "inputs" && (
        <>
          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.floatingLabel,
                name ? styles.floatingLabelActive : null,
              ]}
            >
              Name
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.floatingLabel,
                description ? styles.floatingLabelActive : null,
              ]}
            >
              Description
            </Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 32 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter a detailed description..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.floatingLabel,
                cost ? styles.floatingLabelActive : null,
              ]}
            >
              Cost
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={cost}
              onChangeText={setCost}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.floatingLabel,
                price ? styles.floatingLabelActive : null,
              ]}
            >
              Price
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              placeholderTextColor="#aaa"
            />
          </View>
          {cost && price && (
            <View style={styles.profitInfo}>
              <Text style={styles.profitText}>
                Profit per unit: ${(+price - +cost).toFixed(2)}
              </Text>
              <Text style={styles.profitText}>
                Profit margin: {(((+price - +cost) / +price) * 100).toFixed(1)}%
              </Text>
            </View>
          )}
          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.floatingLabel,
                ingredients ? styles.floatingLabelActive : null,
              ]}
            >
              Ingredients
            </Text>
            <TextInput
              style={styles.input}
              value={ingredients}
              onChangeText={setIngredients}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.floatingLabel,
                allergens ? styles.floatingLabelActive : null,
              ]}
            >
              Allergens
            </Text>
            <TextInput
              style={styles.input}
              value={allergens}
              onChangeText={setAllergens}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.floatingLabel,
                stock ? styles.floatingLabelActive : null,
              ]}
            >
              Stock
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
              placeholderTextColor="#aaa"
            />
          </View>
        </>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f3ea" }}>
        <View style={styles.container}>
          <Text style={styles.title}>Add New Product</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {renderItem({ item: "image" })}
            {renderItem({ item: "inputs" })}
            {renderItem({ item: "submitButton" })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
