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
import Header from "../../components/Header";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import config from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/AdminScreensStyles/AdminRecipeEditStyles";

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
    const [hours, setHours] = useState<string>('');
    const [minutes, setMinutes] = useState<string>('');

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

            // Parse making time into hours and minutes
            const makingTime = recipe.makingTime || '';
            const hoursMatch = makingTime.match(/(\d+)\s*[hH]/);
            const minutesMatch = makingTime.match(/(\d+)\s*[mM]/);

            setHours(hoursMatch ? hoursMatch[1] : '');
            setMinutes(minutesMatch ? minutesMatch[1] : '');

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

        // Validate making time
        const hoursNum = parseInt(hours);
        const minutesNum = parseInt(minutes);
        if ((hours && isNaN(hoursNum)) || (minutes && isNaN(minutesNum)) ||
            (hoursNum < 0) || (minutesNum < 0) || (minutesNum > 59)) {
            Alert.alert("Error", "Invalid time format. Hours must be positive, minutes must be between 0-59.");
            return;
        }

        setUploading(true);

        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You must be logged in");
                return;
            }

            // Format making time
            const makingTime = `${hours ? `${hours}H` : ''} ${minutes ? `${minutes}M` : ''}`.trim();

            // Process any pending raw text inputs before saving
            let finalRecipe = { ...editedRecipe, makingTime };

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
                <Header title="Recipe Details" showBack />
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
                <Header title="Edit Recipe" showBack />
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
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <TextInput
                                    style={[styles.input, { width: '45%' }]}
                                    value={hours}
                                    onChangeText={setHours}
                                    placeholder="Hours"
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={[styles.input, { width: '45%' }]}
                                    value={minutes}
                                    onChangeText={setMinutes}
                                    placeholder="Minutes"
                                    keyboardType="numeric"
                                />
                            </View>
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

