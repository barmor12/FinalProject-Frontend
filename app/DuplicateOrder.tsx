import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import axios from "axios";
import styles from "./styles/DuplicateOrderStyles"; // Importing styles

export default function DuplicateOrderScreen() {
  const [orderId, setOrderId] = useState("");

  // Function to duplicate an order
  const duplicateOrder = async () => {
    console.log(`🔄 Duplicating order: ${orderId}`);
    try {
      const response = await axios.post(
        "http://your-backend-url/api/orders/duplicate",
        { orderId }
      );
      Alert.alert("✅ Success", "Order duplicated successfully");
    } catch (error) {
      console.error("❌ Failed to duplicate order:", error);
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
