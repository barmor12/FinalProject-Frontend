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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import config from "../config";

interface Recipe {
    _id: string;
    name: string;
    description: string;
    servings: number;
    ingredients: string[];
    directions: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string;
    image: string;
}

export default function AdminRecipesScreen() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedRecipe, setEditedRecipe] = useState<Partial<Recipe>>({});

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            const response = await fetch(`${config.BASE_URL}/recipes`);
            const data = await response.json();
            setRecipes(data);
        } catch (error) {
            console.error("Error fetching recipes:", error);
            Alert.alert("Error", "Failed to fetch recipes");
        }
    };

    const handleEdit = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setEditedRecipe(recipe);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedRecipe) return;

        try {
            const response = await fetch(`${config.BASE_URL}/recipes/${selectedRecipe._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editedRecipe),
            });

            if (response.ok) {
                Alert.alert("Success", "Recipe updated successfully");
                fetchRecipes();
                setIsEditing(false);
                setSelectedRecipe(null);
            } else {
                throw new Error("Failed to update recipe");
            }
        } catch (error) {
            console.error("Error updating recipe:", error);
            Alert.alert("Error", "Failed to update recipe");
        }
    };

    const handleDelete = async (recipeId: string) => {
        Alert.alert(
            "Delete Recipe",
            "Are you sure you want to delete this recipe?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${config.BASE_URL}/recipes/${recipeId}`, {
                                method: "DELETE",
                            });

                            if (response.ok) {
                                Alert.alert("Success", "Recipe deleted successfully");
                                fetchRecipes();
                            } else {
                                throw new Error("Failed to delete recipe");
                            }
                        } catch (error) {
                            console.error("Error deleting recipe:", error);
                            Alert.alert("Error", "Failed to delete recipe");
                        }
                    },
                },
            ]
        );
    };

    const renderRecipeCard = (recipe: Recipe) => (
        <TouchableOpacity
            key={recipe._id}
            style={styles.recipeCard}
            onPress={() => handleEdit(recipe)}
        >
            <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
            <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle}>{recipe.name}</Text>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                    {recipe.description}
                </Text>
                <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color="#6b4226" />
                        <Text style={styles.metaText}>{recipe.makingTime}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="flame-outline" size={16} color="#6b4226" />
                        <Text style={styles.metaText}>{recipe.difficulty}</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(recipe._id)}
            >
                <Ionicons name="trash-outline" size={24} color="#ff4444" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderEditModal = () => {
        if (!selectedRecipe || !isEditing) return null;

        return (
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            setIsEditing(false);
                            setSelectedRecipe(null);
                        }}
                    >
                        <Ionicons name="close" size={24} color="#6b4226" />
                    </TouchableOpacity>
                    <ScrollView style={styles.modalScrollView}>
                        <Text style={styles.modalTitle}>Edit Recipe</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editedRecipe.name}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, name: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editedRecipe.description}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, description: text })}
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Servings</Text>
                            <TextInput
                                style={styles.input}
                                value={editedRecipe.servings?.toString()}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, servings: parseInt(text) })}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ingredients (one per line)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editedRecipe.ingredients?.join("\n")}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, ingredients: text.split("\n") })}
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Directions (one per line)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editedRecipe.directions?.join("\n")}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, directions: text.split("\n") })}
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Image URL</Text>
                            <TextInput
                                style={styles.input}
                                value={editedRecipe.image}
                                onChangeText={(text) => setEditedRecipe({ ...editedRecipe, image: text })}
                                placeholder="Enter image URL"
                            />
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Recipes</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push("/AddRecipeScreen")}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.recipeGrid}>
                    {recipes.map(renderRecipeCard)}
                </View>
            </ScrollView>

            {renderEditModal()}
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
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6b4226",
    },
    addButton: {
        backgroundColor: "#6b4226",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
        padding: 10,
    },
    recipeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    recipeCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 15,
        marginBottom: 15,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recipeImage: {
        width: "100%",
        height: 150,
    },
    recipeInfo: {
        padding: 12,
    },
    recipeTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 4,
    },
    recipeDescription: {
        fontSize: 12,
        color: "#666",
        marginBottom: 8,
    },
    recipeMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    metaText: {
        fontSize: 12,
        color: "#6b4226",
        marginLeft: 4,
    },
    deleteButton: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 20,
        maxHeight: "90%",
        padding: 20,
    },
    modalScrollView: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 20,
        textAlign: "center",
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
        backgroundColor: "#f9f3ea",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#6b4226",
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
    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
}); 