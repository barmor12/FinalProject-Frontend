import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    StyleSheet,
    ActivityIndicator,
    Image,
    Keyboard,
    TouchableWithoutFeedback,
    SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

export default function AddProductScreenAdmin() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [stock, setStock] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // בוחן גישה לגלריה ומבצע את העלאת התמונה
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("יש צורך בהרשאות גישה לגלריה!");
            return;
        }

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

    // הגיש את הנתונים לשרת ויוצרים את המוצר
    const handleSubmit = async () => {
        if (!name || !description || !price || !ingredients || !image) {
            Alert.alert("Error", "All fields including image are required");
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
            formData.append("price", price);
            formData.append("ingredients", ingredients);
            formData.append("image", {
                uri: image,
                name: image.split("/").pop(),
                type: "image/jpeg",
            } as any);
            formData.append("stock", stock);

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

    // הסתרת המקלדת כאשר לוחצים מחוץ לשדות הקלט
    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    // הצגת שדות טופס לפי הצורך
    const renderItem = ({ item }: { item: string }) => (
        <View style={styles.formItem}>
            {item === "image" && (
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    <Text style={styles.imagePickerText}>Pick an image</Text>
                </TouchableOpacity>
            )}
            {item === "image" && image && <Image source={{ uri: image }} style={styles.imagePreview} />}
            {item === "submitButton" && (
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={uploading}>
                    {uploading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Add Product</Text>
                    )}
                </TouchableOpacity>
            )}
            {item === "inputs" && (
                <>
                    <TextInput
                        placeholder="Name"
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        placeholder="Description"
                        style={styles.input}
                        value={description}
                        onChangeText={setDescription}
                    />
                    <TextInput
                        placeholder="Price"
                        style={styles.input}
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                    />
                    <TextInput
                        placeholder="Ingredients (comma-separated)"
                        style={styles.input}
                        value={ingredients}
                        onChangeText={setIngredients}
                    />
                    <TextInput
                        placeholder="How much in stock?"
                        style={styles.input}
                        keyboardType="numeric"
                        value={stock}
                        onChangeText={setStock}
                    />
                </>
            )}
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Add New Product</Text>
                <FlatList
                    data={["inputs", "image", "submitButton"]}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item + index}
                    contentContainerStyle={{ flexGrow: 1 }}
                />
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
});
