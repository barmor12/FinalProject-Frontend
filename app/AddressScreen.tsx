import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles/AddressStyles';
import config from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Address {
    _id: string;
    street: string;
    city: string;
    isDefault?: boolean;
}

export default function AddressScreen() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        isDefault: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const initializeData = async () => {
            const token = await AsyncStorage.getItem("accessToken");
            const userId = await AsyncStorage.getItem("userId");

            if (!token || !userId) {
                Alert.alert("Error", "Please log in to view your addresses");
                return;
            }

            setToken(token);
            await fetchAddresses();
        };

        initializeData();
    }, []);

    const fetchAddresses = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const userId = await AsyncStorage.getItem("userId");

            if (!token || !userId) {
                Alert.alert("Error", "Missing access token or user ID.");
                return;
            }

            console.log('Fetching addresses with token:', token);
            const response = await fetch(`${config.BASE_URL}/address`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                throw new Error(errorData.message || 'Failed to fetch addresses');
            }

            const data = await response.json();
            console.log('Raw response data:', data);

            // Check if data is an array or has an addresses property
            const addressesArray = Array.isArray(data) ? data : (data.addresses || []);
            console.log('Processed addresses:', addressesArray);

            setAddresses(addressesArray);
        } catch (error: any) {
            console.error('Error fetching addresses:', error);
            Alert.alert('Error', error.message || 'Failed to load addresses');
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }

        if (!formData.street.trim()) {
            newErrors.street = 'Street address is required';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEdit = (address: Address) => {
        setIsEditing(true);
        setEditingAddressId(address._id);
        setFormData({
            fullName: '',
            phone: '',
            street: address.street,
            city: address.city,
            isDefault: address.isDefault || false,
        });
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

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
                body: JSON.stringify({ ...formData, isDefault: false }),
            });

            if (!response.ok) throw new Error("Failed to add address");

            Alert.alert("Success", "Address added successfully!");
            resetForm();
            await fetchAddresses();
        } catch (error) {
            console.error("Error adding address:", error);
            Alert.alert("Error", "Failed to add address.");
        } finally {
            setLoading(false);
            setIsModalVisible(false);
        }
    };

    const handleDelete = async (addressId: string) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${config.BASE_URL}/address/${addressId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            if (!response.ok) {
                                throw new Error('Failed to delete address');
                            }

                            await fetchAddresses();
                            Alert.alert('Success', 'Address deleted successfully');
                        } catch (error) {
                            console.error('Error deleting address:', error);
                            Alert.alert('Error', 'Failed to delete address');
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefault = async (addressId: string) => {
        try {
            console.log(addressId);
            if (!addressId) {
                Alert.alert("Error", "Invalid address ID");
                return;
            }

            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                Alert.alert("Error", "Please log in to set default address");
                return;
            }

            console.log('Setting default address:', addressId);
            const response = await fetch(`${config.BASE_URL}/address/default/${addressId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            console.log('Response status:', response.status);

            // Check if response is JSON before trying to parse it
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const responseData = await response.json();
                console.log('Set default response:', responseData);

                if (!response.ok) {
                    throw new Error(responseData.message || 'Failed to set default address');
                }
            } else {
                // If response is not JSON, check status
                if (!response.ok) {
                    throw new Error(`Failed to set default address: ${response.status}`);
                }
            }

            // Refresh the addresses list
            await fetchAddresses();
            Alert.alert('Success', 'Default address updated successfully');
        } catch (error: any) {
            console.error('Error setting default address:', error);
            Alert.alert('Error', error.message || 'Failed to set default address');
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            phone: '',
            street: '',
            city: '',
            isDefault: false,
        });
        setErrors({});
        setIsEditing(false);
        setEditingAddressId(null);
    };

    const renderAddress = ({ item }: { item: Address }) => {
        console.log('Rendering address item:', item);
        return (
            <View style={styles.cardContainer} key={item._id}>
                <View style={styles.cardHeader}>
                    <Ionicons name="location" size={24} color="#6b4226" />
                    <View style={styles.cardActions}>
                        {!item.isDefault && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleSetDefault(item._id)}
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
                            onPress={() => handleDelete(item._id)}
                        >
                            <Ionicons name="trash-outline" size={24} color="#d9534f" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.addressDetails}>
                    <Text style={styles.addressValue}>{item.street}</Text>
                    <Text style={styles.addressValue}>{item.city}</Text>
                </View>
                {item.isDefault && (
                    <View style={styles.defaultBadge}>
                        <Ionicons name="star" size={16} color="#6b4226" />
                        <Text style={styles.defaultText}>Default Address</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>My Addresses</Text>
            </View>
            <FlatList
                data={addresses}
                renderItem={renderAddress}
                keyExtractor={(item) => item._id}
                style={styles.cardList}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsModalVisible(true)}
            >
                <Text style={styles.addButtonText}>Add Address</Text>
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
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalContainer}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {isEditing ? 'Edit Address' : 'Add New Address'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsModalVisible(false);
                                        resetForm();
                                    }}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={styles.scrollContent}
                            >
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.fullName}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, fullName: text })
                                        }
                                        placeholder="Name"
                                        returnKeyType="next"
                                    />
                                    {errors.fullName && (
                                        <Text style={styles.errorText}>{errors.fullName}</Text>
                                    )}
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.phone}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, phone: text })
                                        }
                                        placeholder="050-1234567"
                                        keyboardType="phone-pad"
                                        returnKeyType="next"
                                    />
                                    {errors.phone && (
                                        <Text style={styles.errorText}>{errors.phone}</Text>
                                    )}
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Street Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.street}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, street: text })
                                        }
                                        placeholder="Street"
                                        returnKeyType="next"
                                    />
                                    {errors.street && (
                                        <Text style={styles.errorText}>{errors.street}</Text>
                                    )}
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>City</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.city}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, city: text })
                                        }
                                        placeholder="Tel-Aviv"
                                        returnKeyType="done"
                                        onSubmitEditing={handleSave}
                                    />
                                    {errors.city && (
                                        <Text style={styles.errorText}>{errors.city}</Text>
                                    )}
                                </View>
                            </ScrollView>

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
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
} 