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
  ImageSourcePropType,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "@/config";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import styles from "../styles/CartScreenStyles";


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
    stock: number;
  };
  quantity: number;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CartItem | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>(
    {}
  );
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

      // Store all cart items, including those with incomplete or invalid data
      setCartItems(data.items);

      // Log the number of items with incomplete data that are still displayed
      const missingDataItems = data.items.filter(
        (item: CartItem) =>
          !item ||
          !item.cake ||
          !item.cake._id ||
          !item.cake.name ||
          item.cake.price === undefined
      );

      if (missingDataItems.length > 0) {
        console.log(
          `${missingDataItems.length} items have missing data but will be displayed as unavailable`
        );
      }
    } catch (error: any) {
      console.error("Error fetching cart items:", error.message || error);
      Alert.alert("Error", "Failed to fetch cart items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to clear all items from the shopping cart
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

  // Calculate the total price of all items in the cart
  const calculateTotalPrice = () => {
    return cartItems
      .reduce((sum, item) => {
        // Check if item has valid price before adding
        return sum + (item.cake?.price || 0) * (item.quantity || 0);
      }, 0)
      .toFixed(2);
  };

  // Update the quantity of a specific item in the cart on the server and locally
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    // ✅ בדיקה מול המלאי הנוכחי
    const currentItem = cartItems.find((item) => item._id === itemId);
    if (currentItem && newQuantity > currentItem.cake.stock) {
      Alert.alert("Error", `Only ${currentItem.cake.stock} units in stock`);
      return;
    }
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
      Alert.alert(
        "Error",
        "Failed to update quantity. The product might have been deleted."
      );
      // Refresh cart items to get the latest state
      fetchCartItems();
    }
  };

  // Remove a specific item from the cart using its item ID
  const removeItem = async (cakeId: string, itemId?: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      // Always use the itemId for removing products from the cart
      if (!itemId) {
        Alert.alert("Error", "Could not identify the product to remove");
        return;
      }

      // Log the attempt to remove an item for debugging purposes
      console.log(`🔍 Attempting to remove item - using itemId: ${itemId}`);

      // Use the backend-required parameter name 'itemId'
      const response = await fetch(`${config.BASE_URL}/cart/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: itemId }), // Send as 'itemId' as required by backend
      });

      // Log server response status and request body for debugging purposes
      console.log(
        `📋 Server response status for removeItem: ${response.status}`
      );
      console.log(
        `📋 Request body sent: ${JSON.stringify({ itemId: itemId })}`
      );

      // Only update local state if the server confirms successful removal
      if (response.ok) {
        console.log(`✅ Server confirmed item removal - updating local state`);
        const updatedCart = cartItems.filter((item) => item._id !== itemId);
        setCartItems(updatedCart);

        // Try to parse the server's response; ignore if not JSON
        try {
          const data = await response.json();
          console.log(`Server response: ${JSON.stringify(data)}`);
        } catch (e) {
          console.log("Could not parse server response for remove item");
        }
      } else {
        // If the server responds with an error, show the error message to the user
        try {
          const data = await response.json();
          console.error(
            `❌ Server error removing item - itemId: ${itemId}: ${data.error || "Unknown error"
            }`
          );
          Alert.alert(
            "Error",
            `Failed to remove item: ${data.error || "Unknown error"}`
          );
        } catch (e) {
          console.error("Could not parse server error response");
          Alert.alert("Error", "Failed to remove item due to server error");
        }
      }
    } catch (error) {
      console.error("❌ Error removing item:", error);
      Alert.alert(
        "Error",
        "Failed to connect to server. Please check your connection and try again."
      );
    }
  };

  // Open the product details modal only for valid products with cake data
  const openProductModal = (product: CartItem) => {
    if (product.cake && product.cake.name && product.cake._id) {
      setSelectedProduct(product);
      setModalVisible(true);
    } else {
      // If product is unavailable, log and do not open modal
      console.log("Attempted to open modal for unavailable product - ignoring");
    }
  };

  // Close the product details modal and clear the selected product
  const closeProductModal = () => {
    setSelectedProduct(null);
    setModalVisible(false);
  };

  // Handle image loading error by marking the image as failed for a specific item
  const handleImageError = (itemId: string) => {
    setImageErrors((prev) => ({
      ...prev,
      [itemId]: true,
    }));
  };

  // Remove an unavailable product (with missing or invalid data) from the cart and database
  const removeUnavailableProduct = async (itemId: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      // For unavailable products, use the item ID as the identifier for removal
      if (!itemId) {
        Alert.alert("Error", "Could not identify the product to remove");
        return;
      }

      // Log the itemId used for removing unavailable product for debugging
      console.log(
        `🔍 Attempting to remove unavailable product - using itemId as cakeId: ${itemId}`
      );

      // Make a server call to remove the item from the database
      const response = await fetch(`${config.BASE_URL}/cart/remove`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: itemId }),
      });

      // Log response status
      console.log(`📋 Server response status: ${response.status}`);

      if (response.ok) {
        console.log(
          `✅ Successfully removed item with ID: ${itemId} from the database`
        );
        // Do not remove the item locally; refresh the cart to reflect the updated items from the server
        fetchCartItems();
      } else {
        // If the API call fails, display an error to the user
        const data = await response.json();
        console.error(
          `❌ Server error removing item ${itemId}: ${data.error || "Unknown error"
          }`
        );
        Alert.alert(
          "Error",
          "Failed to remove product from database. Please try refreshing your cart."
        );
      }
    } catch (error) {
      console.error("❌ Error removing unavailable item:", error);
      Alert.alert(
        "Error",
        "Failed to connect to server. Please check your connection and try again."
      );
    }
  };

  // Validate that the given URL is a properly formatted HTTP or HTTPS image URL
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url || url.trim() === "") return false;
    try {
      // Check if URL is properly formatted
      const parsedUrl = new URL(url);
      // Check if URL has a valid protocol (http or https)
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Return the image source object for a valid image URL, or undefined if invalid
  const getImageSource = (
    url: string | undefined
  ): ImageSourcePropType | undefined => {
    if (!url || url.trim() === "" || !isValidImageUrl(url)) {
      return undefined;
    }
    return { uri: url.trim() };
  };

  // Render a cart item row, showing placeholder and removal option if data is invalid
  const renderCartItem = ({ item }: { item: CartItem }) => {
    if (!item.cake || !item.cake.name || !item.cake._id) {
      return (
        <View style={styles.cartItem}>
          <View style={styles.cartItemContent}>
            <View style={[styles.itemImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>!</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>Product Unavailable</Text>
              <Text style={styles.errorText}>
                This product may have been deleted from our database
              </Text>
              <Text style={styles.itemQuantity}>
                Quantity: {item.quantity || 1}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeUnavailableProduct(item._id)}
          >
            <MaterialIcons name="delete" size={22} color="white" />
          </TouchableOpacity>
        </View>
      );
    }

    const imageUrl = item.cake.image?.url?.trim();
    const imageSource = getImageSource(imageUrl);
    const shouldShowPlaceholder = imageErrors[item._id] || !imageSource;

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
          onPress={() => openProductModal(item)}
          style={styles.cartItemContent}
        >
          {shouldShowPlaceholder ? (
            <View style={[styles.itemImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>Image Unavailable</Text>
            </View>
          ) : (
            <Image
              source={imageSource}
              style={styles.itemImage}
              resizeMode="cover"
              onError={() => handleImageError(item._id)}
            />
          )}
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.cake.name}</Text>
            <Text style={styles.itemPrice}>${item.cake.price.toFixed(2)}</Text>
            {/* ✅ הצגת מלאי זמין */}
            <Text style={styles.itemQuantity}>In Stock: {item.cake.stock}</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => updateQuantity(item._id, item.quantity - 1)}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={26}
                  color="#6b4226"
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item._id, item.quantity + 1)}
                disabled={item.quantity >= item.cake.stock}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={26}
                  color={item.quantity >= item.cake.stock ? "#ccc" : "#6b4226"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.cake._id, item._id)}
        >
          <MaterialIcons name="delete" size={22} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with a button to clear the cart on the right side */}
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
          <MaterialIcons name="delete-sweep" size={28} color="#6b4226" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#6b4226"
          style={styles.loading}
        />
      ) : cartItems.length === 0 ? (
        <Text style={styles.emptyMessage}>Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={renderCartItem}
        />
      )}

      {/* Modal for displaying product details */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && selectedProduct.cake && (
              <>
                {imageErrors[selectedProduct._id] ||
                  !getImageSource(selectedProduct.cake.image?.url?.trim()) ? (
                  <View style={[styles.modalImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>
                      Image Unavailable
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={getImageSource(
                      selectedProduct.cake.image?.url?.trim()
                    )}
                    style={styles.modalImage}
                    resizeMode="cover"
                    onError={() => handleImageError(selectedProduct._id)}
                  />
                )}
                <Text style={styles.modalTitle}>
                  {selectedProduct.cake.name}
                </Text>
                <Text style={styles.modalDescription}>
                  {selectedProduct.cake.description ||
                    "No description available"}
                </Text>
                <Text style={styles.modalPrice}>
                  ${selectedProduct.cake.price.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeProductModal}
                >
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
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push({
              pathname: "/CheckoutScreen",
              params: { newCheckout: "true" }
            })}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

