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
    Image
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

interface Order {
    _id: string;
    status: "pending" | "confirmed" | "delivered" | "cancelled";
    user: { firstName: string; lastName: string; email: string };
    items: { cake: string; quantity: number; imageUrl: string }[];
    totalPrice: number;
    createdAt: string;
}

export default function OrderDetailsScreen() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");

    const navigation = useNavigation();
    const route = useRoute();
    const { orderId } = route.params as { orderId: string };

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
            console.error("❌ Error fetching order:", error);
            Alert.alert("Error", "Failed to load order details.");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async () => {
        if (!selectedStatus) {
            Alert.alert("Error", "Please select a status.");
            return;
        }

        const newStatus = selectedStatus as "pending" | "confirmed" | "delivered" | "cancelled"; // ✅ המרה לסוג הנכון

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

            Alert.alert("Success", "Order status updated successfully.");
            setOrder((prevOrder) => prevOrder ? { ...prevOrder, status: newStatus } : prevOrder); // ✅ עדכון הסטטוס עם הסוג הנכון
            setModalVisible(false);
        } catch (error) {
            console.error("❌ Error updating order:", error);
            Alert.alert("Error", "Failed to update order status.");
        }
    };


    if (loading) {
        return <ActivityIndicator size="large" color="#6b4226" style={{ marginTop: 50 }} />;
    }

    if (!order) {
        return <Text style={styles.errorText}>Order not found.</Text>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Order #{order._id.slice(-6)}</Text>
            <Text style={styles.subTitle}>Customer: {order.user.firstName} {order.user.lastName}</Text>
            <Text style={styles.subTitle}>Status: <Text style={[styles.status, styles[order.status]]}>{order.status}</Text></Text>

            <ScrollView contentContainerStyle={styles.scrollView}>
                {order.items.map((item, index) => (
                    <View key={index} style={styles.itemContainer}>
                        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.cake}</Text>
                            <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.totalPrice}>Total Price: ${order.totalPrice}</Text>

            <TouchableOpacity style={styles.updateStatusButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.updateStatusText}>Update Status</Text>
            </TouchableOpacity>

            {/* מודאל שינוי סטטוס */}
            <Modal transparent={true} visible={modalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Order Status</Text>
                        {["pending", "confirmed", "delivered", "cancelled"].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.modalButton,
                                    selectedStatus === status ? styles.selectedStatus : {},
                                ]}
                                onPress={() => setSelectedStatus(status)}
                            >
                                <Text>{status}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalButtonClose} onPress={updateOrderStatus}>
                            <Text>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f9f3ea" },
    title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
    subTitle: { fontSize: 18, textAlign: "center", marginBottom: 10 },
    status: { fontWeight: "bold" },
    pending: { color: "#FFA500" },
    confirmed: { color: "#007bff" },
    delivered: { color: "#28a745" },
    cancelled: { color: "#d9534f" },
    scrollView: { paddingBottom: 20 },
    itemContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginBottom: 10, padding: 10, borderRadius: 5 },
    itemImage: { width: 60, height: 60, borderRadius: 5, marginRight: 15 },
    itemDetails: { flex: 1 },
    itemName: { fontSize: 18, fontWeight: "bold" },
    itemQuantity: { fontSize: 16, color: "#6b4226" },
    totalPrice: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginVertical: 15 },
    updateStatusButton: { backgroundColor: "#6b4226", padding: 12, borderRadius: 5, alignItems: "center" },
    updateStatusText: { color: "#fff", fontWeight: "bold" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "80%", alignItems: "center" },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    modalButton: { padding: 10, backgroundColor: "#ddd", marginVertical: 5, width: "100%", alignItems: "center", borderRadius: 5 },
    selectedStatus: { backgroundColor: "#6b4226", color: "#fff" },
    modalButtonClose: { padding: 10, backgroundColor: "#007bff", marginVertical: 5, width: "100%", alignItems: "center", borderRadius: 5 },
    errorText: {
        fontSize: 18,
        color: "red",
        textAlign: "center",
        marginTop: 20,
    },
});
