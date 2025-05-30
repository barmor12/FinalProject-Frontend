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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

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

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState(
    "Standard Delivery (2-3 days)"
  );
  const [promoCode, setPromoCode] = useState("");
  const [deliveryDetailsVisible, setDeliveryDetailsVisible] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [ShowAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
  });

  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const router = useRouter();

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const fetchAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You need to be logged in.");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/address`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }

      const data: Address[] = await response.json(); // ✅ הגדרת טיפוס
      setAddresses(data);

      // ✅ בחירת הכתובת ברירת מחדל אם קיימת
      const defaultAddress = data.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Alert.alert("Error", "Failed to fetch addresses.");
    }
  };

  // נטען את הכתובות בעת טעינת המסך
  useEffect(() => {
    fetchAddresses();
  }, []);

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
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.cake.price * item.quantity,
      0
    );
    const discounted = subtotal * (1 - discountAmount / 100);
    return discounted.toFixed(2);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.cake.image.url }}
        style={styles.itemImage}
        resizeMode="cover"
      />

      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.cake.name}</Text>
        <Text style={styles.itemPrice}>${item.cake.price.toFixed(2)}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
      </View>
    </View>
  );
  const handlePlaceOrder = async () => {
    try {
      if (
        shippingMethod === "Standard Delivery (2-3 days)" &&
        !selectedAddress
      ) {
        Alert.alert("Error", "Please select a delivery address.");
        return;
      }
      if (shippingMethod === "Standard Delivery (2-3 days)" && !deliveryDate) {
        Alert.alert("Error", "Please select a delivery date.");
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      // Create a new date object and set it to start of day
      const deliveryDateTime = new Date(deliveryDate ?? new Date());
      deliveryDateTime.setHours(0, 0, 0, 0);

      // Format the date as YYYY-MM-DD
      const year = deliveryDateTime.getFullYear();
      const month = String(deliveryDateTime.getMonth() + 1).padStart(2, "0");
      const day = String(deliveryDateTime.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const body: any = {
        items: cartItems.map((item) => ({
          cakeId: item.cake._id,
          quantity: item.quantity,
        })),
        paymentMethod: "cash",
        shippingMethod,
      };
      if (shippingMethod === "Standard Delivery (2-3 days)") {
        body.address = selectedAddress;
        body.deliveryDate = formattedDate;
      } else if (shippingMethod === "Self Pickup") {
        body.deliveryDate = formattedDate;
      }

      const response = await fetch(`${config.BASE_URL}/order/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to place order");
      }

      Alert.alert("Success", "Your order has been placed!", [
        { text: "OK", onPress: () => router.replace("/OrdersScreen") },
      ]);
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyPromoCode = async () => {
    try {
      if (appliedCode) {
        // ביטול הקופון
        setDiscountAmount(0);
        setAppliedCode(null);
        Alert.alert("Removed", "Promo code removed.");
        return;
      }

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/discount/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: promoCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Invalid Code", data.message || "Promo code not valid");
        return;
      }

      setDiscountAmount(data.discountPercentage);
      setAppliedCode(promoCode); // שמור את הקוד שהוזן
      Alert.alert("Success", `Promo applied: ${data.discountPercentage}% off!`);
    } catch (error) {
      console.error("Error applying promo code:", error);
      Alert.alert("Error", "Failed to apply promo code.");
    } finally {
      setPromoCode("");
    }
  };

  const handleAddAddress = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/address`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ ...newAddress, isDefault: false }),
      });

      if (!response.ok) throw new Error("Failed to add address");
      const addedAddress = await response.json();
      setSelectedAddress(addedAddress.address);
      Alert.alert("Success", "Address added successfully!");
      setNewAddress({ fullName: "", phone: "", street: "", city: "" });
      fetchAddresses(); // רענון הרשימה
    } catch (error) {
      console.error("Error adding address:", error);
      Alert.alert("Error", "Failed to add address.");
    } finally {
      setLoading(false);
      setShowAddAddress(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      // Set the year to current year for all dates
      const currentYearDate = new Date(selectedDate);
      currentYearDate.setFullYear(new Date().getFullYear());
      setDeliveryDate(currentYearDate);
    }
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView style={styles.scrollView}>
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
              {/* Products Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Your Order</Text>
                {cartItems.map((item) => (
                  <View key={item._id} style={styles.cartItem}>
                    <Image
                      source={{ uri: item.cake.image.url }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.cake.name}</Text>
                      <Text style={styles.itemPrice}>
                        ${item.cake.price.toFixed(2)}
                      </Text>
                      <Text style={styles.itemQuantity}>
                        Quantity: {item.quantity}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Shipping Method Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Shipping Method</Text>
                <TouchableOpacity
                  style={styles.shippingOption}
                  onPress={() => setShippingModalVisible(true)}
                >
                  <Text style={styles.shippingText}>{shippingMethod}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#6b4226" />
                </TouchableOpacity>
              </View>

              {/* Delivery Details Section */}
              {shippingMethod !== "Self Pickup" && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Delivery Details</Text>
                  <TouchableOpacity
                    style={styles.deliveryDetailsBox}
                    onPress={() => setDeliveryDetailsVisible(true)}
                  >
                    <View>
                      {selectedAddress ? (
                        <>
                          <Text style={styles.deliveryName}>
                            <Text style={{ fontWeight: "bold" }}>
                              {selectedAddress.fullName}
                            </Text>{" "}
                            ({selectedAddress.phone})
                          </Text>
                          <Text style={styles.deliveryAddress}>
                            {selectedAddress.street}, {selectedAddress.city}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.deliveryAddress}>
                          No address selected
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#1D4ED8"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Delivery Date Section - show for any shipping method */}
              {shippingMethod !== "" && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>
                    {shippingMethod === "Self Pickup"
                      ? "Pickup Date"
                      : "Delivery Date"}
                  </Text>
                  <TouchableOpacity
                    style={styles.deliveryDateBox}
                    onPress={toggleDatePicker}
                  >
                    <View>
                      <Text style={styles.deliveryDateText}>
                        {deliveryDate
                          ? formatDate(deliveryDate)
                          : "Select delivery date"}
                      </Text>
                    </View>
                    <Ionicons
                      name="calendar-outline"
                      size={24}
                      color="#6b4226"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Promo Code Section */}
              <View style={styles.promoContainer}>
                <TextInput
                  style={styles.promoInput}
                  placeholderTextColor={"#7B6D63"}
                  placeholder={
                    appliedCode ? `Applied: ${appliedCode}` : "Enter promo code"
                  }
                  value={promoCode}
                  onChangeText={setPromoCode}
                  editable={!appliedCode}
                />
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyPromoCode}
                >
                  <Text style={styles.applyButtonText}>
                    {appliedCode ? "Remove" : "Apply"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Payment Method Section */}
              <View style={styles.paymentContainer}>
                <Text style={styles.paymentTitle}>Payment Method</Text>
                <View style={styles.cashPayment}>
                  <Ionicons name="cash-outline" size={24} color="#6b4226" />
                  <Text style={styles.paymentText}>Cash</Text>
                </View>
              </View>

              {/* Order Summary Section */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Order Summary</Text>

                {/* Subtotal */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    $
                    {cartItems
                      .reduce(
                        (sum, item) => sum + item.cake.price * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </Text>
                </View>

                {/* Shipping */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>
                    {shippingMethod === "Self Pickup" ? "$0.00" : "$10.00"}
                  </Text>
                </View>

                {/* Discount if applied */}
                {discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Discount ({discountAmount}%)
                    </Text>
                    <Text style={[styles.summaryValue, styles.discountValue]}>
                      -$
                      {(
                        cartItems.reduce(
                          (sum, item) => sum + item.cake.price * item.quantity,
                          0
                        ) *
                        (discountAmount / 100)
                      ).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Total */}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    $
                    {(
                      parseFloat(calculateTotal()) +
                      (shippingMethod === "Self Pickup" ? 0 : 10)
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Checkout Button Section */}
              <View style={styles.checkoutContainer}>
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={handlePlaceOrder}
                >
                  <Text style={styles.checkoutButtonText}>Place Order</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        <Modal
          transparent={true}
          visible={deliveryDetailsVisible}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select a Delivery Address</Text>

              {addresses.length === 0 ? (
                // אם אין כתובות שמורות
                <View style={styles.noAddressContainer}>
                  <Text style={styles.noAddressText}>No addresses found</Text>
                  <TouchableOpacity
                    style={styles.addAddressButton}
                    onPress={() => {
                      setDeliveryDetailsVisible(false);
                      setShowAddAddress(true); // הצגת מסך הוספת כתובת
                    }}
                  >
                    <Text style={styles.addAddressText}>Add New Address</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={addresses}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.addressItem,
                        selectedAddress?._id === item._id &&
                          styles.selectedAddress,
                      ]}
                      onPress={() => {
                        setSelectedAddress(item);
                        setDeliveryDetailsVisible(false);
                      }}
                    >
                      <Text style={styles.modalText}>
                        <Text style={{ fontWeight: "bold" }}>
                          {item.fullName}
                        </Text>{" "}
                        ({item.phone})
                      </Text>
                      <Text style={styles.modalText}>
                        {item.street}, {item.city}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setDeliveryDetailsVisible(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          transparent={true}
          visible={shippingModalVisible}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Shipping Method</Text>

              {/* אפשרות למשלוח */}
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  shippingMethod === "Standard Delivery (2-3 days)" &&
                    styles.selectedOption,
                ]}
                onPress={() => {
                  setShippingMethod("Standard Delivery (2-3 days)");
                  setShippingModalVisible(false);
                }}
              >
                <Ionicons name="bicycle" size={24} color="#6b4226" />
                <Text style={styles.modalText}>
                  Standard Delivery (2-3 days)
                </Text>
              </TouchableOpacity>

              {/* אפשרות לאיסוף עצמי */}
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  shippingMethod === "Self Pickup" && styles.selectedOption,
                ]}
                onPress={() => {
                  setShippingMethod("Self Pickup");
                  setShippingModalVisible(false);
                }}
              >
                <Ionicons name="storefront-outline" size={24} color="#6b4226" />
                <Text style={styles.modalText}>Self Pickup</Text>
              </TouchableOpacity>

              {/* כפתור סגירה */}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShippingModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          transparent={true}
          visible={ShowAddAddress}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Address</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={newAddress.fullName}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, fullName: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={newAddress.phone}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, phone: text })
                }
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Street"
                value={newAddress.street}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, street: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="City"
                value={newAddress.city}
                onChangeText={(text) =>
                  setNewAddress({ ...newAddress, city: text })
                }
              />

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddAddress}
              >
                <Text style={styles.addButtonText}>Save Address</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddAddress(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {showDatePicker && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.6)",
                justifyContent: "center",
                alignItems: "center",
              }}
              activeOpacity={1}
              onPressOut={() => setShowDatePicker(false)}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  width: "85%",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#5A3827",
                    marginBottom: 10,
                    textAlign: "center",
                  }}
                >
                  Select Delivery Date
                </Text>

                <DateTimePicker
                  value={deliveryDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (event.type === "set" && selectedDate) {
                      const currentYearDate = new Date(selectedDate);
                      currentYearDate.setFullYear(new Date().getFullYear());
                      setDeliveryDate(currentYearDate);
                    }
                    setShowDatePicker(false);
                  }}
                  minimumDate={new Date()}
                  maximumDate={new Date(new Date().getFullYear(), 11, 31)}
                  locale="en-GB"
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF5EF",
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#5A3827",
    textAlign: "center",
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    borderWidth: 1.5,
    borderColor: "#E5D3C2",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFF",
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5A3827",
    marginBottom: 10,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E5D3C2",
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E5D3C2",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5A3827",
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    color: "#5A3827",
    fontWeight: "600",
    marginBottom: 6,
  },
  itemQuantity: {
    fontSize: 16,
    color: "#7B6D63",
    backgroundColor: "#F8F1E7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E5D3C2",
  },
  deliveryDetailsBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F1E7",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5D3C2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  deliveryName: { fontSize: 16, color: "#5A3827", fontWeight: "bold" },
  deliveryAddress: { fontSize: 14, color: "#7B6D63", lineHeight: 20 },
  shippingOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAEDE1",
    padding: 12,
    borderRadius: 10,
  },
  shippingText: { fontSize: 14, color: "#5A3827", fontWeight: "bold" },
  promoContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5D3C2",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFF",
    padding: 9,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  promoInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#5A3827",
  },
  applyButton: {
    backgroundColor: "#5A3827",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  paymentContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5A3827",
    marginBottom: 10,
  },
  cashPayment: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F8F1E7",
  },
  paymentText: { fontSize: 16, color: "#5A3827", marginLeft: 10 },
  checkoutContainer: { marginTop: 20, alignItems: "center" },
  totalText: { fontSize: 20, fontWeight: "bold", color: "#5A3827" },
  checkoutButton: {
    backgroundColor: "#5A3827",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    width: "100%",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5A3827",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#7B6D63",
    marginBottom: 10,
  },
  modalCloseButton: {
    backgroundColor: "#D9534F",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#FAEDE1",
    marginVertical: 5,
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E5D3C2",
  },
  selectedOption: {
    backgroundColor: "#5A3827",
    borderColor: "#5A3827",
  },
  addressItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5D3C2",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedAddress: {
    borderColor: "#5A3827",
    borderWidth: 2,
    backgroundColor: "#F8F1E7",
  },
  loading: { marginTop: 20 },
  emptyMessage: {
    fontSize: 18,
    color: "#6b4226",
    textAlign: "center",
    marginTop: 20,
  },
  noAddressContainer: {
    alignItems: "center",
    padding: 20,
  },
  noAddressText: {
    fontSize: 16,
    color: "#6b4226",
    marginBottom: 10,
  },
  addAddressButton: {
    backgroundColor: "#6b4226",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
  },
  addAddressText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#6b4226",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deliveryDateBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F1E7",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5D3C2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  deliveryDateText: {
    fontSize: 16,
    color: "#5A3827",
    fontWeight: "bold",
  },
  summaryContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5A3827",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5D3C2",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#7B6D63",
  },
  summaryValue: {
    fontSize: 16,
    color: "#5A3827",
    fontWeight: "500",
  },
  discountValue: {
    color: "#28a745",
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#E5D3C2",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5A3827",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5A3827",
  },
});
