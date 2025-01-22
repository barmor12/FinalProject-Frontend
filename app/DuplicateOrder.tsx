import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, Alert } from "react-native";
import axios from "axios";

export default function DuplicateOrderScreen() {
  const [orderId, setOrderId] = useState("");

  const duplicateOrder = async () => {
    try {
      const response = await axios.post(
        "http://your-backend-url/api/orders/duplicate",
        { orderId }
      );
      Alert.alert("Success", "Order duplicated successfully");
    } catch (error) {
      console.error("Failed to duplicate order:", error);
      Alert.alert("Error", "Failed to duplicate order");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duplicate Order</Text>
      <TextInput
        style={styles.input}
        placeholder="Order ID"
        value={orderId}
        onChangeText={setOrderId}
      />
      <Button title="Duplicate Order" onPress={duplicateOrder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
});
