import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { Calendar } from "react-native-calendars";
import styles from "../styles/AdminScreensStyles/AdminDashboardScreenStyles";

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<{
    orders: number;
    users: number;
    revenue: number;
  }>({
    orders: 0,
    users: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showCalendar] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // Format: YYYY-MM

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        console.error("No access token found");
        return;
      }

      // Fetch admin stats
      const statsResponse = await axios.get(`${config.BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ordersCount, usersCount, totalRevenue } = statsResponse.data;
      setStats({
        orders: ordersCount,
        users: usersCount,
        revenue: totalRevenue,
      });

      // Fetch orders for current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
      const currentYear = currentDate.getFullYear();

      const ordersResponse = await axios.get(
        `${config.BASE_URL}/order/orders-by-month`,
        {
          params: {
            month: currentMonth,
            year: currentYear,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const fetchedOrders = ordersResponse.data;
      setOrders(fetchedOrders);
      setAllOrders(fetchedOrders);
      setDisplayedOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const fetchOrdersByMonth = async (month: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      const [year, monthNum] = month.split("-");
      const monthNumber = parseInt(monthNum);

      const response = await axios.get(
        `${config.BASE_URL}/order/orders-by-month`,
        {
          params: {
            month: monthNumber,
            year: parseInt(year),
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const fetchedOrders = response.data;
      setOrders(fetchedOrders);
      setAllOrders(fetchedOrders);
      setDisplayedOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch orders by month:", error);
    }
  };

  const fetchOrdersByDate = async (date: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      const response = await axios.get(
        `${config.BASE_URL}/order/orders-by-date?date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Only update displayed orders, keep allOrders for dots
      setDisplayedOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders by date:", error);
    }
  };

  // Create marked dates for calendar with multi-dot support
  const getMarkedDates = () => {
    const markedDates: {
      [key: string]: {
        marked?: boolean;
        dotColor?: string;
        dots?: any[];
        selected?: boolean;
        selectedColor?: string;
      };
    } = {};

    // Group orders by date
    allOrders.forEach((order) => {
      // Mark if order has a deliveryDate, or is pending (even if no deliveryDate)
      if (order.deliveryDate || order.status === "pending") {
        // Use deliveryDate if present, otherwise fallback to createdAt
        const date = new Date(order.deliveryDate || order.createdAt);
        if (!isNaN(date.getTime())) {
          const dateString = date.toISOString().split("T")[0];

          const dotColor = getStatusColor(order.status);

          if (!markedDates[dateString]) {
            markedDates[dateString] = {
              marked: true,
              dots: [{ color: dotColor }],
            };
          } else {
            // Ensure dots array is unique by status color
            const existingDots = markedDates[dateString].dots || [];
            if (!existingDots.some((dot) => dot.color === dotColor)) {
              existingDots.push({ color: dotColor });
            }
            markedDates[dateString].dots = existingDots;
          }
        }
      }
    });

    // Add selected date styling
    if (selectedDate) {
      const existingProps = markedDates[selectedDate] || {};
      markedDates[selectedDate] = {
        ...existingProps,
        marked: true,
        selected: true,
        selectedColor: "#6b4226",
      };
    }

    return markedDates;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#FFA500";
      case "confirmed":
        return "#007bff";
      case "delivered":
        return "#28a745";
      case "cancelled":
        return "#d9534f";
      default:
        return "#6b4226";
    }
  };

  // Get orders for selected date
  const getOrdersForDate = (date: string) => {
    return orders.filter((order) => {
      try {
        if (!order.deliveryDate) return false;
        const orderDate = new Date(order.deliveryDate);
        if (isNaN(orderDate.getTime())) return false;
        const orderDateString = orderDate.toISOString().split("T")[0];
        return orderDateString === date;
      } catch (error) {
        console.warn("Error processing order date:", error);
        return false;
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6b4226" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Admin Dashboard</Text>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Total Orders: {stats.orders}</Text>
          <Text style={styles.statText}>Total Users: {stats.users}</Text>
          <Text style={styles.statText}>
            Total Revenue: ${stats.revenue.toFixed(2)}
          </Text>
        </View>

        {/* Calendar View */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={(day: { dateString: string }) => {
              setSelectedDate(day.dateString);
              fetchOrdersByDate(day.dateString);
            }}
            onMonthChange={(month: { dateString: string }) => {
              const newMonth = month.dateString.slice(0, 7);
              setCurrentMonth(newMonth);
              setSelectedDate("");
              fetchOrdersByMonth(newMonth);
            }}
            markedDates={getMarkedDates()}
            markingType="multi-dot"
            theme={{
              calendarBackground: "#fff",
              textSectionTitleColor: "#6b4226",
              selectedDayBackgroundColor: "#6b4226",
              selectedDayTextColor: "#fff",
              todayTextColor: "#6b4226",
              dayTextColor: "#5A3827",
              textDisabledColor: "#d9d9d9",
              dotColor: "#6b4226",
              selectedDotColor: "#fff",
              arrowColor: "#6b4226",
              monthTextColor: "#6b4226",
              indicatorColor: "#6b4226",
            }}
            firstDay={0}
          />
        </View>

        {/* Selected Date Orders */}
        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateTitle}>
              Orders for {new Date(selectedDate).toLocaleDateString()}
            </Text>
            <ScrollView style={styles.selectedDateOrders}>
              {displayedOrders.length > 0 ? (
                displayedOrders.map((order) => (
                  <TouchableOpacity
                    key={order._id}
                    style={[
                      styles.orderCard,
                      { borderLeftColor: getStatusColor(order.status) },
                    ]}
                    onPress={() =>
                      navigation.navigate("OrderDetailsScreen", {
                        orderId: order._id,
                      })
                    }
                  >
                    <Text style={styles.orderId}>
                      Order ID: {order._id.slice(-6)}
                    </Text>
                    <Text
                      style={[
                        styles.orderStatus,
                        { color: getStatusColor(order.status) },
                      ]}
                    >
                      {order.status}
                    </Text>
                    <Text style={styles.orderCustomer}>
                      {order.user
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : "Deleted User"}
                    </Text>
                    <Text style={styles.orderTotal}>
                      Total: ${order.totalPrice.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOrdersText}>No orders for this date</Text>
              )}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

