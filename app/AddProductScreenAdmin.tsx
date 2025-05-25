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
import config from "../config";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";

export default function AddProductScreenAdmin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [stock, setStock] = useState("");
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
            <Text style={styles.imagePickerText}>Pick an image</Text>
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
            <Text style={[styles.floatingLabel, name ? styles.floatingLabelActive : null]}>
              Name
            </Text>
            <TextInput
              placeholder="Name"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.floatingLabel, description ? styles.floatingLabelActive : null]}>
              Description
            </Text>
            <TextInput
              placeholder="Description"
              style={styles.input}
              value={description}
              onChangeText={setDescription}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.floatingLabel, cost ? styles.floatingLabelActive : null]}>
              Cost
            </Text>
            <TextInput
              placeholder="Cost"
              style={styles.input}
              keyboardType="numeric"
              value={cost}
              onChangeText={setCost}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.floatingLabel, price ? styles.floatingLabelActive : null]}>
              Price
            </Text>
            <TextInput
              placeholder="Price"
              style={styles.input}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
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
            <Text style={[styles.floatingLabel, ingredients ? styles.floatingLabelActive : null]}>
              Ingredients
            </Text>
            <TextInput
              placeholder="Ingredients"
              style={styles.input}
              value={ingredients}
              onChangeText={setIngredients}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.floatingLabel, stock ? styles.floatingLabelActive : null]}>
              Stock
            </Text>
            <TextInput
              placeholder="Stock"
              style={styles.input}
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />
          </View>
        </>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Add New Product</Text>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {renderItem({ item: "inputs" })}
          {renderItem({ item: "image" })}
          {renderItem({ item: "submitButton" })}
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginBottom: 20,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  floatingLabel: {
    position: "absolute",
    left: 12,
    top: 14,
    fontSize: 14,
    color: "#aaa",
    zIndex: 1,
  },
  floatingLabelActive: {
    top: -8,
    fontSize: 12,
    color: "#6b4226",
    backgroundColor: "#f9f3ea",
    paddingHorizontal: 4,
    alignSelf: "flex-start",
    marginLeft: 8,
    zIndex: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#6b4226",
    padding: 10,
    paddingTop: 24,
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#6b4226",
    fontSize: 14,
    marginBottom: 10,
  },
  imagePicker: {
    backgroundColor: "#d49a6a",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  imagePickerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  imagePreview: {
    width: "100%",
    height: 410,
    borderRadius: 8,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#6b4226",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  formItem: {
    marginBottom: 20,
  },
  profitInfo: {
    backgroundColor: "#f9f3ea",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  profitText: {
    fontSize: 14,
    color: "#6b4226",
    marginVertical: 2,
  },
});
