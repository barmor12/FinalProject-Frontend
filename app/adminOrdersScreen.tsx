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
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./_layout";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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

  // ניצור מערך הזמנות מסוננות לפי פילטר
  const filteredOrders =
    filterStatus === "all"
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

      {/* ⏳ כפתור מיון לפי תאריך */}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
      >
        <Text style={styles.sortButtonText}>
          Sort by Date ({sortOrder === "asc" ? "Oldest" : "Newest"})
        </Text>
      </TouchableOpacity>

      {/* 📌 כפתורי פילטר לפי סטטוס */}
      <View style={styles.filterContainer}>
        {["all", "pending", "confirmed", "delivered", "cancelled"].map(
          (status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.activeFilter,
              ]}
              onPress={() => setFilterStatus(status as Order["status"])}
            >
              <Text style={styles.filterButtonText}>
                {status === "all"
                  ? "All"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* 🛒 טבלת כותרות */}
      <View style={styles.tableHeader}>
        <Text style={styles.priorityHeaderCell}></Text>
        <Text style={styles.headerCell}>Order ID</Text>
        <Text style={styles.headerCell}>Order Date</Text>
        <Text style={styles.statusHeaderCell}>Status</Text>
        <Text style={styles.nameHeaderCell}>Customer Name</Text>
      </View>

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
              <Text style={styles.cell}>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f3ea" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#6b4226",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  headerCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "right",
    minWidth: 70,
  },
  nameHeaderCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    paddingRight: 30,
    minWidth: 120,
  },
  statusHeaderCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "right",
    paddingRight: 25,
    minWidth: 120,
  },
  scrollViewContent: { paddingBottom: 120 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    marginVertical: 5,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  cell: { flex: 1, textAlign: "center", color: "#6b4226", minWidth: 70 },
  pending: { color: "#FFA500", fontWeight: "bold" },
  confirmed: { color: "#007bff", fontWeight: "bold" },
  delivered: { color: "#28a745", fontWeight: "bold" },
  cancelled: { color: "#d9534f", fontWeight: "bold" },
  menuButton: {
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#f9f3ea",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 10,
  },
  modalSubTitle: { fontSize: 16, color: "#6b4226", marginBottom: 10 },
  input: {
    width: "100%",
    height: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    textAlignVertical: "top",
  },
  sendButton: {
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
  sendButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  closeButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  filterButton: { padding: 10, backgroundColor: "#ddd", borderRadius: 5 },
  activeFilter: { backgroundColor: "#6b4226" },
  filterButtonText: { color: "#fff", fontWeight: "bold" },
  modalButton: {
    padding: 10,
    backgroundColor: "#fff",
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
    borderRadius: 8,
  },
  selectedStatus: { backgroundColor: "#D2B48C" },
  modalButtonClose: {
    padding: 10,
    backgroundColor: "#d9534f",
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
    borderRadius: 8,
  },
  modalButtonConfirm: {
    padding: 12,
    backgroundColor: "#32CD32",
    marginTop: 10,
    width: "100%",
    alignItems: "center",
    borderRadius: 8,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    textAlign: "right",
  },
  sortButton: {
    padding: 10,
    backgroundColor: "#6b4226",
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  sortButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  priorityHeaderCell: {
    width: 10,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  priorityButton: {
    width: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  priorityRow: {
    backgroundColor: "#fff9e6",
    borderLeftWidth: 4,
    borderLeftColor: "#FFD700",
  },
});
