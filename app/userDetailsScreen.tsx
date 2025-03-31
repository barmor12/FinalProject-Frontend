import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Button,
    SafeAreaView,
    FlatList
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
}

interface Order {
    _id: string;
    totalPrice: number;
    createdAt: string;
    status: string;
}

export default function UserDetailsScreen() {
    const { userId } = useLocalSearchParams();

    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingUser, setLoadingUser] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        fetchUserDetails();
        fetchUserOrders();
    }, [userId]);

    const fetchUserDetails = async () => {
        try {
            setLoadingUser(true);
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${config.BASE_URL}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch user");
            const data = await res.json();
            setUser(data);
        } catch (err) {
            console.error("❌ Error loading user:", err);
            alert("Failed to load user");
        } finally {
            setLoadingUser(false);
        }
    };

    const fetchUserOrders = async () => {
        try {
            setLoadingOrders(true);
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${config.BASE_URL}/order/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch orders");
            const data = await res.json();
            setOrders(data || []);
        } catch (err) {
            console.error("❌ Error loading orders:", err);
            alert("Failed to load orders");
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleUpdateRole = (newRole: string) => {
        alert(`Update role to: ${newRole}`);
    };

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return styles.pending;
            case "confirmed":
                return styles.confirmed;
            case "delivered":
                return styles.delivered;
            case "cancelled":
                return styles.cancelled;
            default:
                return {};
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                <Text style={styles.title}>👤 User Details</Text>

                {loadingUser ? (
                    <ActivityIndicator size="large" color="#6b4226" />
                ) : user ? (
                    <View style={styles.card}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{user.firstName} {user.lastName}</Text>

                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{user.email}</Text>

                        <Text style={styles.label}>Role:</Text>
                        <Text style={styles.value}>{user.role}</Text>

                        <Text style={styles.label}>Joined:</Text>
                        <Text style={styles.value}>
                            {new Date(user.createdAt).toLocaleDateString()}
                        </Text>

                        <View style={styles.updateStatusButton}>
                            <Text
                                style={styles.updateStatusText}
                                onPress={() => handleUpdateRole(user.role === "admin" ? "user" : "admin")}
                            >
                                Change Role to {user.role === "admin" ? "User" : "Admin"}
                            </Text>

                        </View>
                    </View>
                ) : (
                    <Text style={styles.errorText}>User not found</Text>
                )}

                <Text style={styles.sectionTitle}>📦 Orders</Text>

                {loadingOrders ? (
                    <ActivityIndicator size="small" color="#6b4226" />
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <View style={styles.orderCard}>
                                <Text style={styles.orderText}>Order ID: {item._id}</Text>
                                <Text style={styles.orderText}>Total: ₪{item.totalPrice}</Text>
                                <Text style={styles.orderText}>
                                    Date: {new Date(item.createdAt).toLocaleString()}
                                </Text>
                                <Text
                                    style={[
                                        styles.orderText,
                                        styles.status,
                                        getStatusStyle(item.status),
                                    ]}
                                >
                                    Status: {item.status}
                                </Text>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.noOrders}>No orders found</Text>
                        }
                        contentContainerStyle={{ paddingBottom: 30 }}
                        scrollEnabled={false} // כדי ש־ScrollView ימשיך לשלוט בגלילה
                    />
                )}
            </ScrollView>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f9f3ea"
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
        color: "#6b4226",

    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#6b4226",
        marginLeft: 5
    },
    card: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3
    },
    label: {
        fontSize: 16,
        color: "#6b4226",
        marginTop: 10
    },
    value: {
        fontSize: 18,
        fontWeight: "500",
        color: "#6b4226"
    },
    orderCard: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3
    },
    orderText: {
        fontSize: 16,
        marginBottom: 4,
        color: "#6b4226"
    },
    status: {
        fontWeight: "bold",
        textTransform: "capitalize"
    },
    pending: { color: "#FFA500" },
    confirmed: { color: "#007bff" },
    delivered: { color: "#28a745" },
    cancelled: { color: "#d9534f" },
    updateStatusButton: {
        backgroundColor: "#6b4226",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3
    },
    updateStatusText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16
    },
    noOrders: {
        fontStyle: "italic",
        color: "#888",
        textAlign: "center"
    },
    errorText: {
        fontSize: 18,
        color: "red",
        textAlign: "center",
        marginTop: 20
    }
});
