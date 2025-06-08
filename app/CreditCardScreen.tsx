import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles/CreditCardStyles';
import config from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CreditCard {
    id: string;
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string;
    cardType: 'visa' | 'mastercard';
    isDefault?: boolean;
}

export default function CreditCardScreen() {
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardHolderName: '',
        expiryDate: '',
        cvv: '',
        isDefault: false,
        cardType: 'visa' as 'visa' | 'mastercard'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const initializeData = async () => {
            const token = await AsyncStorage.getItem("accessToken");
            const userId = await AsyncStorage.getItem("userId");

            if (!token || !userId) {
                Alert.alert("Error", "Please log in to view your credit cards");
                return;
            }

            setToken(token);
            await fetchCards();
        };

        initializeData();
    }, []);

    const fetchCards = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const userId = await AsyncStorage.getItem("userId");

            if (!token || !userId) {
                Alert.alert("Error", "Missing access token or user ID.");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/auth/credit-cards`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch cards');
            }

            const data = await response.json();
            console.log('Fetched cards:', data);
            setCards(data.cards || []); // Access the cards array from the response
        } catch (error: any) {
            console.error('Error fetching cards:', error);
            Alert.alert('Error', error.message || 'Failed to load credit cards');
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Card number validation
        if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
            newErrors.cardNumber = 'Please enter a valid 16-digit card number';
        }

        // Expiry date validation
        if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.expiryDate)) {
            newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
        }

        // CVV validation
        if (!/^\d{3}$/.test(formData.cvv)) {
            newErrors.cvv = 'Please enter a valid 3-digit CVV';
        }

        // Cardholder name validation
        if (!formData.cardHolderName.trim()) {
            newErrors.cardHolderName = 'Please enter the cardholder name';
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
            cvv: '', // Don't show CVV for security
            isDefault: card.isDefault || false,
            cardType: card.cardType
        });
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const token = await AsyncStorage.getItem("accessToken");
            const userId = await AsyncStorage.getItem("userId");

            if (!token || !userId) {
                Alert.alert("Error", "Missing access token or user ID.");
                return;
            }

            const url = isEditing
                ? `${config.BASE_URL}/auth/credit-cards/${editingCardId}`
                : `${config.BASE_URL}/auth/add-credit-cards`;
            console.log(formData.cardNumber);

            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cardNumber: formData.cardNumber.replace(/\s/g, ''),
                    cardHolderName: formData.cardHolderName,
                    expiryDate: formData.expiryDate,
                    isDefault: formData.isDefault,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'save'} card`);
            }

            const data = await response.json();
            await fetchCards();
            setIsModalVisible(false);
            resetForm();
            Alert.alert('Success', data.message || `Credit card ${isEditing ? 'updated' : 'added'} successfully`);
        } catch (error: any) {
            console.error(`Error ${isEditing ? 'updating' : 'saving'} card:`, error);
            Alert.alert('Error', error.message || `Failed to ${isEditing ? 'update' : 'save'} credit card`);
        }
    };

    const resetForm = () => {
        setFormData({
            cardNumber: '',
            cardHolderName: '',
            expiryDate: '',
            cvv: '',
            isDefault: false,
            cardType: 'visa' as 'visa' | 'mastercard'
        });
        setErrors({});
        setIsEditing(false);
        setEditingCardId(null);
    };

    const handleDelete = async (cardId: string) => {
        Alert.alert(
            'Delete Card',
            'Are you sure you want to delete this card?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${config.BASE_URL}/auth/delete-credit-cards/${cardId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            if (!response.ok) {
                                throw new Error('Failed to delete card');
                            }

                            await fetchCards();
                            Alert.alert('Success', 'Card deleted successfully');
                        } catch (error) {
                            console.error('Error deleting card:', error);
                            Alert.alert('Error', 'Failed to delete card');
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefault = async (cardId: string) => {
        try {
            const response = await fetch(`${config.BASE_URL}/auth/credit-cards/${cardId}/default`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to set default card');
            }

            await fetchCards();
            Alert.alert('Success', 'Default card updated successfully');
        } catch (error) {
            console.error('Error setting default card:', error);
            Alert.alert('Error', 'Failed to set default card');
        }
    };

    const detectCardType = (number: string): 'visa' | 'mastercard' | null => {
        // Remove all non-digit characters
        const cleaned = number.replace(/\D/g, '');

        // Visa: starts with 4
        if (/^4/.test(cleaned)) {
            console.log('Detected as Visa card');
            return 'visa';
        }

        // Mastercard: starts with 51-55 or 2221-2720
        if (/^5[1-5]/.test(cleaned) || /^2[2-7][2-9][1-9]/.test(cleaned)) {
            console.log('Detected as Mastercard');
            return 'mastercard';
        }

        console.log('Card type not detected');
        return null;
    };

    const validateCardNumber = (number: string): boolean => {
        // Remove all non-digit characters
        const cleaned = number.replace(/\D/g, '');

        // Check if it's a valid length (13-19 digits)
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }

        // Luhn algorithm for card number validation
        let sum = 0;
        let isEven = false;

        // Loop through values starting from the rightmost digit
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i));

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    };

    const handleCardNumberChange = (text: string) => {
        // Remove any non-digit characters
        const cleaned = text.replace(/\D/g, '');

        // Format the number in groups of 4
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;

        // Detect card type
        const cardType = detectCardType(cleaned);
        console.log('Card number changed:', {
            number: cleaned,
            type: cardType
        });

        setFormData(prev => ({
            ...prev,
            cardNumber: formatted,
            cardType: cardType || 'visa' // Default to visa if type not detected
        }));
    };

    const handleExpiryDateChange = (text: string) => {
        // Remove any non-digit characters
        const cleaned = text.replace(/\D/g, '');

        // Format the date as MM/YY
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }

        setFormData(prev => ({
            ...prev,
            expiryDate: formatted
        }));
    };

    const renderCard = ({ item }: { item: CreditCard }) => {
        console.log('Rendering card:', item);
        return (
            <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                    <Image
                        source={
                            item.cardType.toLowerCase() === 'visa'
                                ? require('../assets/images/visa-logo.png')
                                : require('../assets/images/mastercard-logo.png')
                        }
                        style={styles.cardLogo}
                    />
                    <View style={styles.cardActions}>
                        {!item.isDefault && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleSetDefault(item.id)}
                            >
                                <Ionicons name="star-outline" size={24} color="#6b4226" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEdit(item)}
                        >
                            <Ionicons name="pencil" size={24} color="#6b4226" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDelete(item.id)}
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
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>My Credit Cards</Text>
            <FlatList
                data={cards}
                renderItem={renderCard}
                keyExtractor={(item) => item.id}
                style={styles.cardList}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsModalVisible(true)}
            >
                <Text style={styles.addButtonText}>Add Credit Card</Text>
            </TouchableOpacity>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setIsModalVisible(false);
                    resetForm();
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {isEditing ? 'Edit Card' : 'Add New Card'}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Card Number</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.cardNumber}
                                onChangeText={handleCardNumberChange}
                                placeholder="1234 5678 9012 3456"
                                keyboardType="numeric"
                                maxLength={19}
                                editable={!isEditing}
                            />
                            {errors.cardNumber && (
                                <Text style={styles.errorText}>{errors.cardNumber}</Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Cardholder Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.cardHolderName}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, cardHolderName: text })
                                }
                                placeholder="John Doe"
                            />
                            {errors.cardHolderName && (
                                <Text style={styles.errorText}>{errors.cardHolderName}</Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Expiry Date</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.expiryDate}
                                onChangeText={handleExpiryDateChange}
                                placeholder="MM/YY"
                                keyboardType="numeric"
                                maxLength={5}
                                returnKeyType="next"
                            />
                            {errors.expiryDate && (
                                <Text style={styles.errorText}>{errors.expiryDate}</Text>
                            )}
                        </View>

                        {!isEditing && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>CVV</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.cvv}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, cvv: text })
                                    }
                                    placeholder="123"
                                    keyboardType="numeric"
                                    maxLength={3}
                                    secureTextEntry
                                />
                                {errors.cvv && (
                                    <Text style={styles.errorText}>{errors.cvv}</Text>
                                )}
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setIsModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.buttonText}>
                                    {isEditing ? 'Update' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
} 