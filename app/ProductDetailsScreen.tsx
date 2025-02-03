import React, { useState, useEffect } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";

// 🎯 הגדרת טיפוס עבור המוצר
interface Product {
  _id: string;
  name: string;
  image: string;
  description: string;
  ingredients: string[];
  price: number;
}

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  console.log("Product params received:", params);

  useEffect(() => {
    if (params.product) {
      try {
        setProduct(JSON.parse(params.product as string));
      } catch (error) {
        console.error("Error parsing product:", error);
      }
    }
  }, [params.product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!product && params.id) {
        try {
          console.log(`Fetching product details for ID: ${params.id}`);
          const response = await fetch(`${config.BASE_URL}/cakes/${params.id}`);
          if (!response.ok) throw new Error("Failed to fetch product details");

          const data: Product = await response.json();
          setProduct(data);
        } catch (error) {
          console.error("Error fetching product:", error);
          Alert.alert("Error", "Failed to load product details.");
        }
      }
    };

    fetchProduct();
  }, [params.id, product]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  const addToCart = async (cakeId: string, quantity: number) => {
    try {
      if (!cakeId) {
        console.error("Cake ID is missing or undefined.");
        Alert.alert("Error", "Cake ID is missing.");
        return;
      }

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        console.error("User is not logged in. Token is missing.");
        Alert.alert(
          "Error",
          "You need to be logged in to add items to the cart."
        );
        return;
      }

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

      Alert.alert("Success", "Cake added to cart successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error in addToCart:", error.message || error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{product.name}</Text>
        <Image source={{ uri: product.image }} style={styles.image} />
        <Text style={styles.description}>{product.description}</Text>
        <Text style={styles.ingredients}>
          Ingredients: {product.ingredients?.join(", ")}
        </Text>
        <Text style={styles.price}>Price: ${product.price.toFixed(2)}</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setQuantity((prev) => prev + 1)}
          >
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
            addToCart(product._id, quantity);
          }}
        >
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f3ea" },
  scrollContent: { padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
  image: { width: "100%", height: 200, borderRadius: 10 },
  description: {
    fontSize: 16,
    color: "#6b4226",
    marginTop: 16,
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
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#6b4226",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  quantityText: { fontSize: 18, color: "#6b4226" },
  addButton: {
    backgroundColor: "#6b4226",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  error: { fontSize: 18, color: "red", textAlign: "center", marginTop: 20 },
});
