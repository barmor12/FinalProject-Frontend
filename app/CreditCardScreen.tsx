// app/CreditCardScreen.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import styles from "./styles/CreditCardStyles";
import config from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CreditCard {
    id: string;
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string;
    cardType: "visa" | "mastercard";
    isDefault?: boolean;
}

export default function CreditCardScreen() {
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        cardNumber: "",
        cardHolderName: "",
        expiryDate: "",
        cvv: "",
        isDefault: false,
        cardType: "visa" as "visa" | "mastercard",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const initializeData = async () => {
            const t = await AsyncStorage.getItem("accessToken");
            const userId = await AsyncStorage.getItem("userId");
            if (!t || !userId) {
                Alert.alert("Error", "Please log in to view your credit cards");
                return;
            }
            setToken(t);
            await fetchCards();
        };
        initializeData();
    }, []);

    const fetchCards = async () => {
        try {
            const t = await AsyncStorage.getItem("accessToken");
            const u = await AsyncStorage.getItem("userId");
            if (!t || !u) {
                Alert.alert("Error", "Missing access token or user ID.");
                return;
            }
            const resp = await fetch(`${config.BASE_URL}/auth/credit-cards`, {
                method: "GET",
                headers: { Authorization: `Bearer ${t}` },
            });
            if (!resp.ok) throw new Error("Failed to fetch cards");
            const data = await resp.json();
            setCards(data.cards || []);
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        // כרטיס – חובה 16 ספרות
        if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ""))) {
            newErrors.cardNumber = "Please enter a valid 16-digit card number";
        }
        // תוקף – MM/YY
        if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.expiryDate)) {
            newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)";
        }
        // CVV נבדק רק בהוספה, לא בעריכה
        if (!isEditing) {
            if (!/^\d{3}$/.test(formData.cvv)) {
                newErrors.cvv = "Please enter a valid 3-digit CVV";
            }
        }
        // שם בעל הכרטיס חובה
        if (!formData.cardHolderName.trim()) {
            newErrors.cardHolderName = "Please enter the cardholder name";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEdit = (card: CreditCard) => {
        setIsEditing(true);
        setEditingCardId(card.id);
        setFormData({
            cardNumber: card.cardNumber,
            cardHolderName: card.cardHolderName,
            expiryDate: card.expiryDate,
            cvv: "", // לא נדרש בעריכה
            isDefault: card.isDefault || false,
            cardType: card.cardType,
        });
        setErrors({});
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            const t = await AsyncStorage.getItem("accessToken");
            const u = await AsyncStorage.getItem("userId");
            if (!t || !u) {
                Alert.alert("Error", "Missing access token or user ID.");
                return;
            }
            const url = isEditing
                ? `${config.BASE_URL}/auth/credit-cards/${editingCardId}`
                : `${config.BASE_URL}/auth/add-credit-cards`;
            const resp = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${t}`,
                },
                body: JSON.stringify({
                    cardNumber: formData.cardNumber.replace(/\s/g, ""),
                    cardHolderName: formData.cardHolderName,
                    expiryDate: formData.expiryDate,
                    isDefault: formData.isDefault,
                }),
            });
            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.message || "Failed to save card");
            }
            const data = await resp.json();
            await fetchCards();
            setIsModalVisible(false);
            resetForm();
            Alert.alert("Success", data.message || "ok");
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    };

    const resetForm = () => {
        setFormData({
            cardNumber: "",
            cardHolderName: "",
            expiryDate: "",
            cvv: "",
            isDefault: false,
            cardType: "visa",
        });
        setErrors({});
        setIsEditing(false);
        setEditingCardId(null);
    };

    const handleDelete = (cardId: string) => {
        Alert.alert("Delete Card", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    await fetch(
                        `${config.BASE_URL}/auth/delete-credit-cards/${cardId}`,
                        {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}`! },
                        }
                    );
                    await fetchCards();
                    Alert.alert("Success", "Card deleted");
                },
            },
        ]);
    };

    const handleSetDefault = async (cardId: string) => {
        await fetch(
            `${config.BASE_URL}/auth/credit-cards/${cardId}/default`,
            { method: "PUT", headers: { Authorization: `Bearer ${token}`! } }
        );
        await fetchCards();
        Alert.alert("Success", "Default card updated");
    };

    const renderCard = ({ item }: { item: CreditCard }) => (
        <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
                <Image
                    source={
                        item.cardType === "visa"
                            ? require("../assets/images/visa-logo.png")
                            : require("../assets/images/mastercard-logo.png")
                    }
                    style={styles.cardLogo}
                />
                <View style={styles.cardActions}>
                    {!item.isDefault && (
                        <TouchableOpacity
                            testID={`default-card-${item.id}`}
                            onPress={() => handleSetDefault(item.id)}
                            style={styles.actionButton}
                        >
                            <Ionicons name="star-outline" size={24} color="#6b4226" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        testID={`edit-card-${item.id}`}
                        onPress={() => handleEdit(item)}
                        style={styles.actionButton}
                    >
                        <Ionicons name="pencil" size={24} color="#6b4226" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID={`delete-card-${item.id}`}
                        onPress={() => handleDelete(item.id)}
                        style={styles.actionButton}
                    >
                        <Ionicons name="trash-outline" size={24} color="#d9534f" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.cardNumber}>
                **** **** **** {item.cardNumber.slice(-4)}
            </Text>
            <View style={styles.cardDetails}>
                <View>
                    <Text style={styles.cardLabel}>Cardholder Name</Text>
                    <Text style={styles.cardValue}>{item.cardHolderName}</Text>
                </View>
                <View>
                    <Text style={styles.cardLabel}>Expiry Date</Text>
                    <Text style={styles.cardValue}>{item.expiryDate}</Text>
                </View>
            </View>
            {item.isDefault && (
                <View style={styles.defaultBadge}>
                    <Ionicons name="star" size={16} color="#6b4226" />
                    <Text style={styles.defaultText}>Default Card</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header title="My Credit Cards" />

            <FlatList
                data={cards}
                renderItem={renderCard}
                keyExtractor={(item) => item.id}
                style={styles.cardList}
            />

            <TouchableOpacity
                testID="add-card-button"
                style={styles.addButton}
                onPress={() => {
                    resetForm();
                    setIsModalVisible(true);
                }}
            >
                <Text style={styles.addButtonText}>Add Credit Card</Text>
            </TouchableOpacity>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => {
                    setIsModalVisible(false);
                    resetForm();
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {isEditing ? "Edit Card" : "Add New Card"}
                        </Text>

                        {/* שדות הטופס */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Card Number</Text>
                            <TextInput
                                testID="card-number-input"
                                placeholder="1234 5678 9012 3456"
                                value={formData.cardNumber}
                                onChangeText={(text) =>
                                    setFormData((f) => ({ ...f, cardNumber: text }))
                                }
                                keyboardType="numeric"
                                maxLength={19}
                                style={styles.input}
                            />
                            {errors.cardNumber && (
                                <Text testID="error-cardNumber" style={styles.errorText}>
                                    {errors.cardNumber}
                                </Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Cardholder Name</Text>
                            <TextInput
                                testID="cardholder-input"
                                placeholder="John Doe"
                                value={formData.cardHolderName}
                                onChangeText={(text) =>
                                    setFormData((f) => ({ ...f, cardHolderName: text }))
                                }
                                style={styles.input}
                            />
                            {errors.cardHolderName && (
                                <Text testID="error-cardHolderName" style={styles.errorText}>
                                    {errors.cardHolderName}
                                </Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Expiry Date</Text>
                            <TextInput
                                testID="expiry-input"
                                placeholder="MM/YY"
                                value={formData.expiryDate}
                                onChangeText={(text) =>
                                    setFormData((f) => ({ ...f, expiryDate: text }))
                                }
                                keyboardType="numeric"
                                maxLength={5}
                                style={styles.input}
                            />
                            {errors.expiryDate && (
                                <Text testID="error-expiryDate" style={styles.errorText}>
                                    {errors.expiryDate}
                                </Text>
                            )}
                        </View>

                        {!isEditing && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>CVV</Text>
                                <TextInput
                                    testID="cvv-input"
                                    placeholder="123"
                                    value={formData.cvv}
                                    onChangeText={(text) =>
                                        setFormData((f) => ({ ...f, cvv: text }))
                                    }
                                    keyboardType="numeric"
                                    maxLength={3}
                                    secureTextEntry
                                    style={styles.input}
                                />
                                {errors.cvv && (
                                    <Text testID="error-cvv" style={styles.errorText}>
                                        {errors.cvv}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                testID="cancel-button"
                                onPress={() => {
                                    setIsModalVisible(false);
                                    resetForm();
                                }}
                                style={[styles.modalButton, styles.cancelButton]}
                            >
                                <Text
                                    style={[styles.buttonText, styles.cancelButtonText]}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID={isEditing ? "update-button" : "save-button"}
                                onPress={handleSave}
                                style={[styles.modalButton, styles.saveButton]}
                            >
                                <Text style={styles.buttonText}>
                                    {isEditing ? "Update" : "Save"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
