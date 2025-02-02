import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";
import { router, useFocusEffect } from "expo-router";

interface CartItem {
  _id: string;
  cake: {
    _id: string;
    name: string;
    image: string;
    price: number;
  };
  quantity: number;
}

export default function InventoryScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You need to be logged in to view the cart.");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/cart`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch cart items");
      }

      const data = await response.json();
      setCartItems(data.items); // עדכון רשימת הפריטים בעגלה
    } catch (error: any) {
      console.error("Error fetching cart items:", error.message || error);
      Alert.alert("Error", "Failed to fetch cart items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    Alert.alert("Checkout", "Proceeding to checkout...", [
      // { text: "OK", onPress: () => router.push("/CheckoutScreen") }, // מעבר לעמוד Checkout
    ]);
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchCartItems();
    }, [])
  );

  const handleProductPress = (id) => {
    // השתמש בנתיב דינמי מתאים
    router.push(`/product/${id}`);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <TouchableOpacity
      style={styles.cartItem}
      onPress={() => handleProductPress(item.cake._id)} // ניווט לעמוד המוצר
    >
      <Image
        source={{ uri: item.cake.image || "https://via.placeholder.com/100" }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.cake.name}</Text>
        <Text style={styles.itemPrice}>${item.cake.price.toFixed(2)}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      {cartItems.length === 0 ? (
        <Text style={styles.emptyMessage}>Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={renderCartItem}
          contentContainerStyle={styles.cartList}
        />
      )}
      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={handleCheckout}
      >
        <Text style={styles.checkoutButtonText}>Checkout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f3ea",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginBottom: 16,
  },
  cartList: {
    paddingBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: "#6b4226",
    marginBottom: 5,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#6b4226",
  },
  checkoutButton: {
    backgroundColor: "#6b4226",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loading: {
    fontSize: 18,
    textAlign: "center",
    color: "#6b4226",
    marginTop: 20,
  },
  emptyMessage: {
    fontSize: 18,
    color: "#6b4226",
    textAlign: "center",
    marginTop: 20,
  },
});
