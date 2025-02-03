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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

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

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      setCartItems(data.items);
    } catch (error: any) {
      console.error("Error fetching cart items:", error.message || error);
      Alert.alert("Error", "Failed to fetch cart items. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      console.log("🔹 Sending update request:", { itemId, newQuantity }); // ✅ Debug log

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/cart/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }), // ✅ Ensure itemId is from cart.items._id
      });

      const result = await response.json();
      console.log("🔹 Raw Server Response:", result);

      if (!response.ok)
        throw new Error(result.error || "Failed to update quantity");

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item._id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error("❌ Error updating quantity:", error);
    }
  };

  const removeItem = async (cakeId: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/cart/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cakeId }), // 📌 שינוי מ- itemId ל- cakeId
      });

      const data = await response.json();
      console.log("Remove response:", data); // 🚀 הדפסת תגובת השרת

      if (!response.ok) throw new Error(data.error || "Failed to remove item");

      setCartItems((prevItems) =>
        prevItems.filter((item) => item.cake._id !== cakeId)
      );
    } catch (error) {
      console.error("Error removing item:", error);
      if (error instanceof Error) {
        Alert.alert("Error", error.message || "Failed to remove item");
      } else {
        Alert.alert("Error", "Failed to remove item");
      }
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Cart is empty", "Please add items before checking out.");
      return;
    }
    Alert.alert("Checkout", "Proceeding to checkout...", [
      { text: "OK", onPress: () => router.push("/CheckoutScreen") },
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

  const handleProductPress = (id: string) => {
    router.push({
      pathname: "/product/[id]",
      params: { id },
    });
  };

  const calculateTotal = () => {
    return cartItems
      .reduce((sum, item) => sum + item.cake.price * item.quantity, 0)
      .toFixed(2);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity onPress={() => handleProductPress(item.cake._id)}>
        <Image
          source={{ uri: item.cake.image || "https://via.placeholder.com/100" }}
          style={styles.itemImage}
        />
      </TouchableOpacity>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.cake.name}</Text>
        <Text style={styles.itemPrice}>${item.cake.price.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => updateQuantity(item._id, item.quantity - 1)}
          >
            <Ionicons name="remove-circle-outline" size={26} color="#6b4226" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item._id, item.quantity + 1)}
          >
            <Ionicons name="add-circle-outline" size={26} color="#6b4226" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item.cake._id)} // 📌 שליחת cake._id במקום item._id
      >
        <MaterialIcons name="delete" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#6b4226"
          style={styles.loading}
        />
      ) : cartItems.length === 0 ? (
        <Text style={styles.emptyMessage}>Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item._id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.cartList}
          />
          <View style={styles.checkoutContainer}>
            <Text style={styles.totalText}>Total: ${calculateTotal()}</Text>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f3ea", padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
  cartList: { paddingBottom: 16 },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
    elevation: 3,
  },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#6b4226" },
  itemPrice: { fontSize: 14, color: "#6b4226" },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  quantityText: { fontSize: 16, marginHorizontal: 10 },
  removeButton: { backgroundColor: "#ff4444", padding: 8, borderRadius: 30 },
  checkoutContainer: { position: "absolute", bottom: 80, left: 20, right: 20 },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
  checkoutButton: { backgroundColor: "#6b4226", padding: 15, borderRadius: 10 },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  loading: {
    marginTop: 20,
  },
  emptyMessage: {
    fontSize: 18,
    color: "#6b4226",
    textAlign: "center",
    marginTop: 20,
  },
});
