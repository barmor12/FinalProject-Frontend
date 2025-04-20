import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Recipe {
    _id: string;
    name: string;
    description: string;
    servings: number;
    ingredients: { [key: string]: string };
    instructions: { [key: string]: string };
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    image: {
        url: string;
        public_id: string;
    };
}

// Extended interface for editing that includes raw text properties
interface EditableRecipe extends Partial<Recipe> {
    _rawIngredientsText?: string;
    _rawInstructionsText?: string;
}

export default function AdminRecipeEdit() {
    const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [editedRecipe, setEditedRecipe] = useState<EditableRecipe>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newImage, setNewImage] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (recipeId) {
            fetchRecipe(recipeId);
        }
    }, [recipeId]);

    useEffect(() => {
        if (recipe) {
            // Initialize raw text values from recipe data when it's loaded
            const ingredientsText = recipe.ingredients
                ? Object.entries(recipe.ingredients).map(([key, value]) => {
                    if (typeof value === 'string') {
                        return value;
                    } else if (value && typeof value === 'object') {
                        if ('name' in value) {
                            const amount = (value as any).amount ? `${(value as any).amount} ` : '';
                            const unit = (value as any).unit ? `${(value as any).unit} ` : '';
                            return `${amount}${unit}${(value as any).name}`;
                        }
                        return JSON.stringify(value);
                    }
                    return '';
                }).join('\n')
                : '';

            const instructionsText = recipe.instructions
                ? Object.entries(recipe.instructions).map(([key, value]) => {
                    if (typeof value === 'string') {
                        return value;
                    } else if (value && typeof value === 'object') {
                        if ('instruction' in value) {
                            return (value as any).instruction;
                        }
                        return JSON.stringify(value);
                    }
                    return '';
                }).join('\n')
                : '';

            setEditedRecipe({
                ...recipe,
                _rawIngredientsText: ingredientsText,
                _rawInstructionsText: instructionsText
            });
        }
    }, [recipe]);

    const fetchRecipe = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You must be logged in");
                router.replace("/");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/recipes/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    Alert.alert("Error", "Your session has expired. Please log in again.");
                    router.replace("/");
                    return;
                }
                throw new Error("Failed to fetch recipe");
            }

            const data = await response.json();
            console.log("Recipe data:", data);
            console.log("Ingredients:", data.ingredients);
            setRecipe(data);
            setEditedRecipe(data);
        } catch (error) {
            console.error("Error fetching recipe:", error);
            Alert.alert("Error", "Failed to fetch recipe");
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setNewImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const handleSave = async () => {
        if (!recipe) return;
        setUploading(true);

        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You must be logged in");
                return;
            }

            // Process any pending raw text inputs before saving
            let finalRecipe = { ...editedRecipe };

            // Process raw ingredients text if it exists
            if (editedRecipe._rawIngredientsText !== undefined) {
                const lines = editedRecipe._rawIngredientsText.split("\n");
                const ingredients: { [key: string]: string } = {};
                lines.forEach((line: string, index: number) => {
                    if (line.trim()) {
                        ingredients[`ingredient${index + 1}`] = line.trim();
                    }
                });
                finalRecipe = {
                    ...finalRecipe,
                    ingredients,
                    _rawIngredientsText: undefined
                };
            }

            // Process raw instructions text if it exists
            if (editedRecipe._rawInstructionsText !== undefined) {
                const lines = editedRecipe._rawInstructionsText.split("\n");
                const instructions: { [key: string]: string } = {};
                lines.forEach((line: string, index: number) => {
                    if (line.trim()) {
                        instructions[`step${index + 1}`] = line.trim();
                    }
                });
                finalRecipe = {
                    ...finalRecipe,
                    instructions,
                    _rawInstructionsText: undefined
                };
            }

            // Remove any temporary properties before sending to server
            const { _rawIngredientsText, _rawInstructionsText, ...sendData } = finalRecipe;

            console.log("Sending recipe data:", sendData);

            // Create FormData for multipart/form-data request if we have a new image
            // Otherwise, use JSON for a regular update
            if (newImage) {
                const formData = new FormData();
                formData.append("name", sendData.name || "");
                formData.append("description", sendData.description || "");
                formData.append("servings", String(sendData.servings || 0));

                // Ensure ingredients and instructions are properly stringified JSON objects
                if (sendData.ingredients) {
                    formData.append("ingredients", JSON.stringify(sendData.ingredients));
                }
                if (sendData.instructions) {
                    formData.append("instructions", JSON.stringify(sendData.instructions));
                }

                formData.append("difficulty", sendData.difficulty || "Easy");
                formData.append("makingTime", sendData.makingTime || "");
                formData.append("image", {
                    uri: newImage,
                    type: "image/jpeg",
                    name: "recipe.jpg",
                } as any);

                console.log("FormData ingredients:", JSON.stringify(sendData.ingredients));
                console.log("FormData instructions:", JSON.stringify(sendData.instructions));

                const response = await fetch(`${config.BASE_URL}/recipes/${recipe._id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        Alert.alert("Error", "Your session has expired. Please log in again.");
                        router.replace("/");
                        return;
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to update recipe");
                }
            } else {
                // Regular JSON update without changing the image
                console.log("JSON data ingredients:", JSON.stringify(sendData.ingredients));
                console.log("JSON data instructions:", JSON.stringify(sendData.instructions));

                const response = await fetch(`${config.BASE_URL}/recipes/${recipe._id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(sendData),
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        Alert.alert("Error", "Your session has expired. Please log in again.");
                        router.replace("/");
                        return;
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to update recipe");
                }
            }

            Alert.alert("Success", "Recipe updated successfully");
            setIsEditMode(false);
            fetchRecipe(recipe._id); // Refresh recipe data
        } catch (error) {
            console.error("Error updating recipe:", error);
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to update recipe");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6b4226" />
                    <Text style={styles.loadingText}>Loading recipe...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!recipe) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Recipe not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // View mode - display recipe details
    if (!isEditMode) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#6b4226" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Recipe Details</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.scrollView}>
                    <View style={styles.form}>
                        <Image
                            source={{ uri: recipe.image.url }}
                            style={styles.recipeImage}
                        />

                        <Text style={styles.recipeName}>{recipe.name}</Text>
                        <Text style={styles.recipeDescription}>{recipe.description}</Text>

                        <View style={styles.recipeMetaContainer}>
                            <View style={styles.recipeMetaItem}>
                                <Ionicons name="time-outline" size={20} color="#6b4226" />
                                <Text style={styles.recipeMetaText}>{recipe.makingTime}</Text>
                            </View>
                            <View style={styles.recipeMetaItem}>
                                <Ionicons name="flame-outline" size={20} color="#6b4226" />
                                <Text style={styles.recipeMetaText}>{recipe.difficulty}</Text>
                            </View>
                            <View style={styles.recipeMetaItem}>
                                <Ionicons name="people-outline" size={20} color="#6b4226" />
                                <Text style={styles.recipeMetaText}>{recipe.servings} servings</Text>
                            </View>
                        </View>

                        <View style={styles.recipeSection}>
                            <Text style={styles.recipeSectionTitle}>Ingredients</Text>
                            <View style={styles.recipeList}>
                                {recipe.ingredients && Object.keys(recipe.ingredients).length > 0 ? (
                                    Object.entries(recipe.ingredients).map(([key, value]) => {
                                        // Debug logging
                                        console.log(`Ingredient ${key}:`, value);

                                        // Handle different data formats
                                        let ingredientText = '';
                                        if (typeof value === 'string') {
                                            ingredientText = value;
                                        } else if (value && typeof value === 'object') {
                                            // Try to find the ingredient name in the object
                                            if ('name' in value) {
                                                const amount = (value as any).amount ? `${(value as any).amount} ` : '';
                                                const unit = (value as any).unit ? `${(value as any).unit} ` : '';
                                                ingredientText = `${amount}${unit}${(value as any).name}`;
                                            } else {
                                                // Fallback to stringifying the object
                                                ingredientText = JSON.stringify(value);
                                            }
                                        }

                                        return (
                                            <View key={key} style={styles.recipeListItem}>
                                                <View style={styles.recipeListItemDot} />
                                                <Text style={styles.recipeListItemText}>{ingredientText}</Text>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.noDataText}>No ingredients found</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.recipeSection}>
                            <Text style={styles.recipeSectionTitle}>Instructions</Text>
                            <View style={styles.recipeList}>
                                {recipe.instructions && Object.keys(recipe.instructions).length > 0 ? (
                                    Object.entries(recipe.instructions).map(([key, value]) => {
                                        // Debug logging
                                        console.log(`Instruction ${key}:`, value);

                                        // Handle different data formats
                                        let instructionText = '';
                                        let stepNumber = key.replace('step', '');

                                        if (typeof value === 'string') {
                                            instructionText = value;
                                        } else if (value && typeof value === 'object') {
                                            // Try to find the instruction text in the object
                                            if ('instruction' in value) {
                                                instructionText = (value as any).instruction;
                                                // If there's a step number in the object, use it
                                                if ('step' in value) {
                                                    stepNumber = String((value as any).step);
                                                }
                                            } else {
                                                // Fallback to stringifying the object
                                                instructionText = JSON.stringify(value);
                                            }
                                        }

                                        return (
                                            <View key={key} style={styles.recipeListItem}>
                                                <View style={styles.recipeListItemNumber}>
                                                    <Text style={styles.recipeListItemNumberText}>
                                                        {stepNumber}
                                                    </Text>
                                                </View>
                                                <Text style={styles.recipeListItemText}>{instructionText}</Text>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.noDataText}>No instructions found</Text>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => setIsEditMode(true)}
                        >
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.editButtonText}>Edit Recipe</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Edit mode - display form to edit recipe
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setIsEditMode(false)}
                    >
                        <Ionicons name="arrow-back" size={24} color="#6b4226" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Recipe</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.scrollView}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Recipe Image</Text>
                            <TouchableOpacity
                                style={styles.imagePicker}
                                onPress={pickImage}
                            >
                                {newImage ? (
                                    <Image
                                        source={{ uri: newImage }}
                                        style={styles.imagePreview}
                                    />
                                ) : recipe.image ? (
                                    <Image
                                        source={{ uri: recipe.image.url }}
                                        style={styles.imagePreview}
                                    />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="camera" size={40} color="#6b4226" />
                                        <Text style={styles.imagePlaceholderText}>
                                            Tap to change image
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editedRecipe.name}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, name: text })}
                                placeholder="Enter recipe name"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editedRecipe.description}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, description: text })}
                                placeholder="Enter recipe description"
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Servings</Text>
                            <TextInput
                                style={styles.input}
                                value={String(editedRecipe.servings || "")}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, servings: parseInt(text) || 0 })}
                                placeholder="Enter number of servings"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ingredients (one per line)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editedRecipe._rawIngredientsText || ''}
                                onChangeText={(text) => {
                                    setEditedRecipe({
                                        ...editedRecipe,
                                        _rawIngredientsText: text
                                    });
                                }}
                                placeholder="Enter ingredients, one per line"
                                multiline
                                blurOnSubmit={false}
                                returnKeyType="default"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Instructions (one per line)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editedRecipe._rawInstructionsText || ''}
                                onChangeText={(text) => {
                                    setEditedRecipe({
                                        ...editedRecipe,
                                        _rawInstructionsText: text
                                    });
                                }}
                                placeholder="Enter instructions, one per line"
                                multiline
                                blurOnSubmit={false}
                                returnKeyType="default"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Difficulty</Text>
                            <View style={styles.difficultyButtons}>
                                {["Easy", "Medium", "Hard"].map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.difficultyButton,
                                            editedRecipe.difficulty === level && styles.selectedDifficulty,
                                        ]}
                                        onPress={() => setEditedRecipe({ ...editedRecipe, difficulty: level as "Easy" | "Medium" | "Hard" })}
                                    >
                                        <Text style={[
                                            styles.difficultyText,
                                            editedRecipe.difficulty === level && styles.selectedDifficultyText,
                                        ]}>
                                            {level}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Making Time</Text>
                            <TextInput
                                style={styles.input}
                                value={editedRecipe.makingTime}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, makingTime: text })}
                                placeholder="e.g., 30m, 1h 30m"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={uploading}
                        >
                            <Text style={styles.saveButtonText}>
                                {uploading ? "Saving..." : "Save Changes"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setIsEditMode(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f3ea",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#6b4226",
    },
    errorText: {
        fontSize: 16,
        color: "#ff4444",
        marginBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    backButtonText: {
        color: "#6b4226",
        fontWeight: "bold",
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6b4226",
    },
    scrollView: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    // Recipe details styles
    recipeImage: {
        width: "100%",
        height: 250,
        borderRadius: 12,
        marginBottom: 20,
    },
    recipeName: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 10,
    },
    recipeDescription: {
        fontSize: 16,
        color: "#666",
        marginBottom: 20,
        lineHeight: 24,
    },
    recipeMetaContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 25,
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    recipeMetaItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    recipeMetaText: {
        fontSize: 14,
        color: "#6b4226",
        marginLeft: 5,
        fontWeight: "600",
    },
    recipeSection: {
        marginBottom: 25,
    },
    recipeSectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 15,
    },
    recipeList: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    recipeListItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    recipeListItemDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#6b4226",
        marginTop: 6,
        marginRight: 10,
    },
    recipeListItemNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#6b4226",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    recipeListItemNumberText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#fff",
    },
    recipeListItemText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
        lineHeight: 22,
    },
    editButton: {
        backgroundColor: "#6b4226",
        borderRadius: 10,
        padding: 15,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    editButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
    },
    // Edit form styles
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6b4226",
        marginBottom: 5,
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#6b4226",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    imagePicker: {
        width: "100%",
        height: 200,
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        overflow: "hidden",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    imagePlaceholderText: {
        marginTop: 10,
        color: "#6b4226",
        fontSize: 16,
    },
    difficultyButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 5,
    },
    difficultyButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#f9f3ea",
        marginHorizontal: 5,
        alignItems: "center",
    },
    selectedDifficulty: {
        backgroundColor: "#6b4226",
    },
    difficultyText: {
        color: "#6b4226",
        fontWeight: "600",
    },
    selectedDifficultyText: {
        color: "#fff",
    },
    saveButton: {
        backgroundColor: "#6b4226",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    saveButtonDisabled: {
        backgroundColor: "#a58c6f",
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    cancelButton: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#6b4226",
    },
    cancelButtonText: {
        color: "#6b4226",
        fontSize: 16,
        fontWeight: "600",
    },
    noDataText: {
        color: "#666",
        fontStyle: "italic",
        padding: 10,
        textAlign: "center",
    },
}); 