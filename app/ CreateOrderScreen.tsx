import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker"; // Dropdown to select cakes
import config from "../config";
import styles from "../app/styles/CreateOrderScreenStyles";

// Cake data structure
interface Cake {
  _id: string;
  name: string;
  price: number;
}

// New order creation screen
export default function CreateOrderScreen() {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  // **Fetch list of cakes**
  useEffect(() => {
    const fetchCakes = async () => {
      try {
        const response = await axios.get(`${config.BASE_URL}/cakes`);
        setCakes(response.data);
      } catch (error) {
        console.error("Failed to fetch cakes:", error);
      }
    };

    fetchCakes();
  }, []);

  // **Function to submit the order**
  const handlePlaceOrder = async () => {
    if (!selectedCake || quantity < 1) {
      Alert.alert("Error", "Please select a cake and enter a valid quantity.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        Alert.alert("Error", "User not authenticated.");
        setLoading(false);
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not authenticated.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${config.BASE_URL}/order/create`,
        {
          userId,
          cakeId: selectedCake._id,
          quantity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        Alert.alert("Success", "Your order has been placed successfully!");
        navigation.navigate("OrdersScreen"); // Navigate back to orders list
      } else {
        Alert.alert("Error", "Failed to place order.");
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      Alert.alert("Error", "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create New Order</Text>

      {/* Cake selection dropdown */}
      <Text style={styles.label}>Select a Cake:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCake?._id || ""}
          onValueChange={(itemValue) => {
            const selected = cakes.find((cake) => cake._id === itemValue);
            setSelectedCake(selected || null);
          }}
        >
          <Picker.Item label="Select a cake..." value="" />
          {cakes.map((cake) => (
            <Picker.Item key={cake._id} label={cake.name} value={cake._id} />
          ))}
        </Picker>
      </View>

      {/* Quantity input field */}
      <Text style={styles.label}>Quantity:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={quantity.toString()}
        onChangeText={(text) => {
          const parsed = parseInt(text);
          setQuantity(isNaN(parsed) ? 1 : parsed);
        }}
      />

      {/* Total price display */}
      {selectedCake && (
        <Text style={styles.totalPrice}>
          Total Price: ${(selectedCake.price * quantity).toFixed(2)}
        </Text>
      )}

      {/* Submit order button */}
      <TouchableOpacity
        style={styles.orderButton}
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        <Text style={styles.orderButtonText}>
          {loading ? "Placing Order..." : "Place Order"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
