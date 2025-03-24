import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    View,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";

interface Product {
    _id: string;
    name: string;
    image: string;
    description: string;
    ingredients: string[];
    price: number;
    stock: string;
}

export default function ProductDetailsScreen() {
    const params = useLocalSearchParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProduct, setEditedProduct] = useState<Product | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (params.product) {
            try {
                const parsedProduct = JSON.parse(params.product as string);
                if (parsedProduct && parsedProduct._id) {
                    setProduct(parsedProduct);
                    setEditedProduct(parsedProduct);
                    console.log("🔗 Fixed image URL:", parsedProduct.stock);
                } else {
                    console.error("❌ Invalid product data received:", params.product);
                }
            } catch (error) {
                console.error("❌ Error parsing product:", error);
            }
        }
    }, [params.product]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setEditedProduct((prev) => prev && { ...prev, image: result.assets[0].uri });
        }
    };

    const handleSave = async () => {
        if (!editedProduct) return;

        // בדיקת מלאי - אם stock שווה ל־0, עדכון ל־0
        const finalStock = editedProduct.stock === "" ? "" : editedProduct.stock;

        // עדכון המוצר עם המלאי הנכון
        const updatedProduct = { ...editedProduct, stock: finalStock };

        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You need to be logged in to edit products.");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/cakes/${updatedProduct._id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedProduct),
            });

            if (!response.ok) {
                throw new Error("Failed to update product");
            }

            Alert.alert("Success", "Product updated successfully!");
            setProduct(updatedProduct); // עדכון המוצר המוצג
            setIsEditing(false); // סגירת מצב עריכה
        } catch (error) {
            console.error("❌ Error updating product:", error);
            Alert.alert("Error", "Failed to update product");
        }
    };




    if (!product) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.error}>Loading product details...</Text>
            </SafeAreaView>
        );
    }

    const handleDelete = async () => {
        if (!product) return;
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You need to be logged in to delete products.");
                return;
            }

            // מחיקת המוצר מהמסד נתונים
            const response = await fetch(`${config.BASE_URL}/inventory/${product._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Response:", data);

            Alert.alert("Success", "Product and image deleted successfully!");
            router.back(); // חזרה לדף הקודם אחרי מחיקה
        } catch (error) {
            console.error("❌ Error deleting product:", error);
            Alert.alert("Error", "Failed to delete product or image");
        }
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {isEditing ? (
                            <>
                                <Text>Name:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editedProduct?.name}
                                    onChangeText={(text) =>
                                        setEditedProduct((prev) => prev && { ...prev, name: text })
                                    }
                                />
                                <Text>Image URL:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editedProduct?.image}
                                    onChangeText={(text) =>
                                        setEditedProduct((prev) => prev && { ...prev, image: text })
                                    }
                                />
                                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                                    <Text style={styles.uploadButtonText}>Upload Image</Text>
                                </TouchableOpacity>

                                <Image
                                    source={{ uri: editedProduct?.image || "https://via.placeholder.com/200" }}
                                    style={styles.image}
                                />

                                <Text>Description:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editedProduct?.description}
                                    onChangeText={(text) =>
                                        setEditedProduct((prev) => prev && { ...prev, description: text })
                                    }
                                />

                                <Text>Price:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editedProduct?.price.toString()}
                                    keyboardType="numeric"
                                    onChangeText={(text) => {
                                        const parsedValue = parseFloat(text);
                                        setEditedProduct((prev) => prev && {
                                            ...prev,
                                            price: isNaN(parsedValue) ? 0 : parseFloat(parsedValue.toFixed(2))
                                        });
                                    }}
                                />
                                <Text>Stock:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editedProduct?.stock}
                                    onChangeText={(text) =>
                                        setEditedProduct((prev) => prev && { ...prev, stock: text })
                                    }
                                />


                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.title}>{product.name}</Text>
                                <Image
                                    source={{ uri: product.image || "https://via.placeholder.com/200" }}
                                    style={styles.image}
                                />
                                <Text style={styles.description}>{product.description}</Text>
                                <Text style={styles.price}>Price: ${product.price.toFixed(2)}</Text>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => setIsEditing(true)}
                                >
                                    <Text style={styles.editButtonText}>Edit Product</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={handleDelete}
                                >
                                    <Text style={styles.deleteButtonText}>Delete Product</Text>
                                </TouchableOpacity>

                            </>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9f3ea" },
    scrollContent: { padding: 16 },
    description: { fontSize: 16, color: "#6b4226", marginTop: 16, textAlign: "justify" },
    price: { fontSize: 18, fontWeight: "bold", color: "#6b4226", textAlign: "center" },
    deleteButton: {
        backgroundColor: "#d9534f",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    deleteButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    title: { fontSize: 24, fontWeight: "bold", color: "#6b4226", textAlign: "center", padding: 10, marginBottom: 5 },
    image: { width: "100%", height: 450, borderRadius: 10 },
    input: { borderWidth: 1, borderColor: "#6b4226", padding: 8, borderRadius: 5, marginVertical: 8 },
    uploadButton: { backgroundColor: "#6b4226", padding: 10, borderRadius: 8, alignItems: "center", marginVertical: 10 },
    uploadButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    editButton: { backgroundColor: "#6b4226", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 10 },
    editButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    saveButton: { backgroundColor: "#4caf50", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 10 },
    saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    error: { fontSize: 18, color: "red", textAlign: "center", marginTop: 20 },
});
