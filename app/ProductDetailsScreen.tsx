import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router"; // שימוש ב-router
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams();
  const product = params.product ? JSON.parse(params.product as string) : null;

  // מצב לאחסון כמות
  const [quantity, setQuantity] = useState(1); // ברירת מחדל = 1

  // פונקציות להוספה ולהפחתה של כמות
  const incrementQuantity = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prevQuantity) => prevQuantity - 1);
    } else {
      Alert.alert("Error", "Quantity cannot be less than 1.");
    }
  };

  const addToCart = async (cakeId: string, quantity: number) => {
    try {
      if (!cakeId) {
        console.error("Cake ID is missing or undefined.");
        Alert.alert("Error", "Cake ID is missing.");
        return;
      }

      console.log("Cake ID being sent to the API:", cakeId);
      console.log("Quantity being sent to the API:", quantity);

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        console.error("User is not logged in. Token is missing.");
        Alert.alert("Error", "You need to be logged in to add items to the cart.");
        return;
      }

      // קריאה ל-API עם גם `cakeId` וגם `quantity`
      const response = await fetch(`${config.BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cakeId, quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API Response Error:", error.message);
        Alert.alert("Error", error.message || "Failed to add cake to cart");
        return;
      }

      console.log("Cake successfully added to cart.");
      Alert.alert("Success", "Cake added to cart successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error in addToCart:", error.message || error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  // בדיקת המוצר
  if (!product || !product.image || !product.description || !product.name) {
    console.error("Product data is missing or incomplete.");
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Error: Product data not found or incomplete</Text>
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

        {/* כפתורי הוספה והפחתה של כמות */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity style={styles.button} onPress={decrementQuantity}>
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity style={styles.button} onPress={incrementQuantity}>
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (!product._id) {
              Alert.alert("Error", "Cake ID is missing.");
              return;
            }
            addToCart(product._id, quantity); // קריאה לפונקציה עם כמות
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
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#6b4226",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 10,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 18,
    color: "#6b4226",
    fontWeight: "bold",
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
