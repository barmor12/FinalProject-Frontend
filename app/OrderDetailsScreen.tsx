import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Alert,
    ScrollView
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./_layout"; // ודא שזה הנתיב הנכון
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

type OrderDetailsScreenRouteProp = RouteProp<RootStackParamList, "OrderDetailsScreen">;
type OrderDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "OrderDetailsScreen">;

export default function OrderDetailsScreen() {
    const route = useRoute<OrderDetailsScreenRouteProp>();
    const navigation = useNavigation<OrderDetailsScreenNavigationProp>();
    const { orderId } = route.params;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    interface Order {
        _id: string;
        status: "pending" | "confirmed" | "delivered" | "cancelled";
        user: { _id: string; email: string };
        items: { cake: string; quantity: number }[];
        totalPrice: number;
        createdAt: string;
    }

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
            setOrder(data);
        } catch (error) {
            console.error("❌ Error fetching order details:", error);
            Alert.alert("Error", "Failed to fetch order details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (newStatus: Order["status"]) => {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
            Alert.alert("Error", "Authorization token is required");
            return;
        }

        try {
            const response = await fetch(`${config.BASE_URL}/order/${orderId}/status`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            setOrder((prevOrder) => (prevOrder ? { ...prevOrder, status: newStatus } : prevOrder));
            Alert.alert("Success", "Order status updated successfully.");
        } catch (error) {
            console.error("❌ Error updating order status:", error);
            Alert.alert("Error", "Failed to update order status.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color="#6b4226" />
            ) : order ? (
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <Text style={styles.title}>Order Details</Text>

                    <Text style={styles.label}>Order ID:</Text>
                    <Text style={styles.value}>{order._id}</Text>

                    <Text style={styles.label}>Customer Email:</Text>
                    <Text style={styles.value}>{order.user.email}</Text>

                    <Text style={styles.label}>Status:</Text>
                    <Text style={[styles.value, styles[order.status]]}>{order.status}</Text>

                    <Text style={styles.label}>Ordered Cakes:</Text>
                    {order.items.map((item, index) => (
                        <Text key={index} style={styles.value}>
                            Cake ID: {item.cake} - Quantity: {item.quantity}
                        </Text>
                    ))}

                    <Text style={styles.label}>Total Price:</Text>
                    <Text style={styles.value}>${order.totalPrice}</Text>

                    {/* כפתורים לעדכון סטטוס */}
                    <View style={styles.statusButtonsContainer}>
                        {["pending", "confirmed", "delivered", "cancelled"].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.statusButton,
                                    order.status === status && styles.activeStatusButton,
                                ]}
                                onPress={() => updateOrderStatus(status as Order["status"])}
                            >
                                <Text style={styles.statusButtonText}>{status}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <Text style={styles.errorText}>Order not found.</Text>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f9f3ea" },
    scrollViewContent: { paddingBottom: 100 },
    title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 15 },
    label: { fontSize: 18, fontWeight: "bold", marginTop: 10, paddingLeft: 10 },
    value: { fontSize: 16, color: "#6b4226", paddingLeft: 10 },
    pending: { color: "#FFA500" },
    confirmed: { color: "#007bff" },
    delivered: { color: "#28a745" },
    cancelled: { color: "#d9534f" },
    errorText: { fontSize: 18, color: "#d9534f", textAlign: "center", marginTop: 20 },
    backButton: { marginBottom: 10, alignSelf: "flex-start" },
    backButtonText: { fontSize: 16, color: "#007bff" },
    statusButtonsContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 20 },
    statusButton: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: "#ddd",
    },
    activeStatusButton: {
        backgroundColor: "#6b4226",
    },
    statusButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

