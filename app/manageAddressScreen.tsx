import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import config from "../config";

interface Address {
    _id: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export default function AddressManagementScreen() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        fullName: "",
        phone: "",
        street: "",
        city: "",
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You need to be logged in.");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/address`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch addresses");

            const data: Address[] = await response.json();
            setAddresses(data);
        } catch (error) {
            console.error("Error fetching addresses:", error);
            Alert.alert("Error", "Failed to fetch addresses.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) return;

            const response = await fetch(`${config.BASE_URL}/address`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...newAddress, isDefault: false }),
            });

            if (!response.ok) throw new Error("Failed to add address");

            Alert.alert("Success", "Address added successfully!");
            setNewAddress({ fullName: "", phone: "", street: "", city: "" });
            fetchAddresses(); // רענון הרשימה
        } catch (error) {
            console.error("Error adding address:", error);
            Alert.alert("Error", "Failed to add address.");
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteAddress = async (addressId: string) => {
        Alert.alert(
            "Delete Address",
            "Are you sure you want to delete this address?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const token = await AsyncStorage.getItem("accessToken");
                            if (!token) {
                                Alert.alert("Error", "You need to be logged in.");
                                return;
                            }

                            const response = await fetch(`${config.BASE_URL}/address/${addressId}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            if (!response.ok) throw new Error("Failed to delete address");

                            Alert.alert("Success", "Address deleted successfully!");
                            fetchAddresses(); // רענון הרשימה
                        } catch (error) {
                            console.error("Error deleting address:", error);
                            Alert.alert("Error", "Failed to delete address.");
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefaultAddress = async (addressId: string) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "You need to be logged in.");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/address/default/${addressId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });

            if (!response.ok) throw new Error("Failed to set default address");

            Alert.alert("Success", "Default address updated!");
            fetchAddresses(); // רענון הרשימה
        } catch (error) {
            console.error("Error setting default address:", error);
            Alert.alert("Error", "Failed to update default address.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.container}>
                    <Text style={styles.title}>Manage Addresses</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#6b4226" />
                    ) : (
                        <FlatList
                            data={addresses}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <View style={[styles.addressItem, item.isDefault && styles.defaultAddress]}>
                                    <View style={styles.addressDetails}>
                                        <Text style={styles.addressText}>
                                            <Text style={styles.bold}>{item.fullName}</Text> ({item.phone})
                                        </Text>
                                        <Text style={styles.addressText}>{item.street}, {item.city}, {item.zipCode}</Text>
                                        <Text style={styles.addressText}>{item.country}</Text>
                                    </View>

                                    <View style={styles.buttonContainer}>
                                        <View style={styles.defaultContainer}>
                                            <TouchableOpacity onPress={() => handleSetDefaultAddress(item._id)}>
                                                <Ionicons name={item.isDefault ? "checkmark-circle" : "ellipse-outline"} size={24} color={item.isDefault ? "#6b4226" : "#ccc"} />
                                            </TouchableOpacity>

                                            {item.isDefault && <Text style={styles.defaultLabel}>Default</Text>}
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteAddress(item._id)}>
                                            <Ionicons name="trash" size={24} color="#d9534f" />
                                        </TouchableOpacity>

                                    </View>
                                </View>
                            )}
                            contentContainerStyle={styles.listContainer}
                        />
                    )}

                    <ScrollView contentContainerStyle={styles.newAddressContainer}>
                        <TouchableOpacity
                            style={styles.toggleButton}
                            onPress={() => setShowAddAddress(!showAddAddress)}
                        >
                            <Text style={styles.toggleButtonText}>
                                {showAddAddress ? "Cancel" : "Add New Address"}
                            </Text>
                        </TouchableOpacity>

                        {showAddAddress && (
                            <>
                                <TextInput style={styles.input} placeholder="Full Name" value={newAddress.fullName} onChangeText={(text) => setNewAddress({ ...newAddress, fullName: text })} />
                                <TextInput style={styles.input} placeholder="Phone" value={newAddress.phone} onChangeText={(text) => setNewAddress({ ...newAddress, phone: text })} keyboardType="phone-pad" />
                                <TextInput style={styles.input} placeholder="Street" value={newAddress.street} onChangeText={(text) => setNewAddress({ ...newAddress, street: text })} />
                                <TextInput style={styles.input} placeholder="City" value={newAddress.city} onChangeText={(text) => setNewAddress({ ...newAddress, city: text })} />
                                <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
                                    <Text style={styles.addButtonText}>Save Address</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9f3ea", padding: 16 },
    title: { fontSize: 24, fontWeight: "bold", color: "#6b4226", textAlign: "center", marginBottom: 10 },
    listContainer: { paddingBottom: 20 },
    addressItem: { flexDirection: "row", justifyContent: "space-between", margin: 5, padding: 15, backgroundColor: "#fff", borderRadius: 8, marginBottom: 10 },
    defaultAddress: { borderWidth: 2, borderColor: "#6b4226" },
    addressText: { fontSize: 14, color: "#6b4226" },
    bold: { fontWeight: "bold" },
    newAddressContainer: {
        padding: 15,
        backgroundColor: "#f9f3ea",
        borderRadius: 10,
        marginTop: 10
    },
    sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#6b4226", marginBottom: 10 },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 10 },
    addButton: { backgroundColor: "#6b4226", padding: 15, borderRadius: 8, alignItems: "center" },
    addButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    toggleButton: {
        backgroundColor: "#6b4226",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
    },
    toggleButtonText: {

        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonContainer: {
        flexDirection: "row",

        alignItems: "center",
        gap: 10, // ריווח בין האייקונים
    },
    addressDetails: {
        flex: 1, // שומר על גודל שווה בין הכתובת לכפתורים
    },
    defaultContainer: {
        alignItems: "center", // מיישר את ה-Default מתחת לעיגול הסימון
    },
    defaultLabel: {
        fontSize: 12,
        color: "#6b4226",
        fontWeight: "bold",
        marginTop: 2, // רווח קטן מהאייקון
    },

});

