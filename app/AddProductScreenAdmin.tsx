import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";

export default function AddProductScreenAdmin() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!name || !description || !price || !ingredients) {
            Alert.alert("Error", "All fields are required");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("ingredients", ingredients);

        if (image) {
            const fileName = image.split("/").pop();
            const fileType = fileName?.split(".").pop();
            formData.append("image", {
                uri: image,
                name: fileName,
                type: `image/${fileType}`,
            } as any);
        }

        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "Authorization token is required");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/cakes`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to add product");
            }

            Alert.alert("Success", "Product added successfully!", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error) {
            console.error("Error adding product:", error);
            Alert.alert("Error", "Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Add New Product</Text>
            <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
            />
            <TextInput
                style={styles.input}
                placeholder="Price"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
            />
            <TextInput
                style={styles.input}
                placeholder="Ingredients (comma-separated)"
                value={ingredients}
                onChangeText={setIngredients}
            />
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Text style={styles.imagePickerText}>Pick an image</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.submitButtonText}>{loading ? "Adding..." : "Add Product"}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f9f3ea" },
    title: { fontSize: 22, fontWeight: "bold", color: "#6b4226", textAlign: "center", marginBottom: 20 },
    input: { borderWidth: 1, borderColor: "#6b4226", padding: 10, borderRadius: 8, marginBottom: 10, backgroundColor: "#fff" },
    imagePicker: { backgroundColor: "#d49a6a", padding: 10, borderRadius: 8, alignItems: "center", marginBottom: 10 },
    imagePickerText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    imagePreview: { width: "100%", height: 200, borderRadius: 8, marginBottom: 10 },
    submitButton: { backgroundColor: "#6b4226", padding: 10, borderRadius: 8, alignItems: "center" },
    submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
