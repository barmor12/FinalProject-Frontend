import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

interface CartItem {
  _id: string;
  cake: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  totalPrice: number;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");

        if (!token) {
          Alert.alert("Error", "No access token found");
          return;
        }

        const response = await fetch(`${config.BASE_URL}/cart/get`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setCartItems(data.items || []);
        } else {
          Alert.alert("Error", data.message || "Failed to fetch cart");
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        Alert.alert("Error", "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleRemoveFromCart = async (cakeId: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      const response = await fetch(`${config.BASE_URL}/cart/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cakeId }),
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems(cartItems.filter((item) => item.cake._id !== cakeId));
        Alert.alert("Success", "Item removed from cart");
      } else {
        Alert.alert("Error", data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping Cart</Text>

      {cartItems.length === 0 ? (
        <Text style={styles.emptyMessage}>Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.itemText}>
                {item.cake.name} x {item.quantity}
              </Text>
              <Text style={styles.itemText}>${item.totalPrice}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFromCart(item.cake._id)}
              >
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f3ea" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyMessage: { fontSize: 18, color: "#6b4226", textAlign: "center" },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  itemText: { fontSize: 16, color: "#6b4226" },
  removeButton: { backgroundColor: "#d49a6a", padding: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
