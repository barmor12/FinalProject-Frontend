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
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import config from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/AdminScreensStyles/AdminRecipesScreenStyles";
import BackButton from "../../components/BackButton";
import { useRouter } from "expo-router";
import Header from "../../components/Header";

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
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedRecipe, setEditedRecipe] = useState<Partial<Recipe>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchRecipes();
        setRefreshing(false);
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
        <SafeAreaView style={[styles.container, { paddingTop: 70 }]}>
            <Header title="Manage Recipes"  />

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
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
