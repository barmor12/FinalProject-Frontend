import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  Image,
  TextInput,
  Dimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import styles from "../app/styles/OrderDetailsScreenStyles"; // Importing styles
import BackButton from "../components/BackButton";

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
  user?: { firstName: string; lastName: string; email: string };
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
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: Order = await response.json();
      console.log("📦 Order Details:", data);
      setOrder(data);
    } catch (error) {
      console.error("❌ Error fetching order:", error);
      Alert.alert("Error", "Failed to load order details.");
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
          <ActivityIndicator size="large" color="#6b4226" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!order) {
    return <Text style={styles.errorText}>Order not found.</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Order #{order._id.slice(-6)}</Text>
      <Text style={styles.subTitle}>
        Customer:{" "}
        {order.user
          ? `${order.user.firstName} ${order.user.lastName}`
          : "Deleted User"}
      </Text>
      <Text style={styles.subTitle}>
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
            ? new Date(order.deliveryDate).toLocaleDateString()
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

      <Text style={styles.totalPrice}>Total Price: ${order.totalPrice}</Text>

      {/* Only show update status and send message if user exists */}
      {order.user && (
        <>
          <TouchableOpacity
            style={styles.updateStatusButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.updateStatusText}>Update Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.updateStatusButton}
            onPress={() => setMessageModalVisible(true)}
          >
            <Text style={styles.updateStatusText}>Send Message</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.contactButton}
        onPress={() => setContactModalVisible(true)}
      >
        <Text style={styles.contactText}>View Contact Details</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            {["pending", "confirmed", "delivered", "cancelled"].map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.modalButton,
                    selectedStatus === status && styles.selectedStatus,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text>{status}</Text>
                </TouchableOpacity>
              )
            )}
            <TouchableOpacity
              style={styles.modalButtonConfirm}
              onPress={updateOrderStatus}
            >
              <Text>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonClose}
              onPress={() => setModalVisible(false)}
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              {order.address?.fullName || "N/A"}
            </Text>
            <Text style={styles.contactInfo}>
              Phone: {order.address?.phone || "N/A"}
            </Text>
            <Text style={styles.contactInfo}>
              Address: {order.address?.street || "N/A"},{" "}
              {order.address?.city || "N/A"}, {order.address?.zipCode || "N/A"},{" "}
              {order.address?.country || "N/A"}
            </Text>
            <Text style={styles.contactInfo}>
              Email: {order.user?.email || "N/A"}
            </Text>
            <TouchableOpacity
              style={styles.modalButtonClose}
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
              style={styles.input}
              placeholder="Enter your message..."
              multiline
              value={managerMessage}
              onChangeText={setManagerMessage}
            />
            <TouchableOpacity
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

