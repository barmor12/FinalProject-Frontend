import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function InventoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory</Text>
      <Text style={styles.subtitle}>Manage your inventory here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
  },
});
