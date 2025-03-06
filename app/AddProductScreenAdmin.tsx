// AddProductScreenAdmin.tsx

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
import config from "../config";
import firebaseConfig, { storage } from '../firebaseConfig';

// ייבוא הקונפיגורציה
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// אתחול Firebase
const appFirebase = initializeApp(firebaseConfig);
const storage = getStorage(appFirebase);

export default function AddProductScreenAdmin() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
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
        try {
            let imageUrl = "";
            if (image) {
                // המרת התמונה מ-URI ל-Blob
                const response = await fetch(image);
                const blob = await response.blob();

                // יצירת reference ל-Firebase Storage עם שם ייחודי
                const fileName = image.split("/").pop();
                const storageRef = ref(storage, `cakes/${fileName}-${Date.now()}`);

                // העלאת ה-Blob ל-Firebase
                await uploadBytes(storageRef, blob);

                // קבלת ה-URL של התמונה שהועלתה
                imageUrl = await getDownloadURL(storageRef);
            }

            // הכנת נתוני המוצר לשליחה לשרת (כ-JSON)
            const productData = {
                name,
                description,
                price,
                // המרת מחרוזת המרכיבים למערך (בהנחה שהמרכיבים מופרדים בפסיק)
                ingredients: ingredients.split(",").map((item) => item.trim()),
                image: imageUrl,
            };

            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "Authorization token is required");
                return;
            }

            const responseBackend = await fetch(`${config.BASE_URL}/cakes`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(productData),
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
            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.submitButtonText}>
                    {loading ? "Adding..." : "Add Product"}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
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
    input: {
        borderWidth: 1,
        borderColor: "#6b4226",
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: "#fff",
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
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: "#6b4226",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

