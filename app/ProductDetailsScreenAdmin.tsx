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
    image: string | { url: string;[key: string]: any };
    description: string;
    ingredients: string[];
    price: number;
    cost: number;
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

        // Validate cost and price
        if (editedProduct.cost >= editedProduct.price) {
            Alert.alert("Error", "Price must be higher than cost");
            return;
        }

        // Check if stock is valid 
        const finalStock = editedProduct.stock === "" ? "" : editedProduct.stock;

        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You need to be logged in to edit products.");
                return;
            }

            // Check if image was changed (if it's a local URI)
            const isNewImage = editedProduct.image && editedProduct.image.startsWith('file:');

            // Use FormData for multipart/form-data when uploading files
            const formData = new FormData();

            // Add all product data to form
            formData.append('name', editedProduct.name);
            formData.append('description', editedProduct.description);
            formData.append('price', editedProduct.price.toString());
            formData.append('cost', editedProduct.cost.toString());
            formData.append('stock', finalStock);

            // Add ingredients array if it exists
            if (editedProduct.ingredients && editedProduct.ingredients.length > 0) {
                editedProduct.ingredients.forEach((ingredient, index) => {
                    formData.append(`ingredients[${index}]`, ingredient);
                });
            }

            // Add image file if it's a new image
            if (isNewImage) {
                // Get filename from URI
                const filename = editedProduct.image.split('/').pop() || 'image.jpg';
                // Infer mime type
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('image', {
                    uri: editedProduct.image,
                    name: filename,
                    type
                } as any);

                console.log('Uploading new image:', filename);
            }

            const response = await fetch(`${config.BASE_URL}/cakes/${editedProduct._id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Don't set Content-Type when using FormData, it will be set automatically including boundary
                    ...(isNewImage ? {} : { "Content-Type": "application/json" })
                },
                body: isNewImage ? formData : JSON.stringify({
                    name: editedProduct.name,
                    description: editedProduct.description,
                    price: editedProduct.price,
                    cost: editedProduct.cost,
                    stock: finalStock,
                    ingredients: editedProduct.ingredients
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error(`Failed to update product: ${errorText}`);
            }

            const updatedProduct = await response.json();
            console.log("Updated product received:", updatedProduct);

            // Update all product state with the response from the server
            // This ensures we get the new Cloudinary image URL 
            setProduct(updatedProduct);
            setEditedProduct(updatedProduct);

            // Force image reload by updating the state with a cache-busting parameter
            if (updatedProduct.image && updatedProduct.image.url) {
                const cacheBuster = `?t=${new Date().getTime()}`;
                const imageWithCacheBuster = {
                    ...updatedProduct,
                    image: typeof updatedProduct.image === 'string'
                        ? `${updatedProduct.image}${cacheBuster}`
                        : {
                            ...updatedProduct.image,
                            url: `${updatedProduct.image.url}${cacheBuster}`
                        }
                };
                setProduct(imageWithCacheBuster);
            }

            Alert.alert("Success", "Product updated successfully!");
            setIsEditing(false);
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
                            <View style={styles.editContainer}>
                                <Text style={styles.editLabel}>Product Name</Text>
                                <TextInput
                                    style={styles.editInput}
                                    value={editedProduct?.name}
                                    onChangeText={(text) =>
                                        setEditedProduct((prev) => prev && { ...prev, name: text })
                                    }
                                />

                                <Text style={styles.editLabel}>Product Image</Text>
                                <View style={styles.editImageContainer}>
                                    <Image
                                        source={{ uri: typeof editedProduct?.image === 'object' && editedProduct?.image?.url ? editedProduct.image.url : (editedProduct?.image as string) || "https://via.placeholder.com/200" }}
                                        style={styles.editImage}
                                    />
                                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                                        <Text style={styles.uploadButtonText}>Upload New Image</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.editLabel}>Description</Text>
                                <TextInput
                                    style={styles.editDescriptionInput}
                                    value={editedProduct?.description}
                                    onChangeText={(text) =>
                                        setEditedProduct((prev) => prev && { ...prev, description: text })
                                    }
                                    multiline
                                />

                                <Text style={styles.editLabel}>Cost</Text>
                                <TextInput
                                    style={styles.editInput}
                                    value={editedProduct?.cost?.toString()}
                                    keyboardType="numeric"
                                    onChangeText={(text) => {
                                        const parsedValue = parseFloat(text);
                                        setEditedProduct((prev) => prev && {
                                            ...prev,
                                            cost: isNaN(parsedValue) ? 0 : parseFloat(parsedValue.toFixed(2))
                                        });
                                    }}
                                />

                                <Text style={styles.editLabel}>Price</Text>
                                <TextInput
                                    style={styles.editInput}
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

                                <Text style={styles.editLabel}>Stock</Text>
                                <TextInput
                                    style={styles.editInput}
                                    value={editedProduct?.stock?.toString() || ""}
                                    onChangeText={(text) =>
                                        setEditedProduct((prev) => prev && { ...prev, stock: text })
                                    }
                                    keyboardType="numeric"
                                    placeholder="Enter stock quantity"
                                />

                                <View style={styles.editButtonContainer}>
                                    <TouchableOpacity
                                        style={styles.editSaveButton}
                                        onPress={handleSave}
                                    >
                                        <Text style={styles.editButtonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.editCancelButton}
                                        onPress={() => setIsEditing(false)}
                                    >
                                        <Text style={styles.editButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.viewContainer}>
                                <Image
                                    source={{ uri: typeof product.image === 'object' && product.image?.url ? product.image.url : (product.image as string) || "https://via.placeholder.com/200" }}
                                    style={styles.productImage}
                                    key={`product-image-${typeof product.image === 'object' && product.image?.url ? product.image.url : product.image || ""}`}
                                />

                                <View style={styles.contentContainer}>
                                    <Text style={styles.productTitle}>{product.name}</Text>

                                    <View style={styles.priceTag}>
                                        <Text style={styles.priceText}>${product.price.toFixed(2)}</Text>
                                    </View>

                                    <View style={styles.profitContainer}>
                                        <View style={styles.profitItem}>
                                            <Text style={styles.profitLabel}>Cost</Text>
                                            <Text style={styles.profitValue}>${product.cost?.toFixed(2) || '0.00'}</Text>
                                        </View>
                                        <View style={styles.profitItem}>
                                            <Text style={styles.profitLabel}>Profit</Text>
                                            <Text style={styles.profitValue}>${((product.price - (product.cost || 0))).toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.profitItem}>
                                            <Text style={styles.profitLabel}>Stock</Text>
                                            <Text style={[
                                                styles.profitValue,
                                                {
                                                    color: product.stock === "0" || (parseInt(product.stock) > 0 && parseInt(product.stock) < 5)
                                                        ? '#d9534f'  // Red for out of stock or low stock (< 5)
                                                        : product.stock === ""
                                                            ? '#f0ad4e'  // Orange for undefined stock
                                                            : '#28a745'  // Green for in stock
                                                }
                                            ]}>
                                                {product.stock === ""
                                                    ? "N/A"
                                                    : parseInt(product.stock) > 0 && parseInt(product.stock) < 5
                                                        ? `${product.stock} (Low)`
                                                        : product.stock
                                                }
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.sectionTitle}>Description</Text>
                                    <Text style={styles.descriptionText}>{product.description}</Text>

                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => setIsEditing(true)}
                                        >
                                            <Text style={styles.buttonText}>Edit Product</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={handleDelete}
                                        >
                                            <Text style={styles.buttonText}>Delete Product</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
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
    editContainer: {
        backgroundColor: '#f5e9d9',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e8d5c4',
    },
    editLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b4226',
        marginBottom: 8,
        marginTop: 15,
    },
    editInput: {
        borderWidth: 1,
        borderColor: '#e8d5c4',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 5,
    },
    editDescriptionInput: {
        height: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e8d5c4',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 5,
    },
    editImageContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    editImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 10,
    },
    editButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    editSaveButton: {
        flex: 1,
        backgroundColor: '#4caf50',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginRight: 10,
    },
    editCancelButton: {
        flex: 1,
        backgroundColor: '#6b4226',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginLeft: 10,
    },
    viewContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 0,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: 300,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    contentContainer: {
        padding: 20,
    },
    productTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#6b4226',
        marginBottom: 15,
        textTransform: 'capitalize',
    },
    priceTag: {
        backgroundColor: '#6b4226',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    priceText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b4226',
        marginBottom: 10,
        marginTop: 15,
    },
    descriptionText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    profitContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: '#f9f3ea',
        borderRadius: 12,
        padding: 15,
        flexWrap: 'wrap',
    },
    profitItem: {
        alignItems: 'center',
        minWidth: '30%',
    },
    profitLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    profitValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b4226',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
