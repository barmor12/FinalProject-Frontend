import React, { useState, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import config from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/AdminScreensStyles/AddRecipeScreenStyles";
import Header from "../../components/Header"; // ודא שזה הנתיב הנכון לקובץ Header

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
  category: string;
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
    category: "Cakes",
  });
  const [uploading, setUploading] = useState(false);
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        if (selectedAsset.uri) {
          setRecipe({ ...recipe, image: selectedAsset.uri });
        } else {
          Alert.alert("Error", "Invalid image selection");
        }
      } else {
        Alert.alert("Cancelled", "Image selection was cancelled");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const validateRecipe = () => {
    const scrollAndAlert = (title: string, msg: string) => {
      scrollToTop();
      Alert.alert(title, msg);
    };

    if (!recipe.image) {
      scrollAndAlert("Missing Field", "Please upload a recipe image");
      return false;
    }

    if (!recipe.name.trim()) {
      scrollAndAlert("Missing Field", "Recipe name is required");
      return false;
    }

    if (!recipe.description.trim()) {
      scrollAndAlert("Missing Field", "Recipe description is required");
      return false;
    }

    if (!recipe.servings.trim()) {
      scrollAndAlert("Missing Field", "Number of servings is required");
      return false;
    }

    if (recipe.ingredients.length === 0) {
      scrollAndAlert("Missing Field", "At least one ingredient is required");
      return false;
    }

    if (recipe.instructions.length === 0) {
      scrollAndAlert("Missing Field", "At least one instruction is required");
      return false;
    }

    const hoursNum = parseInt(hours);
    const minutesNum = parseInt(minutes);
    if (
      isNaN(hoursNum) ||
      isNaN(minutesNum) ||
      hoursNum < 0 ||
      minutesNum < 0 ||
      minutesNum > 59
    ) {
      scrollAndAlert("Invalid Time", "Please enter a valid time (0–59 minutes)");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateRecipe()) return;
    setUploading(true);

    const makingTime = `${hours ? `${hours}H` : ""} ${minutes ? `${minutes}M` : ""
      }`.trim();

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
      const ingredientsWithUnit = recipe.ingredients.map((i) => ({
        ...i,
        unit: i.unit || "unit",
      }));
      formData.append("ingredients", JSON.stringify(ingredientsWithUnit));
      formData.append("instructions", JSON.stringify(recipe.instructions));
      formData.append("difficulty", recipe.difficulty);
      formData.append("makingTime", makingTime);
      formData.append("category", recipe.category);
      if (recipe.image) {
        const cleanUri = recipe.image!;
        const imageUriParts = cleanUri.split(".");
        const fileType = imageUriParts[imageUriParts.length - 1];

        formData.append("image", {
          uri: cleanUri,
          type: `image/${fileType}`,
          name: `recipe.${fileType}`,
        } as any);
      }
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
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleIngredientsChange = (text: string) => {
    const lines = text.split("\n");
    const ingredientsArray: Ingredient[] = lines
      .map((line) => {
        const parts = line.trim().split(" ");
        if (parts.length < 2) return null;
        const amount = parts[0];
        const name = parts.slice(1).join(" ");
        return { name, amount, unit: "" };
      })
      .filter(Boolean) as Ingredient[];

    setRecipe({ ...recipe, ingredients: ingredientsArray });
  };

  const handleInstructionsChange = (text: string) => {
    const lines = text.split("\n");
    const instructions: Instruction[] = lines
      .map((line, index) => ({ step: index + 1, instruction: line.trim() }))
      .filter((inst) => inst.instruction !== "");

    setRecipe({ ...recipe, instructions });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Header title="Add New Recipe" showBack />

        <ScrollView ref={scrollViewRef} style={styles.scrollView}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Recipe Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
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
                placeholderTextColor="#6b4226"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={recipe.description}
                onChangeText={(text) =>
                  setRecipe({ ...recipe, description: text })
                }
                placeholder="Enter recipe description"
                placeholderTextColor="#6b4226"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Servings</Text>
              <TextInput
                style={styles.input}
                value={recipe.servings}
                onChangeText={(text) =>
                  setRecipe({ ...recipe, servings: text })
                }
                placeholder="Enter number of servings"
                placeholderTextColor="#6b4226"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryButtonsWrapper}>
                {["Cakes", "Cookies", "Pastries", "Bread", "Cupcakes"].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      recipe.category === cat && styles.selectedCategory,
                    ]}
                    onPress={() => setRecipe({ ...recipe, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        recipe.category === cat && styles.selectedCategoryText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ingredients (one per line)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                onChangeText={handleIngredientsChange}
                placeholder="Enter ingredients, one per line"
                placeholderTextColor="#6b4226"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Directions (one per line)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                onChangeText={handleInstructionsChange}
                placeholder="Enter directions, one per line"
                placeholderTextColor="#6b4226"
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
                    onPress={() =>
                      setRecipe({
                        ...recipe,
                        difficulty: level as "Easy" | "Medium" | "Hard",
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        recipe.difficulty === level &&
                        styles.selectedDifficultyText,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Making Time</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <TextInput
                  style={[styles.input, { width: "45%" }]}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="Hours"
                  placeholderTextColor="#6b4226"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, { width: "45%" }]}
                  value={minutes}
                  onChangeText={setMinutes}
                  placeholder="Minutes"
                  placeholderTextColor="#6b4226"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                uploading && styles.saveButtonDisabled,
              ]}
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
