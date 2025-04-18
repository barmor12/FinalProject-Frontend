import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Recipe {
    id: string;
    title: string;
    description: string;
    image: string;
    difficulty: "Easy" | "Medium" | "Hard";
    time: string;
    ingredients: string[];
    instructions: string[];
}

const sampleRecipes: Recipe[] = [
    {
        id: "1",
        title: "Classic Chocolate Cake",
        description: "A rich and moist chocolate cake that's perfect for any occasion.",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
        difficulty: "Medium",
        time: "1h 30m",
        ingredients: [
            "2 cups all-purpose flour",
            "2 cups sugar",
            "3/4 cup cocoa powder",
            "2 teaspoons baking powder",
            "1 1/2 teaspoons baking soda",
            "1 teaspoon salt",
            "1 cup milk",
            "1/2 cup vegetable oil",
            "2 eggs",
            "2 teaspoons vanilla extract",
            "1 cup boiling water"
        ],
        instructions: [
            "Preheat oven to 350°F (175°C).",
            "Grease and flour two 9-inch round baking pans.",
            "In a large bowl, combine dry ingredients.",
            "Add milk, oil, eggs, and vanilla; beat for 2 minutes.",
            "Stir in boiling water (batter will be thin).",
            "Pour batter into prepared pans.",
            "Bake for 30-35 minutes or until a toothpick inserted in the center comes out clean.",
            "Cool for 10 minutes before removing from pans to wire racks.",
            "Frost with your favorite chocolate frosting."
        ]
    },
    {
        id: "2",
        title: "Red Velvet Cupcakes",
        description: "Soft and fluffy red velvet cupcakes with cream cheese frosting.",
        image: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7",
        difficulty: "Easy",
        time: "45m",
        ingredients: [
            "2 1/2 cups all-purpose flour",
            "1 1/2 cups sugar",
            "1 teaspoon baking soda",
            "1 teaspoon salt",
            "1 teaspoon cocoa powder",
            "1 1/2 cups vegetable oil",
            "1 cup buttermilk",
            "2 large eggs",
            "2 tablespoons red food coloring",
            "1 teaspoon white distilled vinegar",
            "1 teaspoon vanilla extract"
        ],
        instructions: [
            "Preheat oven to 350°F (175°C).",
            "Line muffin tins with paper liners.",
            "Sift together flour, sugar, baking soda, salt, and cocoa powder.",
            "In a separate bowl, mix oil, buttermilk, eggs, food coloring, vinegar, and vanilla.",
            "Add wet ingredients to dry ingredients and mix until smooth.",
            "Fill cupcake liners 2/3 full with batter.",
            "Bake for 20-25 minutes or until a toothpick comes out clean.",
            "Cool completely before frosting."
        ]
    },
    {
        id: "3",
        title: "Tiramisu",
        description: "Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream.",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9",
        difficulty: "Hard",
        time: "2h",
        ingredients: [
            "6 large egg yolks",
            "3/4 cup sugar",
            "2/3 cup milk",
            "1 1/4 cups heavy cream",
            "1/2 teaspoon vanilla extract",
            "1 pound mascarpone cheese",
            "1 3/4 cups strong espresso",
            "2 tablespoons rum",
            "24 ladyfingers",
            "2 tablespoons cocoa powder"
        ],
        instructions: [
            "Whisk egg yolks and sugar until thick and pale.",
            "Heat milk in a saucepan until it simmers.",
            "Slowly pour hot milk into egg mixture, whisking constantly.",
            "Return mixture to saucepan and cook over medium heat until thickened.",
            "Remove from heat and let cool.",
            "Beat heavy cream and vanilla until stiff peaks form.",
            "Fold mascarpone into cooled egg mixture, then fold in whipped cream.",
            "Mix espresso and rum in a shallow dish.",
            "Dip ladyfingers in espresso mixture and layer in a dish.",
            "Spread half of mascarpone mixture over ladyfingers.",
            "Repeat layers and dust with cocoa powder.",
            "Refrigerate for at least 4 hours before serving."
        ]
    },
];

export default function RecipeScreen() {
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(sampleRecipes);

    const handleSearch = (text: string) => {
        setSearchText(text);
        if (text.trim() === "") {
            setFilteredRecipes(sampleRecipes);
        } else {
            const searched = sampleRecipes.filter((recipe) =>
                recipe.title.toLowerCase().includes(text.toLowerCase()) ||
                recipe.description.toLowerCase().includes(text.toLowerCase()) ||
                recipe.ingredients.some(ingredient =>
                    ingredient.toLowerCase().includes(text.toLowerCase())
                )
            );
            setFilteredRecipes(searched);
        }
    };

    const clearSearch = () => {
        setSearchText("");
        setFilteredRecipes(sampleRecipes);
    };

    const toggleSearch = () => {
        setSearchVisible((prev) => {
            if (!prev) setSearchText("");
            return !prev;
        });
    };

    const renderRecipeCard = (recipe: Recipe) => (
        <TouchableOpacity
            key={recipe.id}
            style={styles.recipeCard}
            onPress={() => setSelectedRecipe(recipe)}
        >
            <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
            <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                    {recipe.description}
                </Text>
                <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color="#6b4226" />
                        <Text style={styles.metaText}>{recipe.time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="flame-outline" size={16} color="#6b4226" />
                        <Text style={styles.metaText}>{recipe.difficulty}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Recipe Book</Text>
                <View style={styles.rightHeader}>
                    {searchVisible && (
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search recipes..."
                                value={searchText}
                                onChangeText={handleSearch}
                                autoFocus
                            />
                            {searchText && (
                                <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                                    <Ionicons name="close-circle" size={20} color="#6b4226" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    <TouchableOpacity onPress={toggleSearch} style={styles.searchButton}>
                        <Ionicons name={searchVisible ? "close" : "search"} size={24} color="#6b4226" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.recipeGrid}>
                    {filteredRecipes.map(renderRecipeCard)}
                </View>
            </ScrollView>

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
                            <Image
                                source={{ uri: selectedRecipe.image }}
                                style={styles.modalImage}
                            />
                            <View style={styles.modalTextContent}>
                                <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                                <Text style={styles.modalDescription}>
                                    {selectedRecipe.description}
                                </Text>
                                <View style={styles.modalMeta}>
                                    <View style={styles.metaItem}>
                                        <View style={styles.metaBackground}>
                                            <Ionicons name="time-outline" size={20} color="#6b4226" />
                                            <Text style={styles.modalMetaText}>{selectedRecipe.time}</Text>
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
                                    {selectedRecipe.ingredients.map((ingredient, index) => (
                                        <Text key={index} style={styles.ingredient}>
                                            • {ingredient}
                                        </Text>
                                    ))}
                                </View>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Instructions</Text>
                                    {selectedRecipe.instructions.map((instruction, index) => (
                                        <Text key={index} style={styles.instruction}>
                                            {index + 1}. {instruction}
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
const cardWidth = (width - 40) / 2 - 10;

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
        fontSize: 28,
        fontWeight: "800",
        color: "#6b4226",
        letterSpacing: 0.5,
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
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        height: 40,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: "#6b4226",
        fontSize: 16,
        letterSpacing: 0.3,
        paddingHorizontal: 10,
    },
    clearSearchButton: {
        width: 30,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    searchButton: {
        width: 40,
        height: 40,
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
        padding: 10,
    },
    recipeCard: {
        width: cardWidth,
        backgroundColor: "#fff",
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden",
    },
    recipeImage: {
        width: "100%",
        height: 150,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    recipeInfo: {
        padding: 12,
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#6b4226",
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    recipeDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 10,
        lineHeight: 20,
        letterSpacing: 0.2,
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
        fontSize: 13,
        color: "#6b4226",
        marginLeft: 4,
        fontWeight: "500",
        letterSpacing: 0.2,
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
}); 