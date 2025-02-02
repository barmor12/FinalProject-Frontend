import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, Button, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // השתמש ב-useLocalSearchParams
import config from "../../config";

const ProductDetailsScreen = () => {
  const { id } = useLocalSearchParams(); // השתמש ב-useLocalSearchParams כדי לגשת לפרמטרים
  const [product, setProduct] = useState < any > (null); // אחסון המוצר
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/products/${id}`);
        const data = await response.json();
        setProduct(data); // עדכון המוצר
      } catch (error) {
        console.error("Error fetching product:", error);
        Alert.alert("Error", "Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>No product found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productDescription}>{product.description}</Text>
      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
      <Button
        title="Add to Cart"
        onPress={() => {
          // הוספת המוצר לעגלה (קוד לוגיקה הוספה לעגלה)
          Alert.alert("Success", "Product added to cart!");
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#d49a6a",
    marginBottom: 20,
  },
});

export default ProductDetailsScreen;
