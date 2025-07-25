import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  TextInput,
  Linking,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import styles from "../../app/styles/OrderDetailsScreenStyles"; // Importing styles
import Header from "../../components/Header";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import { Ionicons } from "@expo/vector-icons";

interface Cake {
  _id: string;
  name: string;
  image: {
    public_id: string;
    url: string;
  };
}
interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
}
interface Order {
  _id: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  user?: { firstName: string; lastName: string; email: string, phone: string };
  address: Address;
  items: { cake: Cake; quantity: number }[];
  totalPrice: number;
  createdAt: string;
  shippingMethod?: string;
  deliveryDate?: string;
}

export default function OrderDetailsScreen() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [managerMessage, setManagerMessage] = useState("");
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const navigation = useNavigation();

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      Alert.alert("Error", "Authorization token is required");
      return;
    }
    try {
      const response = await fetch(`${config.BASE_URL}/order/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        Alert.alert(
          "Order Not Found",
          "This order no longer exists. It may have been deleted.",
          [
            {
              text: "Go Back",
              onPress: () => navigation.goBack()
            }
          ]
        );
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: Order = await response.json();
      console.log("📦 Order Details:", data);
      setOrder(data);
    } catch (error) {
      console.error("❌ Error fetching order:", error);
      Alert.alert(
        "Error",
        "Failed to load order details. The order may have been deleted.",
        [
          {
            text: "Go Back",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };


  const sendReviewEmail = async (
    orderId: string | undefined,
    customerEmail: string | undefined
  ) => {
    try {
      // Check if orderId and customerEmail are valid
      if (!orderId || !customerEmail) {
        console.error(
          "❌ Cannot send review email: Missing orderId or customerEmail"
        );
        return;
      }

      console.log("Sending review email...");
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "Authorization token is required");
        return;
      }
      const response = await fetch(
        `${config.BASE_URL}/sendEmail/${orderId}/send-review-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerEmail,
            orderId,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to send review email");
      }
      console.log("✅ Review email sent successfully.");
    } catch (error: any) {
      console.error("❌ Error sending review email:", error.message);
    }
  };

  // Function to update order status
  const updateOrderStatus = async () => {
    if (!selectedStatus) {
      Alert.alert("Error", "Please select a status.");
      return;
    }

    if (!order || !order._id) {
      Alert.alert("Error", "Order data is unavailable");
      return;
    }

    const newStatus = selectedStatus as
      | "pending"
      | "confirmed"
      | "delivered"
      | "cancelled";
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      Alert.alert("Error", "Authorization token is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${config.BASE_URL}/order/${order._id}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      Alert.alert("Success", "Order status updated successfully.");
      setOrder((prevOrder) =>
        prevOrder ? { ...prevOrder, status: newStatus } : prevOrder
      );
      setModalVisible(false);


      if (newStatus === "delivered" && order && order.user?.email) {
        await sendReviewEmail(order._id, order.user.email);
      }
      navigation.goBack();
    } catch (error: any) {
      console.error("❌ Error updating order:", error.message);
      Alert.alert("Error", "Failed to update order status.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingHeader}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
          <View style={styles.skeletonSubtitle} />
        </View>

        <ScrollView contentContainerStyle={styles.loadingScrollView}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.skeletonItem}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonDetails}>
                <View style={styles.skeletonText} />
                <View style={styles.skeletonTextShort} />
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.loadingFooter}>
          <View style={styles.skeletonPrice} />
          <View style={styles.skeletonButton} />
          <View style={styles.skeletonButton} />
          <View
            style={[styles.skeletonButton, { backgroundColor: "#D2B48C50" }]}
          />
        </View>

        <View style={styles.loadingOverlay}>
          <ActivityIndicator testID="loading-indicator"
            size="large" color="#6b4226" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!order) {
    return <Text style={styles.errorText}>Order not found.</Text>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#f9f3ea" }]}>
      <Header title={`Order #${order._id.slice(-6)}`} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text testID="customer-text" style={styles.subTitle}>
          Customer:{" "}
          {order.user
            ? `${order.user.firstName} ${order.user.lastName}`
            : "Deleted User"}
        </Text>
        <Text testID="status-text" style={styles.subTitle}>
          Status:{" "}
          <Text style={[styles.status, styles[order.status]]}>
            {order.status}
          </Text>
        </Text>

        <View
          style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >

          <Text
            style={[styles.subTitle, { fontWeight: "bold", marginBottom: 5 }]}
          >
            📦 Shipping Method:
          </Text>
          <Text style={styles.subTitle}>
            {order.shippingMethod
              ? order.shippingMethod
              : order.address
                ? "Standard Delivery (2-3 days)"
                : "Self Pickup"}
          </Text>

          <Text style={[styles.subTitle, { fontWeight: "bold", marginTop: 10 }]}>
            📅 {order.address ? "Delivery Date" : "Pickup Date"}:
          </Text>
          <Text style={styles.subTitle}>
            {order.deliveryDate
              ? (() => {
                const d = new Date(order.deliveryDate);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = String(d.getFullYear()).slice(-2);
                return `${day}/${month}/${year}`;
              })()
              : order.shippingMethod === "Self Pickup"
                ? "Pickup date not selected"
                : "Delivery date not selected"}
          </Text>

          <Text style={[styles.subTitle, { fontWeight: "bold", marginTop: 10 }]}>
            🏠 Delivery Address:
          </Text>
          <Text style={styles.subTitle}>
            {order.address
              ? `${order.address.fullName}, ${order.address.street}, ${order.address.city}`
              : "Pickup at store"}
          </Text>

          {order.address?.phone && (
            <>
              <Text
                style={[styles.subTitle, { fontWeight: "bold", marginTop: 10 }]}
              >
                📞 Phone:
              </Text>
              <Text style={styles.subTitle}>{order.address.phone}</Text>
            </>
          )}
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>📦 Products in Order</Text>
          <ScrollView contentContainerStyle={styles.scrollView}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                {item.cake?.image?.url ? (
                  <Image
                    source={{ uri: item.cake.image.url }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ color: "#999" }}>No image available</Text>
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>
                    {item.cake?.name || "Unknown Cake"}
                  </Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <Text testID="total-text" style={styles.totalPrice}>Total Price: ${order.totalPrice}</Text>

        {/* Only show update status and send message if user exists */}
        {order.user && (
          <>
            <TouchableOpacity
              testID="update-status-button"
              style={styles.updateStatusButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.updateStatusText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="send-message-button"
              style={styles.updateStatusButton}
              onPress={() => setMessageModalVisible(true)}
            >
              <Text style={styles.updateStatusText}>Send Message</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.contactButton}
          testID="view-contact-button"
          onPress={() => setContactModalVisible(true)}
        >
          <Text style={styles.contactText}>View Contact Details</Text>
        </TouchableOpacity>
      </ScrollView>

      <StatusUpdateModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onConfirm={updateOrderStatus}

      />

      <Modal
        transparent={true}
        visible={contactModalVisible}
        animationType="slide"

        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customer Contact Details</Text>
            <Text style={styles.contactInfo}>
              {order.address?.fullName || ([order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ")) || "N/A"}
            </Text>
            <Text style={styles.contactInfo}>
              Phone: {order.address?.phone || order.user?.phone || "N/A"}
            </Text>
            {order.shippingMethod !== "Self Pickup" && order.address?.street && (
              <Text style={styles.contactInfo}>
                Address: {[
                  order.address?.street,
                  order.address?.city,
                  order.address?.zipCode,
                  order.address?.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
            <Text style={styles.contactInfo}>
              Email: {order.user?.email || "N/A"}
            </Text>
            {order.address?.phone && (
              <View style={styles.contactButtonsContainer}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => {
                    try {
                      const phoneNumber = order.address.phone;
                      if (phoneNumber) {
                        Linking.openURL(`tel:${phoneNumber}`);
                      } else {
                        Alert.alert("שגיאה", "מספר הטלפון אינו זמין");
                      }
                    } catch (error) {
                      console.error('Error opening phone:', error);
                      Alert.alert("שגיאה", "לא ניתן לפתוח את הטלפון");
                    }
                  }}
                >
                  <Ionicons name="call" size={20} color="#007bff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => {
                    try {
                      let phone = order.address.phone.replace(/[^0-9]/g, '');

                      // אם המספר מתחיל ב-0, נחליף אותו ב-972
                      if (phone.startsWith('0')) {
                        phone = '972' + phone.substring(1);
                      }
                      // אם המספר לא מתחיל ב-972, נוסיף אותו
                      else if (!phone.startsWith('972')) {
                        phone = '972' + phone;
                      }

                      if (phone.length >= 12) { // 972 + 9 digits
                        const whatsappUrl = `https://wa.me/${phone}`;
                        console.log('Opening WhatsApp with URL:', whatsappUrl);
                        Linking.openURL(whatsappUrl);
                      } else {
                        Alert.alert("שגיאה", "מספר הטלפון אינו תקין");
                      }
                    } catch (error) {
                      console.error('Error opening WhatsApp:', error);
                      Alert.alert("שגיאה", "לא ניתן לפתוח את WhatsApp");
                    }
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.modalButtonClose}
              testID="close-contact-button"
              onPress={() => setContactModalVisible(false)}
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={messageModalVisible}
        animationType="slide"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Message to Customer</Text>
            <TextInput
              testID="manager-message-input"
              style={styles.input}
              placeholder="Enter your message..."
              multiline
              value={managerMessage}
              onChangeText={setManagerMessage}
            />
            <TouchableOpacity
              testID="send-manager-message-button"
              style={styles.modalButtonConfirm}
              onPress={async () => {
                if (!managerMessage.trim()) {
                  Alert.alert("Error", "Please enter a message.");
                  return;
                }
                const token = await AsyncStorage.getItem("accessToken");
                if (!token) {
                  Alert.alert("Error", "Authorization token is required");
                  return;
                }
                try {
                  const customerEmail = order.user?.email;
                  if (!customerEmail) {
                    Alert.alert("Error", "Customer email not found");
                    return;
                  }

                  const response = await fetch(
                    `${config.BASE_URL}/sendEmail/${customerEmail}/message`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        customerEmail,
                        managerMessage,
                        isManagerMsg: true,
                      }),
                    }
                  );
                  const data = await response.json();
                  if (!response.ok) {
                    throw new Error(data.error || "Failed to send message");
                  }
                  Alert.alert(
                    "Success",
                    "Message sent successfully to the customer!"
                  );
                  setManagerMessage("");
                  setMessageModalVisible(false);
                } catch (error: any) {
                  console.error("❌ Error sending message:", error);
                  Alert.alert(
                    "Error",
                    error.message || "Failed to send message."
                  );
                }
              }}
            >
              <Text style={styles.updateStatusText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="close-manager-message-button"
              style={styles.modalButtonClose}
              onPress={() => setMessageModalVisible(false)}

            >
              <Text style={styles.updateStatusText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

