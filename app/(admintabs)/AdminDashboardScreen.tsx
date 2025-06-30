import React, { useEffect, useState, useCallback } from "react";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { Calendar } from "react-native-calendars";
import styles from "../styles/AdminScreensStyles/AdminDashboardScreenStyles";
import NotificationButton from "../../components/NotificationButton";

interface Order {
  _id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  deliveryDate?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showCalendar] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // Format: YYYY-MM
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

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

      const revenuePerDay = Array(7).fill(0); // Sunday = 0
      fetchedOrders.forEach((order: Order) => {
        const date = new Date(order.createdAt);
        const day = date.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
        revenuePerDay[day] += order.totalPrice || 0;
      });
      setRevenueData(revenuePerDay);

      // Fetch products and check for low stock
      const productsResponse = await axios.get(`${config.BASE_URL}/cakes`);
      const allProducts = productsResponse.data;
      const lowStock = allProducts.filter((p: any) => p.stock < 3);
      setLowStockProducts(lowStock);
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
    allOrders.forEach((order: Order) => {
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
    return orders.filter((order: Order) => {
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
          <NotificationButton />
        </View>
        <Text style={styles.title}>Admin Dashboard</Text>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Total Orders: {stats.orders}</Text>
          <Text style={styles.statText}>Total Users: {stats.users}</Text>
          <Text style={styles.statText}>
            Total Revenue: ${stats.revenue.toFixed(2)}
          </Text>
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>⚠️ Low stock alert</Text>
            {lowStockProducts.map((item) => (
              <Text key={item._id} style={styles.alertContent}>
                {item.name}: {item.stock} left
              </Text>
            ))}
          </View>
        )}

        {/* Revenue Line Chart */}
        <Text style={styles.chartTitle}>Revenue Overview</Text>
        <LineChart
          data={{
            labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            datasets: [
              {
                data: revenueData,
              },
            ],
          }}
          width={350}
          height={220}
          chartConfig={{
            backgroundColor: "#f9f3ea",
            backgroundGradientFrom: "#f9f3ea",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(107, 66, 38, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 66, 38, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#6b4226",
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />

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
                displayedOrders.map((order: Order) => (
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
