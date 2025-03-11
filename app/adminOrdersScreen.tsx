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
    Modal
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./_layout";



export default function AdminOrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    interface Order {
        _id: string;
        status: "pending" | "confirmed" | "delivered" | "cancelled";
        user: { _id: string; email: string };
        items: { cake: string; quantity: number }[];
        totalPrice: number;
        createdAt: string;
    }

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
            Alert.alert("Error", "Authorization token is required");
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
        }
    };

    const openOrderMenu = (order: Order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Orders</Text>

            {/* טבלת כותרות */}
            <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>מס הזמנה</Text>
                <Text style={styles.headerCell}>תאריך הזמנה</Text>
                <Text style={styles.headerCell}>סטטוס</Text>
                <Text style={styles.headerCell}>שם לקוח</Text>
                <Text style={styles.headerCell}></Text>
            </View>

            {/* רשימת הזמנות */}
            {loading ? (
                <ActivityIndicator size="large" color="#6b4226" />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    {orders.map((order) => (
                        <TouchableOpacity
                            key={order._id}
                            style={styles.row}
                            onPress={() => navigation.navigate("OrderDetailsScreen", { orderId: order._id })}
                        >
                            <Text style={styles.cell}>{order._id.slice(-6)}</Text>
                            <Text style={styles.cell}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                            <Text style={[styles.cell, styles[order.status]]}>{order.status}</Text>
                            <Text style={styles.cell}>{order.user.email}</Text>

                            {/* כפתור תפריט 3 נקודות */}
                            <TouchableOpacity onPress={() => openOrderMenu(order)} style={styles.menuButton}>
                                <Text style={styles.menuText}>⋮</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* מודאל תפריט להזמנה */}
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
                                    Alert.alert("Edit", "Edit order functionality here.");
                                    setModalVisible(false);
                                }}
                            >
                                <Text>Edit Order</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => {
                                    Alert.alert("Cancel", "Cancel order functionality here.");
                                    setModalVisible(false);
                                }}
                            >
                                <Text>Cancel Order</Text>
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
            )}
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
        justifyContent: "space-between",
        backgroundColor: "#6b4226",
        padding: 10,
        borderRadius: 5,
    },
    headerCell: {
        color: "#fff",
        fontWeight: "bold",
        flex: 1,
        textAlign: "center",
    },
    scrollViewContent: {
        paddingBottom: 120,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 15,
        backgroundColor: "#fff",
        marginVertical: 5,
        borderRadius: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        elevation: 2,
    },
    cell: {
        flex: 1,
        textAlign: "center",
        color: "#6b4226",
    },
    pending: { color: "#FFA500" },
    confirmed: { color: "#007bff" },
    delivered: { color: "#28a745" },
    cancelled: { color: "#d9534f" },
    menuButton: {
        paddingHorizontal: 10,
    },
    menuText: {
        fontSize: 24,
        fontWeight: "bold",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    modalButton: {
        padding: 10,
        backgroundColor: "#ddd",
        marginVertical: 5,
        width: "100%",
        alignItems: "center",
        borderRadius: 5,
    },
    modalButtonClose: {
        padding: 10,
        backgroundColor: "#d9534f",
        marginVertical: 5,
        width: "100%",
        alignItems: "center",
        borderRadius: 5,
    },
});
