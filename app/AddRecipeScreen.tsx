import React, { useState } from "react";
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
    Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";


interface Ingredient {
    name: string;
    amount: string;
    unit: string;
}

interface Instruction {
    step: number;
    instruction: string;
}

interface Recipe {
    name: string;
    description: string;
    servings: string;
    ingredients: Ingredient[];
    instructions: Instruction[];
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    image: string | null;
}

export default function AddRecipeScreen() {
    const [recipe, setRecipe] = useState<Recipe>({
        name: "",
        description: "",
        servings: "",
        ingredients: [],
        instructions: [],
        difficulty: "Easy",
        makingTime: "",
        image: null,
    });
    const [uploading, setUploading] = useState(false);
    const [hours, setHours] = useState<string>('');
    const [minutes, setMinutes] = useState<string>('');

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setRecipe({ ...recipe, image: result.assets[0].uri });
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const validateRecipe = () => {
        if (!recipe.image) {
            Alert.alert("Error", "Recipe image is required");
            return false;
        }

        const hoursNum = parseInt(hours);
        const minutesNum = parseInt(minutes);
        if (isNaN(hoursNum) || isNaN(minutesNum) || hoursNum < 0 || minutesNum < 0 || minutesNum > 59) {
            Alert.alert("Error", "Invalid time format");
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateRecipe()) return;
        setUploading(true);

        const makingTime = `${hours ? `${hours}H` : ''} ${minutes ? `${minutes}M` : ''}`.trim();

        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You must be logged in");
                return;
            }

            const formData = new FormData();
            formData.append("name", recipe.name);
            formData.append("description", recipe.description);
            formData.append("servings", recipe.servings);
            formData.append("ingredients", JSON.stringify(recipe.ingredients));
            formData.append("instructions", JSON.stringify(recipe.instructions));
            formData.append("difficulty", recipe.difficulty);
            formData.append("makingTime", makingTime);
            formData.append("image", {
                uri: recipe.image!,
                type: "image/jpeg",
                name: "recipe.jpg",
            } as any);
            console.log("name", recipe.name);
            console.log("description", recipe.description);
            console.log("servings", recipe.servings);
            console.log("ingredients", recipe.ingredients);
            console.log("instructions", recipe.instructions);
            console.log("difficulty", recipe.difficulty);
            console.log("makingTime", makingTime);
            const response = await fetch(`${config.BASE_URL}/recipes/newRecipe`, {
                method: "POST",
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                Alert.alert("Success", "Recipe added successfully");
                router.back();
            } else {
                const error = await response.json();
                throw new Error(error.error || "Failed to add recipe");
            }
        } catch (error) {
            console.error("Error:", error);
            Alert.alert("Error", error instanceof Error ? error.message : "Unknown error");
        } finally {
            setUploading(false);
        }
    };

    const handleIngredientsChange = (text: string) => {
        const lines = text.split("\n");
        const ingredientsArray: Ingredient[] = lines
            .map(line => {
                const parts = line.trim().split(" ");
                if (parts.length < 2) return null;
                const amount = parts[0];
                const name = parts.slice(1).join(" ");
                return { name, amount, unit: "unit" };
            })
            .filter(Boolean) as Ingredient[];

        setRecipe({ ...recipe, ingredients: ingredientsArray });
    };

    const handleInstructionsChange = (text: string) => {
        const lines = text.split("\n");
        const instructions: Instruction[] = lines
            .map((line, index) => ({ step: index + 1, instruction: line.trim() }))
            .filter(inst => inst.instruction !== "");

        setRecipe({ ...recipe, instructions });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#6b4226" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Add New Recipe</Text>
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
                                {recipe.image ? (
                                    <Image
                                        source={{ uri: recipe.image }}
                                        style={styles.imagePreview}
                                    />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="camera" size={40} color="#6b4226" />
                                        <Text style={styles.imagePlaceholderText}>
                                            Tap to add image
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={recipe.name}
                                onChangeText={(text) => setRecipe({ ...recipe, name: text })}
                                placeholder="Enter recipe name"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={recipe.description}
                                onChangeText={(text) => setRecipe({ ...recipe, description: text })}
                                placeholder="Enter recipe description"
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Servings</Text>
                            <TextInput
                                style={styles.input}
                                value={recipe.servings}
                                onChangeText={(text) => setRecipe({ ...recipe, servings: text })}
                                placeholder="Enter number of servings"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ingredients (one per line)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                onChangeText={handleIngredientsChange}
                                placeholder="Enter ingredients, one per line"
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Directions (one per line)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                onChangeText={handleInstructionsChange}
                                placeholder="Enter directions, one per line"
                                multiline
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
                                            recipe.difficulty === level && styles.selectedDifficulty,
                                        ]}
                                        onPress={() => setRecipe({ ...recipe, difficulty: level as "Easy" | "Medium" | "Hard" })}
                                    >
                                        <Text style={[
                                            styles.difficultyText,
                                            recipe.difficulty === level && styles.selectedDifficultyText,
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
                                {uploading ? "Uploading..." : "Add Recipe"}
                            </Text>
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
}); 