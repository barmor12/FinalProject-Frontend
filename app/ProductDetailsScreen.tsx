import React from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router"; // שימוש ב-router
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams();
  const product = params.product ? JSON.parse(params.product as string) : null;

  const addToCart = async (cakeId: string) => {
    try {
      if (!cakeId) {
        console.error("Cake ID is missing or undefined.");
        Alert.alert("Error", "Cake ID is missing.");
        return;
      }

      console.log("Cake ID being sent to the API:", cakeId); // בדיקת ID

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        console.error("User is not logged in. Token is missing.");
        Alert.alert("Error", "You need to be logged in to add items to the cart.");
        return;
      }

      // קריאה ל-API עם `cakeId`
      const response = await fetch(`${config.BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cakeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API Response Error:", error);
        throw new Error(error.message || "Failed to add cake to cart");
      }

      console.log("Cake successfully added to cart."); // לוג להצלחה
      Alert.alert("Success", "Cake added to cart successfully!", [
        { text: "OK", onPress: () => router.back() }, // חזרה לנתיב הקודם
      ]);
    } catch (error: any) {
      console.error("Error in addToCart:", error.message || error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  if (!product) {
    console.error("Product data is missing.");
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Error: Product data not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{product.name}</Text>
        <Image source={{ uri: product.image }} style={styles.image} />
        <Text style={styles.description}>{product.description}</Text>
        <Text style={styles.ingredients}>
          Ingredients: {product.ingredients.join(", ")}
        </Text>
        <Text style={styles.price}>Price: ${product.price.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (!product._id) {
              Alert.alert("Error", "Cake ID is missing.");
              return;
            }
            addToCart(product._id);
          }}
        >
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f3ea",
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 16,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#6b4226",
    marginBottom: 16,
    textAlign: "justify",
  },
  ingredients: {
    fontSize: 16,
    color: "#6b4226",
    marginBottom: 16,
    textAlign: "justify",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#6b4226",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  error: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});
