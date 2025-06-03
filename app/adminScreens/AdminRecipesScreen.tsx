import React, { useState, useEffect, useCallback } from "react";
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
import { router, useFocusEffect } from "expo-router";
import config from "../../config";
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

export default function AdminRecipesScreen() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedRecipe, setEditedRecipe] = useState<Partial<Recipe>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecipes();
    }, []);
    useFocusEffect(
        useCallback(() => {
            fetchRecipes();
        }, [])
    );
    const fetchRecipes = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You must be logged in");
                router.replace("/");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/recipes`, {
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
                throw new Error("Failed to fetch recipes");
            }

            const data = await response.json();
            setRecipes(data);
            console.log(data);
        } catch (error) {
            console.error("Error fetching recipes:", error);
            Alert.alert("Error", "Failed to fetch recipes");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (recipe: Recipe) => {
        router.push({
            pathname: "/adminScreens/AdminRecipeEdit",
            params: { recipeId: recipe._id }
        });
    };

    const handleSave = async () => {
        if (!selectedRecipe) return;

        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You must be logged in");
                router.replace("/");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/recipes/${selectedRecipe._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editedRecipe),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    Alert.alert("Error", "Your session has expired. Please log in again.");
                    router.replace("/");
                    return;
                }
                throw new Error("Failed to update recipe");
            }

            Alert.alert("Success", "Recipe updated successfully");
            fetchRecipes();
            setIsEditing(false);
            setSelectedRecipe(null);
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
                            const token = await AsyncStorage.getItem("accessToken");
                            if (!token) {
                                Alert.alert("Error", "You must be logged in");
                                router.replace("/");
                                return;
                            }

                            const response = await fetch(`${config.BASE_URL}/recipes/${recipeId}`, {
                                method: "DELETE",
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
                                throw new Error("Failed to delete recipe");
                            }

                            Alert.alert("Success", "Recipe deleted successfully");
                            fetchRecipes();
                        } catch (error) {
                            console.error("Error deleting recipe:", error);
                            Alert.alert("Error", "Failed to delete recipe");
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Loading recipes...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Recipes</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push("/adminScreens/AddRecipeScreen")}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.recipeGrid}>
                    {recipes.map((recipe) => (
                        <TouchableOpacity
                            key={recipe._id}
                            style={styles.recipeCard}
                            onPress={() => handleEdit(recipe)}
                        >
                            <Image source={{ uri: recipe.image.url }} style={styles.recipeImage} />

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
                    ))}
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
}); 