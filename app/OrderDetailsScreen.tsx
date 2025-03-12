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

interface Cake {
    _id: string;
    name: string;
    image: string;
}

interface Order {
    _id: string;
    status: "pending" | "confirmed" | "delivered" | "cancelled";
    user: { firstName: string; lastName: string; email: string, phone: string, address: string };
    items: { cake: Cake; quantity: number }[];
    totalPrice: number;
    createdAt: string;
}

export default function OrderDetailsScreen() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [contactModalVisible, setContactModalVisible] = useState(false);
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
            console.log(data);
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

        const newStatus = selectedStatus as "pending" | "confirmed" | "delivered" | "cancelled";

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
            setOrder((prevOrder) => prevOrder ? { ...prevOrder, status: newStatus } : prevOrder);
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
                        <Image source={{ uri: item.cake.image }} style={styles.itemImage} />
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.cake.name}</Text>
                            <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.totalPrice}>Total Price: ${order.totalPrice}</Text>

            <TouchableOpacity style={styles.updateStatusButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.updateStatusText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={() => setContactModalVisible(true)}>
                <Text style={styles.contactText}>View Contact Details</Text>
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
                        <TouchableOpacity style={styles.modalButtonClose} onPress={() => setContactModalVisible(false)}>
                            <Text>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* מודאל פרטי קשר */}
            <Modal transparent={true} visible={contactModalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Customer Contact Details</Text>
                        <Text style={styles.contactInfo}>Customer: {order.user.firstName} {order.user.lastName}</Text>
                        <Text style={styles.contactInfo}>Phone: {order.user.phone}</Text>
                        <Text style={styles.contactInfo}>Address: {order.user.address}</Text>
                        <Text style={styles.contactInfo}>Email: {order.user.email}</Text>
                        <TouchableOpacity style={styles.modalButtonClose} onPress={() => setContactModalVisible(false)}>
                            <Text>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        color: "#6b4226"
    },
    subTitle: {
        fontSize: 18,
        textAlign: "center",
        marginBottom: 10,
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
    scrollView: {
        paddingBottom: 20
    },
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginBottom: 10,
        padding: 10,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 15
    },
    itemDetails: {
        flex: 1
    },
    itemName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#6b4226"
    },
    itemQuantity: {
        fontSize: 16,
        color: "#6b4226"
    },
    totalPrice: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 15,
        color: "#6b4226"
    },
    updateStatusButton: {
        backgroundColor: "#6b4226",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
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
    contactButton: {
        backgroundColor: "#007bff",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3
    },
    contactText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center"
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#6b4226"
    },
    modalButton: {
        padding: 12,
        backgroundColor: "#ddd",
        marginVertical: 5,
        width: "100%",
        alignItems: "center",
        borderRadius: 8
    },
    selectedStatus: {
        backgroundColor: "#6b4226",
    },
    modalButtonClose: {
        padding: 12,
        backgroundColor: "#d9534f",
        marginTop: 10,
        width: "100%",
        alignItems: "center",
        borderRadius: 8
    },
    modalButtonConfirm: {
        padding: 12,
        backgroundColor: "#d9534f",
        marginTop: 10,
        width: "100%",
        alignItems: "center",
        borderRadius: 8
    },
    errorText: {
        fontSize: 18,
        color: "red",
        textAlign: "center",
        marginTop: 20
    },
    contactInfo: {
        fontSize: 18,
        textAlign: "center",
        marginVertical: 10,
        color: "#6b4226"
    }
});

