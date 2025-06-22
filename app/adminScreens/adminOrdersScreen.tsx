import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  TextInput,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../_layout";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/AdminScreensStyles/adminOrdersScreenStyles";
import Header from "../../components/Header";

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
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

  // fetchOrders must be defined before use in hooks
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
    }, [shouldRefresh, fetchOrders, navigation])
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
    <SafeAreaView style={[styles.container, { paddingTop: 40, backgroundColor: "#f7efe5" }]}>
      {/* Header component */}
      <Header title="Manage Orders" style={{ backgroundColor: 'transparent' }} />

      {/* Filters + search grouped visually */}
      <View style={styles.filterGroupWrapper}>
        {/* Filter buttons row */}
        <View style={styles.filterContainer}>
          {/* Status filter button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus !== "all" && { backgroundColor: "#ffe3b2" },
            ]}
            onPress={() => setStatusDropdownVisible(!statusDropdownVisible)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="options-outline" size={18} color="#6b4226" />
              <Text style={{ color: "#6b4226", fontWeight: "bold", fontSize: 15, marginLeft: 4 }}>
                {filterStatus === "all"
                  ? "Status: All"
                  : filterStatus === "pending"
                  ? "Status: Pending"
                  : filterStatus === "confirmed"
                  ? "Status: Confirmed"
                  : filterStatus === "delivered"
                  ? "Status: Delivered"
                  : "Status: Cancelled"}
              </Text>
              <Ionicons name={statusDropdownVisible ? "chevron-up" : "chevron-down"} size={18} color="#6b4226" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>
          {/* Sort by date button */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="calendar-outline" size={17} color="#6b4226" />
              <Text style={{ color: "#6b4226", fontWeight: "bold", fontSize: 15, marginLeft: 4 }}>
                {sortOrder === "asc" ? "Sort by: Oldest" : "Sort by: Newest"}
              </Text>
              <Ionicons name={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size={15} color="#6b4226" style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
        </View>
        {/* Search bar below filters */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#bdbdbd" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by customer name"
            style={styles.searchInput}
            placeholderTextColor="#888"
            selectionColor="#6b4226"
            value={searchQuery}
            onChangeText={setSearchQuery}
            underlineColorAndroid="transparent"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Modern Status Dropdown */}
      {statusDropdownVisible && (
        <View style={[
          styles.statusDropdown,
          {
            top: 110,
            right: 30,
            width: 180,
            zIndex: 100,
          }
        ]}>
          {[
            { key: "all", label: "Status: All" },
            { key: "pending", label: "Status: Pending" },
            { key: "confirmed", label: "Status: Confirmed" },
            { key: "delivered", label: "Status: Delivered" },
            { key: "cancelled", label: "Status: Cancelled" },
          ].map((status) => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.statusDropdownItem,
                filterStatus === status.key && styles.selectedStatus,
              ]}
              onPress={() => {
                setFilterStatus(status.key as "all" | "pending" | "confirmed" | "delivered" | "cancelled");
                setStatusDropdownVisible(false);
              }}
            >
              <Text style={styles.statusDropdownText}>{status.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Modern order list - cards */}
      {loading ? (
        <ActivityIndicator size="large" color="#6b4226" />
      ) : (
        <ScrollView
          ref={scrollRef}
          onScroll={(event) => {
            const scrollY = event.nativeEvent.contentOffset.y;
            setShowScrollToTop(scrollY > 700);
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {sortedOrders.length === 0 && (
            <Text style={styles.noResultsText}>No orders to display</Text>
          )}
          {sortedOrders.map((order) => (
            <TouchableOpacity
              key={order._id}
              onPress={() =>
                navigation.navigate("OrderDetailsScreen", { orderId: order._id })
              }
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.orderCard,
                  {
                    borderLeftWidth: order.isPriority ? 6 : 0,
                    borderLeftColor: order.isPriority ? "#FFD700" : "transparent",
                  },
                ]}
              >
                {/* Menu button (3 dots) - right side */}
                <TouchableOpacity
                  onPress={() => openOrderMenu(order)}
                  style={styles.menuButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.6}
                  accessibilityLabel="Order menu"
                >
                  <Text style={styles.menuText}>⋮</Text>
                </TouchableOpacity>
                {/* Priority star button (moved after menu button) */}
                <TouchableOpacity
                  style={{
                    marginLeft: 2,
                    marginRight: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    top: 10,
                    right: 50,
                    zIndex: 2,
                  }}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    togglePriority(order._id, order.isPriority);
                  }}
                  accessibilityLabel={order.isPriority ? "Remove Priority" : "Mark as Priority"}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={order.isPriority ? "star" : "star-outline"}
                    size={22}
                    color={order.isPriority ? "#FFD700" : "#bdbdbd"}
                  />
                </TouchableOpacity>
                {/* Customer name */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="person-outline" size={18} color="#6b4226" />
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: "#23232b",
                      maxWidth: "88%",
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {order.user
                      ? `${order.user.firstName || "Unknown"} ${order.user.lastName || "User"}`
                      : "Deleted User"}
                  </Text>
                </View>
                {/* Order ID - between name and star */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="pricetag-outline" size={15} color="#bdbdbd" />
                  <Text style={styles.orderIdText}>#{order._id.slice(-6)}</Text>
                </View>
                {/* Priority star button below name/id (removed, now above after menu button) */}
                {/* Order date */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="calendar-outline" size={17} color="#bdbdbd" />
                  <Text style={{ fontSize: 15, color: "#68686f" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {/* Status */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="checkmark-done-circle-outline" size={17} color="#bdbdbd" />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                      color:
                        order.status === "pending"
                          ? "#ff9800"
                          : order.status === "confirmed"
                          ? "#1976d2"
                          : order.status === "delivered"
                          ? "#43a047"
                          : order.status === "cancelled"
                          ? "#e53935"
                          : "#23232b",
                    }}
                  >
                    {order.status === "pending"
                      ? "Pending"
                      : order.status === "confirmed"
                      ? "Confirmed"
                      : order.status === "delivered"
                      ? "Delivered"
                      : order.status === "cancelled"
                      ? "Cancelled"
                      : order.status}
                  </Text>
                </View>
              </View>
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
      {showScrollToTop && (
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 80,
            right: 20,
            backgroundColor: "rgba(107, 66, 38, 0.6)",
            padding: 12,
            borderRadius: 30,
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            zIndex: 10,
          }}
          onPress={() => {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}


  // Handle press on the entire order card
  // function handleOrderPress(order: Order) {
  //   navigation.navigate("OrderDetailsScreen", { orderId: order._id });
  // }
// הזן טיפוס Order כאן:
type Order = {
  _id: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    [key: string]: any;
  } | null;
  status: string;
  isPriority: boolean;
  createdAt: string;
  total?: number;
  address?: string;
  phone?: string;
  [key: string]: any;
};