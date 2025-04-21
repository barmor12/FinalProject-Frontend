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
    Image,
    TextInput,
    Dimensions
} from "react-native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

interface Cake {
    _id: string;
    name: string;
    image: {
        public_id: string;
        url: string;
    };
}
interface Address {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
}
interface Order {
    _id: string;
    status: "pending" | "confirmed" | "delivered" | "cancelled";
    user: { firstName: string; lastName: string; email: string };
    address: Address;
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
    const [messageModalVisible, setMessageModalVisible] = useState(false);
    const [managerMessage, setManagerMessage] = useState("");
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
            console.log("📦 Order Details:", data);
            setOrder(data);
        } catch (error) {
            console.error("❌ Error fetching order:", error);
            Alert.alert("Error", "Failed to load order details.");
        } finally {
            setLoading(false);
        }
    };

    // פונקציה לשליחת מייל ביקורת – מופעלת פעם אחת
    const sendReviewEmail = async (orderId: string | undefined, customerEmail: string | undefined) => {
        try {
            // Check if orderId and customerEmail are valid
            if (!orderId || !customerEmail) {
                console.error("❌ Cannot send review email: Missing orderId or customerEmail");
                return;
            }

            console.log("Sending review email...");
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "Authorization token is required");
                return;
            }
            const response = await fetch(`${config.BASE_URL}/sendEmail/${orderId}/send-review-email`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerEmail,
                    orderId,
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to send review email");
            }
            console.log("✅ Review email sent successfully.");
        } catch (error: any) {
            console.error("❌ Error sending review email:", error.message);
        }
    };

    // פונקציה לעדכון סטטוס הזמנה
    const updateOrderStatus = async () => {
        if (!selectedStatus) {
            Alert.alert("Error", "Please select a status.");
            return;
        }

        if (!order || !order._id) {
            Alert.alert("Error", "Order data is unavailable");
            return;
        }

        const newStatus = selectedStatus as "pending" | "confirmed" | "delivered" | "cancelled";
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
            Alert.alert("Error", "Authorization token is required");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${config.BASE_URL}/order/${order._id}/status`, {
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

            // כאשר הסטטוס מתעדכן ל-delivered – נשלח מייל ביקורת
            if (newStatus === "delivered" && order && order.user?.email) {
                await sendReviewEmail(order._id, order.user.email);
            }
        } catch (error: any) {
            console.error("❌ Error updating order:", error.message);
            Alert.alert("Error", "Failed to update order status.");
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <View style={styles.loadingHeader}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonSubtitle} />
                    <View style={styles.skeletonSubtitle} />
                </View>

                <ScrollView contentContainerStyle={styles.loadingScrollView}>
                    {[1, 2, 3].map((item) => (
                        <View key={item} style={styles.skeletonItem}>
                            <View style={styles.skeletonImage} />
                            <View style={styles.skeletonDetails}>
                                <View style={styles.skeletonText} />
                                <View style={styles.skeletonTextShort} />
                            </View>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.loadingFooter}>
                    <View style={styles.skeletonPrice} />
                    <View style={styles.skeletonButton} />
                    <View style={styles.skeletonButton} />
                    <View style={[styles.skeletonButton, { backgroundColor: '#D2B48C50' }]} />
                </View>

                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6b4226" />
                    <Text style={styles.loadingText}>Loading order details...</Text>
                </View>
            </SafeAreaView>
        );
    }
    if (!order) {
        return <Text style={styles.errorText}>Order not found.</Text>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Order #{order._id.slice(-6)}</Text>
            <Text style={styles.subTitle}>
                Customer: {order.user.firstName} {order.user.lastName}
            </Text>
            <Text style={styles.subTitle}>
                Status: <Text style={[styles.status, styles[order.status]]}>{order.status}</Text>
            </Text>

            <ScrollView contentContainerStyle={styles.scrollView}>
                {order.items.map((item, index) => (
                    <View key={index} style={styles.itemContainer}>
                        {item.cake?.image?.url ? (
                            <Image
                                source={{ uri: item.cake.image.url }}
                                style={styles.itemImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={{ color: "#999" }}>No image available</Text>
                        )}
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.cake?.name || "Unknown Cake"}</Text>
                            <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.totalPrice}>Total Price: ${order.totalPrice}</Text>

            <TouchableOpacity
                style={styles.updateStatusButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.updateStatusText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.updateStatusButton}
                onPress={() => setMessageModalVisible(true)}
            >
                <Text style={styles.updateStatusText}>Send Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.contactButton}
                onPress={() => setContactModalVisible(true)}
            >
                <Text style={styles.contactText}>View Contact Details</Text>
            </TouchableOpacity>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Order Status</Text>
                        {["pending", "confirmed", "delivered", "cancelled"].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.modalButton,
                                    selectedStatus === status && styles.selectedStatus,
                                ]}
                                onPress={() => setSelectedStatus(status)}
                            >
                                <Text>{status}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.modalButtonConfirm}
                            onPress={updateOrderStatus}
                        >
                            <Text>Confirm</Text>
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

            <Modal
                transparent={true}
                visible={contactModalVisible}
                animationType="slide"
                onRequestClose={() => setContactModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Customer Contact Details</Text>
                        <Text style={styles.contactInfo}>{order.address?.fullName || "N/A"}</Text>
                        <Text style={styles.contactInfo}>Phone: {order.address?.phone || "N/A"}</Text>
                        <Text style={styles.contactInfo}>
                            Address: {order.address?.street || "N/A"}, {order.address?.city || "N/A"}, {order.address?.zipCode || "N/A"}, {order.address?.country || "N/A"}
                        </Text>
                        <Text style={styles.contactInfo}>Email: {order.user?.email || "N/A"}</Text>
                        <TouchableOpacity
                            style={styles.modalButtonClose}
                            onPress={() => setContactModalVisible(false)}
                        >
                            <Text>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={messageModalVisible}
                animationType="slide"
                onRequestClose={() => setMessageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Send Message to Customer</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your message..."
                            multiline
                            value={managerMessage}
                            onChangeText={setManagerMessage}
                        />
                        <TouchableOpacity
                            style={styles.modalButtonConfirm}
                            onPress={async () => {
                                if (!managerMessage.trim()) {
                                    Alert.alert("Error", "Please enter a message.");
                                    return;
                                }
                                const token = await AsyncStorage.getItem("accessToken");
                                if (!token) {
                                    Alert.alert("Error", "Authorization token is required");
                                    return;
                                }
                                try {
                                    const customerEmail = order.user?.email;
                                    if (!customerEmail) {
                                        Alert.alert("Error", "Customer email not found");
                                        return;
                                    }

                                    const response = await fetch(`${config.BASE_URL}/sendEmail/${customerEmail}/message`, {
                                        method: "POST",
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            customerEmail,
                                            managerMessage,
                                            isManagerMsg: true,
                                        }),
                                    });
                                    const data = await response.json();
                                    if (!response.ok) {
                                        throw new Error(data.error || "Failed to send message");
                                    }
                                    Alert.alert("Success", "Message sent successfully to the customer!");
                                    setManagerMessage("");
                                    setMessageModalVisible(false);
                                } catch (error: any) {
                                    console.error("❌ Error sending message:", error);
                                    Alert.alert("Error", error.message || "Failed to send message.");
                                }
                            }}
                        >
                            <Text style={styles.updateStatusText}>Send</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButtonClose}
                            onPress={() => setMessageModalVisible(false)}
                        >
                            <Text style={styles.updateStatusText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f9f3ea" },
    scrollView: { paddingBottom: 20 },
    title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 10, color: "#6b4226" },
    subTitle: { fontSize: 18, textAlign: "center", marginBottom: 10, color: "#6b4226" },
    status: { fontWeight: "bold", textTransform: "capitalize" },
    pending: { color: "#FFA500" },
    confirmed: { color: "#007bff" },
    delivered: { color: "#28a745" },
    cancelled: { color: "#d9534f" },
    scrollContent: { paddingBottom: 120 },
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
    input: {
        width: "100%",
        height: 100,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        backgroundColor: "#fff",
        textAlignVertical: "top",
        marginBottom: 10,
        color: "#333"
    },
    itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 15 },
    itemDetails: { flex: 1 },
    itemName: { fontSize: 18, fontWeight: "bold", color: "#6b4226" },
    itemQuantity: { fontSize: 16, color: "#6b4226" },
    totalPrice: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginVertical: 15, color: "#6b4226" },
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
    updateStatusText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    contactButton: {
        backgroundColor: "#D2B48C",
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
    contactText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
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
        elevation: 3
    },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#6b4226" },
    modalButton: { padding: 12, backgroundColor: "#fff", marginVertical: 5, width: "100%", alignItems: "center", borderRadius: 8 },
    selectedStatus: { backgroundColor: "#D2B48C" },
    modalButtonClose: { padding: 12, backgroundColor: "#d9534f", marginTop: 10, width: "100%", alignItems: "center", borderRadius: 8 },
    modalButtonConfirm: { padding: 12, backgroundColor: "#6b4226", marginTop: 10, width: "100%", alignItems: "center", borderRadius: 8 },
    errorText: { fontSize: 18, color: "red", textAlign: "center", marginTop: 20 },
    contactInfo: { fontSize: 18, textAlign: "center", marginVertical: 10, color: "#6b4226" },

    // Loading screen styles
    loadingContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f9f3ea"
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(249, 243, 234, 0.7)'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b4226',
        fontWeight: '600'
    },
    loadingHeader: {
        alignItems: 'center',
        marginBottom: 15
    },
    loadingScrollView: {
        paddingBottom: 20
    },
    loadingFooter: {
        alignItems: 'center',
        marginTop: 10
    },
    skeletonTitle: {
        width: 200,
        height: 30,
        borderRadius: 4,
        backgroundColor: '#D2B48C50',
        marginBottom: 10
    },
    skeletonSubtitle: {
        width: 180,
        height: 22,
        borderRadius: 4,
        backgroundColor: '#D2B48C40',
        marginBottom: 8
    },
    skeletonItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        shadowColor: '#00000015',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2
    },
    skeletonImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#D2B48C30',
        marginRight: 15
    },
    skeletonDetails: {
        flex: 1,
        justifyContent: 'center'
    },
    skeletonText: {
        width: '100%',
        height: 18,
        borderRadius: 4,
        backgroundColor: '#D2B48C40',
        marginBottom: 10
    },
    skeletonTextShort: {
        width: '60%',
        height: 14,
        borderRadius: 4,
        backgroundColor: '#D2B48C30'
    },
    skeletonPrice: {
        width: 120,
        height: 26,
        borderRadius: 4,
        backgroundColor: '#D2B48C60',
        marginVertical: 15
    },
    skeletonButton: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        backgroundColor: '#6b422650',
        marginBottom: 10
    },
});
