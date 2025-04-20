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

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f3ea",
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: "#e8d7c3",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        paddingTop: 8,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#6b4226",
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    rightHeader: {
        flexDirection: "row",
        alignItems: "center",
        width: 200,
        justifyContent: "flex-end",
    },
    searchContainer: {
        width: 150,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9f3ea",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        height: 36,
        marginRight: 8,
        paddingLeft: 8,
    },
    searchIcon: {
        marginRight: 4,
    },
    searchInput: {
        flex: 1,
        height: 36,
        color: "#6b4226",
        fontSize: 14,
        letterSpacing: 0.3,
        paddingRight: 10,
    },
    clearSearchButton: {
        width: 30,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    searchButton: {
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9f3ea",
        borderRadius: 18,
        marginRight: 7
    },
    scrollView: {
        flex: 1,
        padding: 10,
    },
    recipeGrid: {
        padding: 2,
        paddingBottom: 50,
    },
    recipeCard: {
        width: cardWidth,
        backgroundColor: "#fff",
        borderRadius: 12,
        marginVertical: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden",
    },
    recipeImage: {
        width: "100%",
        height: 120,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    recipeInfo: {
        padding: 10,
        paddingBottom: 8,
    },
    recipeTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#6b4226",
        marginBottom: 4,
        letterSpacing: 0.3,
        height: 34,
    },
    recipeDescription: {
        fontSize: 13,
        color: "#666",
        marginBottom: 6,
        lineHeight: 18,
        letterSpacing: 0.2,
        height: 36,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 4,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 8,
    },
    metaText: {
        fontSize: 11,
        color: "#6b4226",
        marginLeft: 2,
        fontWeight: "500",
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
    },
    modalImage: {
        width: "100%",
        height: 250,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalTextContent: {
        padding: 20,
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
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#6b4226",
        marginBottom: 12,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    modalDescription: {
        fontSize: 16,
        color: "#666",
        marginBottom: 20,
        textAlign: "center",
        lineHeight: 24,
        letterSpacing: 0.3,
    },
    modalMeta: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    metaBackground: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9f3ea",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    modalMetaText: {
        fontSize: 16,
        color: "#6b4226",
        marginLeft: 8,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    section: {
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#6b4226",
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    ingredient: {
        fontSize: 15,
        color: "#666",
        marginBottom: 8,
        lineHeight: 22,
        letterSpacing: 0.2,
    },
    instruction: {
        fontSize: 15,
        color: "#666",
        marginBottom: 12,
        lineHeight: 22,
        letterSpacing: 0.2,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 240, 245, 0.6)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    likeCount: {
        marginLeft: 3,
        fontSize: 11,
        fontWeight: '500',
        color: '#6b4226',
    },
    modalTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalLikeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    modalLikeCount: {
        marginLeft: 6,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6b4226',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6b4226',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#ff4d6d',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#6b4226',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        height: 300,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6b4226',
        textAlign: 'center',
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginHorizontal: 16,
    },
    newBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ff4d6d',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalImageContainer: {
        position: 'relative',
    },
    modalNewBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#ff4d6d',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    modalNewBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.3,
    },
}); 