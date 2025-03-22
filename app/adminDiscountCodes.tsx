import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

interface DiscountCode {
    _id: string;
    code: string;
    discountPercentage: number;
    isActive: boolean;
    expiryDate?: string;
}

export default function AdminDiscountCodes() {
    const [codes, setCodes] = useState<DiscountCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState("");
    const [discount, setDiscount] = useState<string>("");    // ערך של שדה טופס
    const [expiryDate, setExpiryDate] = useState("");

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${config.BASE_URL}/discount`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setCodes(data);
        } catch (error) {
            Alert.alert("Error", "Failed to load discount codes");
        } finally {
            setLoading(false);
        }
    };

    const createCode = async () => {
        try {
            if (!code || !discount) return Alert.alert("Missing Fields");
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(`${config.BASE_URL}/discount`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    code,
                    discountPercentage: Number(discount),
                    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            Alert.alert("Success", "Discount code created");
            setCode("");
            setDiscount("");
            setExpiryDate("");
            fetchCodes();
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error("Error:", err.message);
            } else {
                console.error("Unknown error:", err);
            }
        }
    };

    const renderCode = ({ item }: { item: DiscountCode }) => (
        <View style={styles.codeCard}>
            <Text style={styles.codeText}>Code: {item.code}</Text>
            <Text style={styles.codeText}>Discount: {item.discountPercentage}%</Text>
            <Text style={styles.codeText}>
                Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "No expiry"}
            </Text>
            <Text style={[styles.codeText, { color: item.isActive ? "green" : "red" }]}>Status: {item.isActive ? "Active" : "Inactive"}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Manage Discount Codes</Text>

            <TextInput
                placeholder="Code"
                style={styles.input}
                value={code}
                onChangeText={setCode}
            />
            <TextInput
                placeholder="Discount %"
                keyboardType="numeric"
                style={styles.input}
                value={discount}
                onChangeText={setDiscount}
            />
            <TextInput
                placeholder="Expiry Date (YYYY-MM-DD)"
                style={styles.input}
                value={expiryDate}
                onChangeText={setExpiryDate}
            />

            <TouchableOpacity style={styles.button} onPress={createCode}>
                <Text style={styles.buttonText}>Create Code</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color="#6b4226" />
            ) : (
                <FlatList
                    data={codes}
                    keyExtractor={(item) => item._id}
                    renderItem={renderCode}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f9f3ea",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 20,
        textAlign: "center",
    },
    input: {
        backgroundColor: "#fff",
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        borderColor: "#ccc",
        borderWidth: 1,
    },
    button: {
        backgroundColor: "#6b4226",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 20,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    codeCard: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    codeText: {
        fontSize: 16,
        color: "#333",
    },
});