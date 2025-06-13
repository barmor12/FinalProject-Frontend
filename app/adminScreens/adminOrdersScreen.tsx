import React, { useCallback, useEffect, useState } from "react";
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
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../_layout";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/AdminScreensStyles/adminOrdersScreenStyles";

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [managerMessage, setManagerMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "confirmed" | "delivered" | "cancelled"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);

  // ניצור מערך הזמנות מסוננות לפי פילטר
  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter((order) => order.status === filterStatus);
  const searchedOrders = filteredOrders.filter((order) => {
    // If search is empty, show all orders including those with deleted users
    if (!searchQuery.trim()) return true;

    // If user is deleted and we're searching, don't include in results
    if (!order.user) return false;

    // Search in user name
    return `${order.user.firstName || "Unknown"} ${order.user.lastName || "User"}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  // Sort by priority first, then by date
  const sortedOrders = [...searchedOrders].sort((a, b) => {
    // First sort by priority
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;

    // Then sort by date
    return sortOrder === "asc"
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  interface Order {
    _id: string;
    status: "pending" | "confirmed" | "delivered" | "cancelled";
    user?: { _id: string; firstName: string; lastName: string; email: string };
    items: { cake: string; quantity: number }[];
    totalPrice: number;
    createdAt: string;
    isPriority?: boolean;
  }
  type AdminOrdersScreenRouteProp = RouteProp<
    { AdminOrdersScreen: { shouldRefresh?: boolean } },
    "AdminOrdersScreen"
  >;
  const route = useRoute<AdminOrdersScreenRouteProp>();

  const { shouldRefresh } = route.params || {};

  useFocusEffect(
    useCallback(() => {
      if (shouldRefresh) {
        fetchOrders();
        navigation.setParams({ shouldRefresh: false });
      }
    }, [shouldRefresh])
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      Alert.alert("Error", "Authorization token is required");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(`${config.BASE_URL}/order/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: Order[] = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      Alert.alert("Error", "Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const deleteOrders = async (orderId: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      Alert.alert("Error", "Authorization token is required");
      return;
    }

    try {
      const response = await fetch(
        `${config.BASE_URL}/order/delete/${orderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      Alert.alert("Success", "Order deleted successfully.");
      fetchOrders();
    } catch (error) {
      console.error("❌ Error deleting order:", error);
      Alert.alert("Error", "Failed to delete order.");
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders().finally(() => setRefreshing(false));
  }, [fetchOrders]);

  const openOrderMenu = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );
  const updateOrderStatus = async () => {
    if (!selectedStatus) {
      Alert.alert("Error", "Please select a status.");
      return;
    }

    if (!selectedOrder) {
      Alert.alert("Error", "No order selected.");
      return;
    }

    const newStatus: Order["status"] = selectedStatus as Order["status"];

    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      Alert.alert("Error", "Authorization token is required");
      return;
    }

    try {
      const response = await fetch(
        `${config.BASE_URL}/order/${selectedOrder._id}/status`,
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

      // עדכון סטטוס ההזמנה במערך המקומי
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === selectedOrder._id
            ? { ...order, status: newStatus }
            : order
        )
      );

      setStatusModalVisible(false);
      setModalVisible(false);

      // אם הסטטוס החדש הוא delivered – שליחת מייל לבקשת ביקורת
      if (newStatus === "delivered" && selectedOrder.user?.email) {
        console.log("sending review email....");
        const reviewResponse = await fetch(
          `${config.BASE_URL}/sendEmail/${selectedOrder._id}/send-review-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              customerEmail: selectedOrder.user.email,
              orderId: selectedOrder._id,
            }),
          }
        );

        if (!reviewResponse.ok) {
          console.error(
            "❌ Failed to send review email:",
            await reviewResponse.text()
          );
        } else {
          console.log("✅ Review email sent successfully.");
        }
      }
    } catch (error) {
      console.error("❌ Error updating order:", error);
      Alert.alert("Error", "Failed to update order status.");
    }
  };

  const sendOrderEmail = async (managerMessage: string, hasMsg: boolean) => {
    if (!selectedOrder) {
      Alert.alert("Error", "No order selected.");
      return;
    }

    if (!selectedOrder.user?.email) {
      Alert.alert("Error", "Customer email is missing.");
      return;
    }

    if (!selectedOrder.status) {
      Alert.alert("Error", "Order status is missing.");
      return;
    }

    if (hasMsg && !managerMessage.trim()) {
      Alert.alert("Error", "Please enter a message.");
      return;
    }

    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      Alert.alert("Error", "Authorization token is required");
      return;
    }

    try {
      const response = await fetch(
        `${config.BASE_URL}/order/${selectedOrder._id}/send-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerEmail: selectedOrder.user.email,
            orderStatus: selectedOrder.status,
            managerMessage,
            isManagerMessage: hasMsg,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      Alert.alert("Success", "Email sent successfully to the customer!");
      setEmailModalVisible(false);
      setManagerMessage("");
    } catch (error: any) {
      console.error("❌ Error sending email:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to send email. Please try again."
      );
    }
  };

  const togglePriority = async (
    orderId: string,
    currentPriority: boolean = false
  ) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "Authorization token is required");
        return;
      }

      // Update locally first for immediate UI feedback
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? { ...order, isPriority: !currentPriority }
            : order
        )
      );

      // Then save to backend
      const response = await fetch(
        `${config.BASE_URL}/admin/orders/${orderId}/priority`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isPriority: !currentPriority }),
        }
      );

      if (!response.ok) {
        // Revert if the server update fails
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? { ...order, isPriority: currentPriority }
              : order
          )
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Only show feedback on successful priority change
      if (!currentPriority) {
        Alert.alert("Priority Set", "Order has been marked as priority");
      }
    } catch (error) {
      console.error("❌ Error updating order priority:", error);
      Alert.alert("Error", "Failed to update order priority");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Orders</Text>

      {/* 🔍 שדה חיפוש לפי שם לקוח */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by customer name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* 🛒 טבלת כותרות */}
      <View style={styles.tableHeader}>
        <Text style={styles.priorityHeaderCell}></Text>
        <Text style={styles.headerCell}>Order ID</Text>
        <TouchableOpacity
          style={styles.headerCell}
          onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <Text style={styles.headerCellText}>
            Order Date {sortOrder === "asc" ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statusHeaderCell}
          onPress={() => setStatusDropdownVisible(!statusDropdownVisible)}
        >
          <Text style={styles.headerCellText}>Status ▼</Text>
        </TouchableOpacity>
        <Text style={styles.nameHeaderCell}>Customer Name</Text>
      </View>

      {/* Status Dropdown */}
      {statusDropdownVisible && (
        <View style={styles.statusDropdown}>
          {["all", "pending", "confirmed", "delivered", "cancelled"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusDropdownItem,
                filterStatus === status && styles.selectedStatus,
              ]}
              onPress={() => {
                setFilterStatus(status as Order["status"]);
                setStatusDropdownVisible(false);
              }}
            >
              <Text style={styles.statusDropdownText}>
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 📜 רשימת הזמנות */}
      {loading ? (
        <ActivityIndicator size="large" color="#6b4226" />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {sortedOrders.map((order) => (
            <TouchableOpacity
              key={order._id}
              style={[styles.row, order.isPriority && styles.priorityRow]}
              onPress={() =>
                navigation.navigate("OrderDetailsScreen", {
                  orderId: order._id,
                })
              }
            >
              <TouchableOpacity
                style={styles.priorityButton}
                onPress={() => togglePriority(order._id, order.isPriority)}
              >
                <Ionicons
                  name={order.isPriority ? "star" : "star-outline"}
                  size={20}
                  color={order.isPriority ? "#FFD700" : "#6b4226"}
                />
              </TouchableOpacity>
              <Text style={styles.cell}>{order._id.slice(-6)}</Text>
              <Text style={styles.cell}>
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
              <Text style={[styles.cell, styles[order.status]]}>
                {order.status}
              </Text>
              <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">
                {order.user
                  ? `${order.user.firstName || "Unknown"} ${order.user.lastName || "User"}`
                  : "Deleted User"}
              </Text>
              {/* כפתור תפריט 3 נקודות */}
              <TouchableOpacity
                onPress={() => openOrderMenu(order)}
                style={styles.menuButton}
              >
                <Text style={styles.menuText}>⋮</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 📌 מודאל תפריט להזמנה */}
      {selectedOrder && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Order Actions</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  togglePriority(selectedOrder._id, selectedOrder.isPriority);
                  setModalVisible(false);
                }}
              >
                <Text>
                  {selectedOrder.isPriority
                    ? "Remove Priority"
                    : "Mark as Priority"}
                </Text>
              </TouchableOpacity>

              {/* Only show update status if user exists */}
              {selectedOrder.user && (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setStatusModalVisible(true);
                    setModalVisible(false);
                  }}
                >
                  <Text>Update Status</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  if (selectedOrder) deleteOrders(selectedOrder._id);
                  setModalVisible(false);
                }}
              >
                <Text>Delete Order</Text>
              </TouchableOpacity>

              {/* Only show send message if user exists */}
              {selectedOrder.user && (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setModalVisible(false);
                    setTimeout(() => setEmailModalVisible(true), 300);
                  }}
                >
                  <Text>Send Message</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalButtonClose}
                onPress={() => setModalVisible(false)}
              >
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 🔄 מודאל עדכון סטטוס */}
      <Modal
        transparent={true}
        visible={statusModalVisible}
        animationType="slide"
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
                  onPress={() => setSelectedStatus(status as Order["status"])}
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
              onPress={() => setStatusModalVisible(false)}
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✉️ מודאל שליחת הודעה */}
      <Modal
        transparent={true}
        visible={emailModalVisible}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Email to Customer</Text>
            <Text style={styles.modalSubTitle}>
              Customer Email: {selectedOrder?.user?.email || "N/A"}
            </Text>
            <Text style={styles.modalSubTitle}>
              Order Status: {selectedOrder?.status || "N/A"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your message..."
              multiline
              value={managerMessage}
              onChangeText={setManagerMessage}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() =>
                selectedOrder?.user?.email
                  ? sendOrderEmail(managerMessage, true)
                  : Alert.alert("Error", "Cannot send email to deleted user")
              }
            >
              <Text style={styles.sendButtonText}>Send Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEmailModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

