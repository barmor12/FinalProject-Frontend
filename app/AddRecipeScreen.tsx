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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AddRecipeScreen() {
    const [recipe, setRecipe] = useState({
        name: "",
        description: "",
        servings: "",
        ingredients: "",
        directions: "",
        difficulty: "Easy" as "Easy" | "Medium" | "Hard",
        makingTime: "",
        image: "",
    });

    const handleSave = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/recipes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...recipe,
                    servings: parseInt(recipe.servings),
                    ingredients: recipe.ingredients.split("\n").filter(Boolean),
                    directions: recipe.directions.split("\n").filter(Boolean),
                }),
            });

            if (response.ok) {
                Alert.alert("Success", "Recipe added successfully");
                router.back();
            } else {
                throw new Error("Failed to add recipe");
            }
        } catch (error) {
            console.error("Error adding recipe:", error);
            Alert.alert("Error", "Failed to add recipe");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
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
                            value={recipe.ingredients}
                            onChangeText={(text) => setRecipe({ ...recipe, ingredients: text })}
                            placeholder="Enter ingredients, one per line"
                            multiline
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Directions (one per line)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={recipe.directions}
                            onChangeText={(text) => setRecipe({ ...recipe, directions: text })}
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
                        <TextInput
                            style={styles.input}
                            value={recipe.makingTime}
                            onChangeText={(text) => setRecipe({ ...recipe, makingTime: text })}
                            placeholder="e.g., 30m, 1h 30m"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Image URL</Text>
                        <TextInput
                            style={styles.input}
                            value={recipe.image}
                            onChangeText={(text) => setRecipe({ ...recipe, image: text })}
                            placeholder="Enter image URL"
                        />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Add Recipe</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
}); 