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
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import styles from "../app/styles/CheckoutScreenStyles" // Import your styles

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

interface CreditCard {
  id: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cardType: 'visa' | 'mastercard';
  isDefault?: boolean;
}

export default function CheckoutScreen() {
  const params = useLocalSearchParams();
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  // New state for pickup option
  const [selectedPickupOption, setSelectedPickupOption] = useState<"Pick Up Today" | "Pick Up Another Day" | null>(null);

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

      const data: Address[] = await response.json(); 
      setAddresses(data);


      const defaultAddress = data.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Alert.alert("Error", "Failed to fetch addresses.");
    }
  };


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

  const fetchCreditCards = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${config.BASE_URL}/auth/credit-cards`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credit cards');
      }

      const data = await response.json();
      const cards = data.cards || [];
      setCreditCards(cards);

      // Find and set the default card
      const defaultCard = cards.find((card: CreditCard) => card.isDefault);
      if (defaultCard) {
        setSelectedCard(defaultCard);
      } else if (cards.length > 0) {
        // If no default card but cards exist, select the first one
        setSelectedCard(cards[0]);
      }
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    }
  };

  useEffect(() => {
    fetchCartItems();
    fetchCreditCards();
    // Reset to cash payment
    setPaymentMethod('cash');
    setSelectedCard(null);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchCartItems();
      // Reset to cash payment
      setPaymentMethod('cash');
      setSelectedCard(null);
    }, [])
  );

  // Reset payment method when coming from cart
  useEffect(() => {
    if (params.newCheckout === "true") {
      setPaymentMethod('cash');
      setSelectedCard(null);
    }
  }, [params.newCheckout]);

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
      if (paymentMethod === 'credit' && !selectedCard) {
        Alert.alert("Error", "Please select a credit card.");
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const deliveryDateTime = new Date(deliveryDate ?? new Date());
      deliveryDateTime.setHours(0, 0, 0, 0);

      const year = deliveryDateTime.getFullYear();
      const month = String(deliveryDateTime.getMonth() + 1).padStart(2, "0");
      const day = String(deliveryDateTime.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const body: any = {
        items: cartItems.map((item) => ({
          cakeId: item.cake._id,
          quantity: item.quantity,
        })),
        paymentMethod,
        shippingMethod,
      };

      if (paymentMethod === 'credit') {
        body.creditCardId = selectedCard?.id;
      }

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
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 10, alignSelf: "flex-start" }}>
            <View style={{
              backgroundColor: "#d49a6a",
              padding: 8,
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2,
            }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
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

              {/* Pickup Option Buttons for Self Pickup */}
              {shippingMethod === "Self Pickup" && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.inputLabel}>Pickup Options:</Text>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      selectedPickupOption === "Pick Up Today" && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedPickupOption("Pick Up Today")}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      selectedPickupOption === "Pick Up Today" && { color: "#fff" }
                    ]}>
                      Pick Up Today
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      selectedPickupOption === "Pick Up Another Day" && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedPickupOption("Pick Up Another Day")}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      selectedPickupOption === "Pick Up Another Day" && { color: "#fff" }
                    ]}>
                      Pick Up Another Day
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Delivery Date Section - show only for Future Delivery, or Self Pickup + Pick Up Another Day */}
              {(shippingMethod === "Future Delivery" ||
                (shippingMethod === "Self Pickup" && selectedPickupOption === "Pick Up Another Day")) && (
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
                  {/* Inline DateTimePicker instead of Modal */}
                  {showDatePicker && (
                    <View style={{ paddingBottom: 250 }}>
                      <DateTimePicker
                        value={deliveryDate || new Date()}
                        mode="date"
                        display={Platform.OS === "android" ? "calendar" : "spinner"}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === "android") {
                            setShowDatePicker(false);
                          }
                          if (selectedDate) {
                            const currentYearDate = new Date(selectedDate);
                            currentYearDate.setFullYear(new Date().getFullYear());
                            setDeliveryDate(currentYearDate);
                          }
                        }}
                        minimumDate={new Date()}
                        maximumDate={new Date(new Date().getFullYear(), 11, 31)}
                        locale="en-GB"
                      />
                    </View>
                  )}
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
                <View style={styles.paymentOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paymentOptionButton,
                      paymentMethod === 'cash' && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setPaymentMethod('cash');
                      setSelectedCard(null);
                    }}
                  >
                    <Ionicons name="cash-outline" size={24} color={paymentMethod === 'cash' ? "#fff" : "#6b4226"} />
                    <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.selectedOptionText]}>Cash</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentOptionButton,
                      paymentMethod === 'credit' && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setPaymentMethod('credit');
                      if (creditCards.length === 0) {
                        Alert.alert(
                          "No Credit Cards",
                          "Please add a credit card in your profile first.",
                          [
                            {
                              text: "Add Card",
                              onPress: () => router.push("/CreditCardScreen"),
                            },
                            { text: "Cancel", style: "cancel" },
                          ]
                        );
                      } else if (!selectedCard) {
                        // Only show card selector if no default card exists
                        const defaultCard = creditCards.find(card => card.isDefault);
                        if (!defaultCard) {
                          Alert.alert(
                            "Select Credit Card",
                            "Choose a credit card to use",
                            creditCards.map((card) => ({
                              text: `**** **** **** ${card.cardNumber.slice(-4)}`,
                              onPress: () => setSelectedCard(card),
                            }))
                          );
                        } else {
                          // If there's a default card, select it automatically
                          setSelectedCard(defaultCard);
                        }
                      }
                    }}
                  >
                    <Ionicons name="card-outline" size={24} color={paymentMethod === 'credit' ? "#fff" : "#6b4226"} />
                    <Text style={[styles.paymentText, paymentMethod === 'credit' && styles.selectedOptionText]}>
                      {selectedCard ? `**** **** **** ${selectedCard.cardNumber.slice(-4)}` : 'Credit Card'}
                    </Text>
                  </TouchableOpacity>
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
          visible={shippingModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setShippingModalVisible(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }]}>
            <Text style={[styles.modalTitle, { fontSize: 20, fontWeight: "700", color: "#6b4226", marginBottom: 20 }]}>Choose Shipping Method</Text>

            {/* Option Button */}
            {[
              {
                label: "Standard Delivery (2-3 Days)",
                value: "Standard Delivery",
                icon: "cube-outline",
              },
              {
                label: "Future Delivery (Pick a Date)",
                value: "Future Delivery",
                icon: "calendar-outline",
              },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalButton,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: shippingMethod === option.value ? "#6b4226" : "#f4e3d7",
                    marginBottom: 12,
                  },
                ]}
                onPress={() => {
                  setShippingMethod(option.value);
                  setDeliveryDate(null);
                  setShippingModalVisible(false);
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={22}
                  color={shippingMethod === option.value ? "#fff" : "#6b4226"}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    color: shippingMethod === option.value ? "#fff" : "#6b4226",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Self Pickup */}
            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: shippingMethod === "Self Pickup" ? "#6b4226" : "#f4e3d7",
                  marginBottom: 12,
                },
              ]}
              onPress={() => {
                setShippingMethod("Self Pickup");
                setSelectedPickupOption(null);
                setDeliveryDate(null);
                setShippingModalVisible(false);
              }}
            >
              <Ionicons
                name="storefront-outline"
                size={22}
                color={shippingMethod === "Self Pickup" ? "#fff" : "#6b4226"}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: shippingMethod === "Self Pickup" ? "#fff" : "#6b4226",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Self Pickup
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShippingModalVisible(false)}
              style={{
                marginTop: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#888", fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
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

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}