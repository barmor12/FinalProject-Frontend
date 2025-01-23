import React from "react";
import { SafeAreaView, View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams();
  const product = params.product ? JSON.parse(params.product as string) : null;

  if (!product) {
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
    textAlign: "justify", // טקסט מיושר למראה קריא יותר
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
  },
  error: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});
