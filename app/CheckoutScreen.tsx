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

export default function CheckoutScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
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
        headers: { Authorization: `Bearer ${token}` },
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

  useEffect(() => {
    fetchCartItems();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchCartItems();
    }, [])
  );

  const calculateTotal = () => {
    return cartItems
      .reduce((sum, item) => sum + item.cake.price * item.quantity, 0)
      .toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/order/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            cakeId: item.cake._id,
            quantity: item.quantity,
          })),
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to place order");
      }

      Alert.alert("Success", "Your order has been placed successfully!", [
        { text: "OK", onPress: () => router.replace("/OrdersScreen") },
      ]);
    } catch (error: any) {
      console.error("Error placing order:", error.message || error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.cake.image || "https://via.placeholder.com/100" }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.cake.name}</Text>
        <Text style={styles.itemPrice}>${item.cake.price.toFixed(2)}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
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

          <View style={styles.paymentContainer}>
            <Text style={styles.paymentTitle}>Select Payment Method</Text>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                paymentMethod === "credit_card" && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod("credit_card")}
            >
              <Ionicons name="card-outline" size={24} color="#6b4226" />
              <Text style={styles.paymentText}>Credit Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentButton,
                paymentMethod === "paypal" && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod("paypal")}
            >
              <Ionicons name="logo-paypal" size={24} color="#6b4226" />
              <Text style={styles.paymentText}>PayPal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checkoutContainer}>
            <Text style={styles.totalText}>Total: ${calculateTotal()}</Text>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handlePlaceOrder}
            >
              <Text style={styles.checkoutButtonText}>Place Order</Text>
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
  },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#6b4226" },
  itemPrice: { fontSize: 14, color: "#6b4226" },
  itemQuantity: { fontSize: 14, color: "#6b4226" },
  paymentContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 10,
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedPayment: { backgroundColor: "#f0e0d6" },
  paymentText: { fontSize: 16, color: "#6b4226", marginLeft: 10 },
  checkoutContainer: { marginTop: 20, alignItems: "center" },
  totalText: { fontSize: 18, fontWeight: "bold", color: "#6b4226" },
  checkoutButton: {
    backgroundColor: "#6b4226",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  loading: { marginTop: 20 },
  emptyMessage: {
    fontSize: 18,
    color: "#6b4226",
    textAlign: "center",
    marginTop: 20,
  },
});
