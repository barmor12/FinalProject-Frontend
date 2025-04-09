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
  Modal,
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
    image: {
      public_id: string;
      url: string;
    };
    price: number;
    description: string;
  };
  quantity: number;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CartItem | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCartItems();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchCartItems();
    }, [])
  );

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

  // פונקציה לניקוי כל הפריטים בעגלה
  const clearCart = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear cart");
      }

      setCartItems([]);
    } catch (error: any) {
      console.error("Error clearing cart:", error.message || error);
      Alert.alert("Error", "Failed to clear cart");
    }
  };

  const calculateTotalPrice = () => {
    return cartItems
      .reduce((sum, item) => sum + item.cake.price * item.quantity, 0)
      .toFixed(2);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/cart/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to update quantity");

      const updatedCart = cartItems.map((item) =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      );

      setCartItems(updatedCart);
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
        body: JSON.stringify({ cakeId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to remove item");

      const updatedCart = cartItems.filter((item) => item.cake._id !== cakeId);
      setCartItems(updatedCart);
    } catch (error) {
      console.error("Error removing item:", error);
      Alert.alert("Error", "Failed to remove item");
    }
  };

  const openProductModal = (product: CartItem) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setModalVisible(false);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity onPress={() => openProductModal(item)}>
        <Image
          source={{ uri: item.cake.image.url }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.cake.name}</Text>
        <Text style={styles.itemPrice}>${item.cake.price.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)}>
            <Ionicons name="remove-circle-outline" size={26} color="#6b4226" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)}>
            <Ionicons name="add-circle-outline" size={26} color="#6b4226" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.cake._id)}>
        <MaterialIcons name="delete" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header עם כפתור לניקוי העגלה בצד ימין */}
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
          <MaterialIcons name="delete-sweep" size={28} color="#6b4226" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6b4226" style={styles.loading} />
      ) : cartItems.length === 0 ? (
        <Text style={styles.emptyMessage}>Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={renderCartItem}
        />
      )}

      {/* מודל להצגת פרטי מוצר */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <Image
                  source={{ uri: selectedProduct.cake.image.url }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <Text style={styles.modalTitle}>{selectedProduct.cake.name}</Text>
                <Text style={styles.modalDescription}>{selectedProduct.cake.description}</Text>
                <Text style={styles.modalPrice}>${selectedProduct.cake.price.toFixed(2)}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeProductModal}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {!isModalVisible && cartItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <Text style={styles.totalText}>Total: ${calculateTotalPrice()}</Text>
          <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push("/CheckoutScreen")}>
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f3ea", padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  clearButton: {
    padding: 5,
    marginRight: 5
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
  },
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
  quantityContainer: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  quantityText: { fontSize: 16, marginHorizontal: 10 },
  removeButton: { backgroundColor: "#ff4444", padding: 8, borderRadius: 30 },
  loading: { marginTop: 20 },
  emptyMessage: { fontSize: 18, color: "#6b4226", textAlign: "center", marginTop: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#6b4226", marginBottom: 10 },
  modalDescription: { fontSize: 16, color: "#555", textAlign: "center", marginBottom: 10 },
  modalPrice: { fontSize: 18, fontWeight: "bold", color: "#d49a6a", marginBottom: 15 },
  closeButton: { backgroundColor: "#6b4226", padding: 12, borderRadius: 8, width: "80%", alignItems: "center" },
  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  checkoutContainer: { position: "absolute", bottom: 80, left: 20, right: 20 },
  totalText: { fontSize: 18, fontWeight: "bold", color: "#6b4226", textAlign: "center" },
  checkoutButton: { backgroundColor: "#6b4226", padding: 15, borderRadius: 10 },
  checkoutButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" },
});
