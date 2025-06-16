import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";
import styles from "../app/styles/ProductDetailsScreenStyles"
import BackButton from "../components/BackButton";

interface Product {
  _id: string;
  name: string;
  image: string;
  description: string;
  ingredients: string[];
  price: number;
  stock: number;
}

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  console.log("🔹 Received params:", params);

  useEffect(() => {
    if (params.product) {
      try {
        const parsedProduct = JSON.parse(params.product as string);
        if (parsedProduct && parsedProduct._id) {
          parsedProduct.image = parsedProduct.image.replace(
            /(cakes)\//,
            "$1%2F"
          );
          setProduct(parsedProduct);
        } else {
          console.error("❌ Invalid product data received:", params.product);
        }
      } catch (error) {
        console.error("❌ Error parsing product:", error);
      }
    }
  }, [params.product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!product && params.id) {
        try {
          console.log("🔹 Fetching product from API:", params.id);
          const response = await fetch(`${config.BASE_URL}/cakes/${params.id}`);
          if (!response.ok)
            throw new Error("❌ Failed to fetch product details");

          const data = await response.json();
          if (data && data._id) {
            setProduct(data);
          } else {
            console.error("❌ API returned invalid product data:", data);
          }
        } catch (error) {
          console.error("❌ Error fetching product:", error);
        }
      }
    };

    fetchProduct();
  }, [params.id]);

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
        console.error("❌ Cake ID is missing or undefined.");
        Alert.alert("Error", "Cake ID is missing.");
        return;
      }

      if (quantity < 1) {
        console.error("❌ Invalid quantity:", quantity);
        Alert.alert("Error", "Quantity must be at least 1.");
        return;
      }

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        console.error("❌ User is not logged in. Token is missing.");
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
        console.error("❌ API Response Error:", error.message);
        Alert.alert("Error", error.message || "Failed to add cake to cart");
        return;
      }

      Alert.alert("Success", "🎉 Cake added to cart successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("❌ Error in addToCart:", error.message || error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{product.name}</Text>
        <Image
          source={{ uri: product.image || "https://via.placeholder.com/200" }}
          style={styles.image}
        />
        <Text style={styles.description}>{product.description}</Text>
        <Text style={styles.ingredients}>
          Ingredients: {product.ingredients?.join(", ")}
        </Text>
        <Text style={styles.price}>Price: ${product.price.toFixed(2)}</Text>
        <Text style={styles.stock}>In Stock: {product.stock}</Text>

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
            onPress={() => {
              if (product && quantity >= product.stock) {
                Alert.alert("Stock Limit", `Only ${product.stock} in stock`);
                return;
              }
              setQuantity((prev) => prev + 1);
            }}
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
