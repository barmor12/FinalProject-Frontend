import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    TextInput,
    ActivityIndicator,
    Alert,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";
import { useFocusEffect } from '@react-navigation/native';
import styles from "../styles/RecipeScreenStyles";

interface Recipe {
    _id: string;  // Changed from id to _id to match API response
    name: string; // Changed from title to name to match API response
    description: string;
    image: {
        url: string; // Changed from image string to image.url to match API response
    };
    difficulty: "Easy" | "Medium" | "Hard";
    makingTime: string; // Changed from time to makingTime to match API response
    ingredients: { [key: string]: string }; // Changed from string[] to match API response
    instructions: { [key: string]: string }; // Changed from string[] to match API response
    likes?: number;
    isLiked?: boolean;
    createdAt?: string; // Date when the recipe was created
}

export default function RecipeScreen() {
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [likedRecipes, setLikedRecipes] = useState<string[]>([]);

    // Simple focus effect that reloads everything when the screen is focused
    useFocusEffect(
        React.useCallback(() => {
            // Reset loading state
            setLoading(true);

            // Close search bar when returning to screen
            setSearchVisible(false);
            setSearchText("");

            // Load liked recipes and fetch recipes
            const loadInitialData = async () => {
                try {
                    // Load liked recipes from storage
                    const storedLikedRecipes = await AsyncStorage.getItem('likedRecipes');
                    if (storedLikedRecipes) {
                        setLikedRecipes(JSON.parse(storedLikedRecipes));
                    }

                    // Fetch recipes
                    await fetchRecipes();
                } catch (error) {
                    console.error('Error loading initial data:', error);
                }
            };

            loadInitialData();

            return () => {
                // Clean up if needed
            };
        }, [])
    );

    // Function to fetch recipes from API
    const fetchRecipes = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get auth token
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                setError("You need to be logged in to view recipes");
                setLoading(false);
                return;
            }

            // Fetch recipes from API
            const response = await fetch(`${config.BASE_URL}/recipes`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch recipes");
            }

            const data = await response.json();

            // Combine API data with local liked state
            const recipesWithLikedState = data.map((recipe: Recipe) => ({
                ...recipe,
                isLiked: likedRecipes.includes(recipe._id)
            }));

            setRecipes(recipesWithLikedState);
            setFilteredRecipes(recipesWithLikedState);
        } catch (error: any) {
            console.error("Error fetching recipes:", error.message);
            setError(error.message || "An error occurred while fetching recipes");
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch a single recipe by ID
    const fetchRecipeById = async (recipeId: string) => {
        try {
            // Get auth token
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You need to be logged in to view recipe details");
                return;
            }

            // Fetch recipe details from API
            const response = await fetch(`${config.BASE_URL}/recipes/${recipeId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch recipe details");
            }

            const recipeData = await response.json();
            setSelectedRecipe(recipeData);
        } catch (error: any) {
            console.error("Error fetching recipe details:", error.message);
            Alert.alert("Error", error.message || "Failed to load recipe details");
        }
    };

    const handleSearch = (text: string) => {
        setSearchText(text);
        if (text.trim() === "") {
            setFilteredRecipes(recipes);
        } else {
            const searched = recipes.filter((recipe) => {
                // Check recipe name
                const nameMatch = recipe.name?.toLowerCase().includes(text.toLowerCase()) || false;

                // Check recipe description
                const descriptionMatch = recipe.description?.toLowerCase().includes(text.toLowerCase()) || false;

                // Check recipe ingredients - with proper type and null checks
                let ingredientsMatch = false;
                if (recipe.ingredients) {
                    // Check if ingredients is an array or an object and handle accordingly
                    if (Array.isArray(recipe.ingredients)) {
                        ingredientsMatch = recipe.ingredients.some(ingredient =>
                            ingredient && typeof ingredient === 'string' &&
                            ingredient.toLowerCase().includes(text.toLowerCase())
                        );
                    } else if (typeof recipe.ingredients === 'object') {
                        // For object format, check each value
                        ingredientsMatch = Object.values(recipe.ingredients).some(ingredient =>
                            ingredient && typeof ingredient === 'string' &&
                            ingredient.toLowerCase().includes(text.toLowerCase())
                        );
                    }
                }

                return nameMatch || descriptionMatch || ingredientsMatch;
            });
            setFilteredRecipes(searched);
        }
    };

    const clearSearch = () => {
        setSearchText("");
        setFilteredRecipes(recipes);
    };

    const toggleSearch = () => {
        setSearchVisible((prev) => {
            if (!prev) setSearchText("");
            return !prev;
        });
    };

    // Function to update local storage with liked recipes
    const updateLikedRecipesStorage = async (newLikedRecipes: string[]) => {
        try {
            await AsyncStorage.setItem('likedRecipes', JSON.stringify(newLikedRecipes));
        } catch (error) {
            console.error('Error saving liked recipes:', error);
        }
    };

    const handleLike = async (recipe: Recipe, isDetailView: boolean = false) => {
        try {
            // Get auth token
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You need to be logged in to like recipes");
                return;
            }

            // Check if recipe is already liked - default to false if undefined
            const isAlreadyLiked = likedRecipes.includes(recipe._id);

            const endpoint = isAlreadyLiked
                ? `${config.BASE_URL}/recipes/${recipe._id}/unlike`
                : `${config.BASE_URL}/recipes/${recipe._id}/like`;

            // Call API to like/unlike recipe
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${isAlreadyLiked ? 'unlike' : 'like'} recipe`);
            }

            // Update local liked recipes state
            let newLikedRecipes;
            if (isAlreadyLiked) {
                newLikedRecipes = likedRecipes.filter(id => id !== recipe._id);
            } else {
                newLikedRecipes = [...likedRecipes, recipe._id];
            }

            setLikedRecipes(newLikedRecipes);
            updateLikedRecipesStorage(newLikedRecipes);

            // Update UI
            const updatedRecipes = filteredRecipes.map(r =>
                r._id === recipe._id
                    ? {
                        ...r,
                        isLiked: !isAlreadyLiked,
                        likes: isAlreadyLiked ? (r.likes || 1) - 1 : (r.likes || 0) + 1
                    }
                    : r
            );

            setFilteredRecipes(updatedRecipes);
            setRecipes(recipes.map(r =>
                r._id === recipe._id
                    ? {
                        ...r,
                        isLiked: !isAlreadyLiked,
                        likes: isAlreadyLiked ? (r.likes || 1) - 1 : (r.likes || 0) + 1
                    }
                    : r
            ));

            // Update selected recipe if in detail view
            if (isDetailView && selectedRecipe && selectedRecipe._id === recipe._id) {
                setSelectedRecipe({
                    ...selectedRecipe,
                    isLiked: !isAlreadyLiked,
                    likes: isAlreadyLiked ? (selectedRecipe.likes || 1) - 1 : (selectedRecipe.likes || 0) + 1
                });
            }
        } catch (error: any) {
            console.error("Error liking/unliking recipe:", error.message);
            Alert.alert("Error", error.message || "Failed to update like status");
        }
    };

    const renderRecipeCard = ({ item }: { item: Recipe }) => {
        // Safety check for completely invalid item
        if (!item || !item._id) {
            return null;
        }

        // Check if recipe is new (less than 2 days old)
        const isNew = item.createdAt ?
            (new Date().getTime() - new Date(item.createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000
            : false;

        return (
            <TouchableOpacity
                style={styles.recipeCard}
                onPress={() => fetchRecipeById(item._id)}
            >
                <Image
                    source={{ uri: item.image?.url || 'https://via.placeholder.com/150' }}
                    style={styles.recipeImage}
                />
                {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
                <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle}>{item.name || 'Unnamed Recipe'}</Text>
                    <Text style={styles.recipeDescription} numberOfLines={2}>
                        {item.description || 'No description available'}
                    </Text>

                    {/* First row of metadata - time and difficulty */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={12} color="#6b4226" />
                            <Text style={styles.metaText}>{item.makingTime || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="flame-outline" size={12} color="#6b4226" />
                            <Text style={styles.metaText}>{item.difficulty || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* Second row - likes */}
                    <TouchableOpacity
                        style={styles.likeButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleLike(item);
                        }}
                    >
                        <Ionicons
                            name={likedRecipes.includes(item._id) ? "heart" : "heart-outline"}
                            size={12}
                            color={likedRecipes.includes(item._id) ? "#ff4d6d" : "#6b4226"}
                        />
                        <Text style={styles.likeCount}>{item.likes || 0} likes</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // Function to safely convert object or array of ingredients/instructions into displayable array
    const objectToArray = (data: any) => {
        if (!data) return [];

        // If it's already an array, return it (with filter for nulls/undefined)
        if (Array.isArray(data)) {
            return data.filter(item => item !== null && item !== undefined);
        }

        // If it's an object with step/instruction properties
        if (typeof data === 'object') {
            try {
                // Case 1: Array of objects with step/instruction fields
                if (Array.isArray(Object.values(data)[0]) ||
                    (Object.values(data)[0] && typeof Object.values(data)[0] === 'object')) {
                    return Object.values(data).map(item => {
                        if (typeof item === 'object' && item !== null) {
                            // Handle case where item is {step, instruction} format
                            if ('instruction' in item) return item.instruction;
                            if ('text' in item) return item.text;
                            if ('name' in item) return item.name;
                            // Return first string property if instruction or text not found
                            const firstStringVal = Object.values(item).find(v => typeof v === 'string');
                            return firstStringVal || JSON.stringify(item);
                        }
                        return item ? String(item) : '';
                    }).filter(item => item !== null && item !== undefined && item !== '');
                }

                // Case 2: Plain object with key-value pairs
                return Object.values(data).filter(item => item !== null && item !== undefined)
                    .map(item => typeof item === 'string' ? item : String(item));
            } catch (error) {
                console.error('Error processing data in objectToArray:', error);
                return [];
            }
        }

        // Fallback - convert to string
        return data ? [String(data)] : [];
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Recipe Book</Text>
                    <View style={styles.rightHeader}>
                        {searchVisible && (
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={18} color="#6b4226" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search recipes..."
                                    placeholderTextColor="#b39981"
                                    value={searchText}
                                    onChangeText={handleSearch}
                                    autoFocus
                                />
                                {searchText && (
                                    <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                                        <Ionicons name="close-circle" size={18} color="#6b4226" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        <TouchableOpacity onPress={toggleSearch} style={styles.searchButton}>
                            <Ionicons name={searchVisible ? "close" : "search"} size={22} color="#6b4226" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6b4226" />
                    <Text style={styles.loadingText}>Loading recipes...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#ff4d6d" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchRecipes}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredRecipes}
                    renderItem={renderRecipeCard}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.recipeGrid}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="restaurant-outline" size={48} color="#6b4226" />
                            <Text style={styles.emptyText}>
                                {searchText ? "No recipes match your search" : "No recipes available"}
                            </Text>
                        </View>
                    }
                />
            )}

            {selectedRecipe && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedRecipe(null)}
                        >
                            <Ionicons name="close" size={24} color="#6b4226" />
                        </TouchableOpacity>
                        <ScrollView>
                            <View style={styles.modalImageContainer}>
                                <Image
                                    source={{ uri: selectedRecipe.image?.url || 'https://via.placeholder.com/250' }}
                                    style={styles.modalImage}
                                />
                                {selectedRecipe.createdAt &&
                                    (new Date().getTime() - new Date(selectedRecipe.createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000 && (
                                        <View style={styles.modalNewBadge}>
                                            <Text style={styles.modalNewBadgeText}>NEW</Text>
                                        </View>
                                    )}
                            </View>
                            <View style={styles.modalTextContent}>
                                <View style={styles.modalTitleRow}>
                                    <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
                                    <TouchableOpacity
                                        style={styles.modalLikeButton}
                                        onPress={() => handleLike(selectedRecipe, true)}
                                    >
                                        <Ionicons
                                            name={selectedRecipe && likedRecipes.includes(selectedRecipe._id) ? "heart" : "heart-outline"}
                                            size={24}
                                            color={selectedRecipe && likedRecipes.includes(selectedRecipe._id) ? "#ff4d6d" : "#6b4226"}
                                        />
                                        <Text style={styles.modalLikeCount}>{selectedRecipe.likes || 0}</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.modalDescription}>
                                    {selectedRecipe.description}
                                </Text>
                                <View style={styles.modalMeta}>
                                    <View style={styles.metaItem}>
                                        <View style={styles.metaBackground}>
                                            <Ionicons name="time-outline" size={20} color="#6b4226" />
                                            <Text style={styles.modalMetaText}>{selectedRecipe.makingTime}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <View style={styles.metaBackground}>
                                            <Ionicons name="flame-outline" size={20} color="#6b4226" />
                                            <Text style={styles.modalMetaText}>{selectedRecipe.difficulty}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Ingredients</Text>
                                    {objectToArray(selectedRecipe.ingredients).map((ingredient, index) => (
                                        <Text key={index} style={styles.ingredient}>
                                            • {typeof ingredient === 'object' ?
                                                (ingredient.name || ingredient.ingredient || JSON.stringify(ingredient)) :
                                                ingredient}
                                        </Text>
                                    ))}
                                </View>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Instructions</Text>
                                    {objectToArray(selectedRecipe.instructions).map((instruction, index) => (
                                        <Text key={index} style={styles.instruction}>
                                            {index + 1}. {typeof instruction === 'object' ?
                                                (instruction.instruction || instruction.text || JSON.stringify(instruction)) :
                                                instruction}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

