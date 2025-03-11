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
        user: { _id: string; firstName: string; lastName: string; phone: string; address: string; email: string };
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
                <Text style={styles.statusHeaderCell}>סטטוס</Text>
                <Text style={styles.nameHeaderCell}>שם לקוח</Text>
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
                            <Text style={styles.cell}>    {order.user.firstName} {order.user.lastName}</Text>
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
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f9f3ea",
    },
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
        textAlign: "right", // יישור ברירת מחדל למרכז
        minWidth: 70,
    },
    nameHeaderCell: {
        flex: 1,
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center", // עדיין מיישר לימין
        paddingRight: 30, // מרווח נוסף
        minWidth: 120,
    },
    statusHeaderCell: {
        flex: 1,
        color: "#fff",
        fontWeight: "bold",
        textAlign: "right", // עדיין מיישר לימין
        paddingRight: 25, // מרווח נוסף
        minWidth: 120,
    },
    scrollViewContent: {
        paddingBottom: 120,
    },
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
    cell: {
        flex: 1,
        textAlign: "center",
        color: "#6b4226",
        minWidth: 70, // להבטיח גודל אחיד של התאים
    },
    pending: {
        color: "#FFA500",
        fontWeight: "bold",
    },
    confirmed: {
        color: "#007bff",
        fontWeight: "bold",
    },
    delivered: {
        color: "#28a745",
        fontWeight: "bold",
    },
    cancelled: {
        color: "#d9534f",
        fontWeight: "bold",
    },
    menuButton: {
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    menuText: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
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

