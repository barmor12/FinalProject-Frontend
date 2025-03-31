import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    Alert,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./_layout";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export default function AdminUsersScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [emailModalVisible, setEmailModalVisible] = useState(false);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    type manageUsersScreenRouteProp = RouteProp<
        { manageUsersScreen: { shouldRefresh?: boolean } },
        "manageUsersScreen"
    >;
    const route = useRoute<manageUsersScreenRouteProp>();
    const { shouldRefresh } = route.params || {};

    useFocusEffect(
        useCallback(() => {
            if (shouldRefresh) {
                fetchUsers();
                navigation.setParams({ shouldRefresh: false });
            }
        }, [shouldRefresh])
    );

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredUsers(
                users.filter(
                    (user) =>
                        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                alert("You need to be logged in.");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/admin/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            alert("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteUser = async () => {
        if (!selectedUserId) return;

        const selectedUser = users.find(u => u._id === selectedUserId);
        if (!selectedUser) {
            Alert.alert("Error", "User not found");
            return;
        }

        Alert.alert(
            "Delete User",
            `Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("accessToken");
                            if (!token) {
                                Alert.alert("Error", "Authorization token is required");
                                return;
                            }

                            const response = await fetch(`${config.BASE_URL}/delete/sendEmail/${selectedUserId}`, {
                                method: "DELETE",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                            const data = await response.json();

                            if (!response.ok) {
                                throw new Error(data.error || "Failed to delete user");
                            }

                            Alert.alert("Success", "User deleted and email sent.");
                            setMenuVisible(false);
                            fetchUsers(); // ריענון הרשימה
                        } catch (error: any) {
                            console.error("❌ Error deleting user:", error);
                            Alert.alert("Error", error.message || "Failed to delete user.");
                        }
                    },
                },
            ]
        );
    };

    const handleUserPress = (userId: string) => {
        router.push({ pathname: "/userDetailsScreen", params: { userId } });
    };
    const sendOrderEmail = async (managerMessage: string, hasMsg: boolean) => {
        const selectedUser = users.find(u => u._id === selectedUserId);

        if (!selectedUser || !selectedUser.email) {
            Alert.alert("Error", "User email not found");
            return;
        }

        if (hasMsg && !managerMessage.trim()) {
            Alert.alert("Error", "Please enter a message.");
            return;
        }

        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
            Alert.alert("Error", "Authorization token is required");
            return;
        }

        try {
            const response = await fetch(`${config.BASE_URL}/sendEmail/order/${selectedUser._id}/message`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerEmail: selectedUser.email,
                    managerMessage,
                    isManagerMessage: hasMsg,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send email");
            }

            Alert.alert("Success", "Email sent successfully to the customer!");
            setEmailModalVisible(false);
            setMessageText("");
        } catch (error: any) {
            console.error("❌ Error sending email:", error);
            Alert.alert("Error", error.message || "Failed to send email. Please try again.");
        }
    };
    const toggleMenu = (userId: string) => {
        if (selectedUserId === userId) {
            setMenuVisible(!menuVisible);
        } else {
            setSelectedUserId(userId);
            setMenuVisible(true);
        }
    };

    const renderItem = ({ item }: { item: User }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>
                    {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userRole}>Role: {item.role}</Text>
            </View>

            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => handleUserPress(item._id)}
                >
                    <MaterialIcons name="info" size={20} color="#fff" />
                    <Text style={styles.detailsText}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => toggleMenu(item._id)}
                >
                    <MaterialIcons name="more-vert" size={24} color="#6b4226" />
                </TouchableOpacity>
            </View>

            {menuVisible && selectedUserId === item._id && (
                <Modal
                    transparent
                    visible={menuVisible}
                    animationType="fade"
                    onRequestClose={() => setMenuVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity style={styles.modalButton}>
                                <Text style={styles.modalButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteBtn]}
                                onPress={handleDeleteUser}
                            >
                                <Text style={styles.modalButtonText}>Delete</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => {
                                    setMenuVisible(false);
                                    setEmailModalVisible(true);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Send Message</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelBtn]}
                                onPress={() => setMenuVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Admin User Management</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search by name"
                placeholderTextColor="#a58c6f"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#6b4226" />
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
            <Modal transparent={true} visible={emailModalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Send Email to Customer</Text>
                        <Text style={styles.modalSubTitle}>Customer Email: {users.find(u => u._id === selectedUserId)?.email}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your message..."
                            multiline
                            value={messageText}
                            onChangeText={setMessageText}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={() => sendOrderEmail(messageText, true)}>
                            <Text style={styles.sendButtonText}>Send Email</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setEmailModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
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
        backgroundColor: "#f9f3ea",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6b4226",
        textAlign: "center",
        marginBottom: 20,
    },
    searchInput: {
        height: 40,
        borderColor: "#d2b48c",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 20,
        backgroundColor: "#fff",
        color: "#6b4226",
    },
    userCard: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 2,
    },
    userInfo: {
        marginBottom: 10,
    },
    userName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#6b4226",
    },
    userEmail: {
        fontSize: 14,
        color: "#8a6f4d",
    },
    userRole: {
        fontSize: 14,
        color: "#a58c6f",
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    detailsButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#6b4226",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    detailsText: {
        color: "#fff",
        marginLeft: 6,
        fontWeight: "bold",
    },
    menuButton: {
        padding: 5,
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
    modalButton: {
        width: "100%",
        padding: 12,
        borderRadius: 6,
        backgroundColor: "#d2b48c",
        marginVertical: 6,
        alignItems: "center",
    },
    modalButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    deleteBtn: {
        backgroundColor: "#d9534f",
    },
    cancelBtn: {
        backgroundColor: "#6b4226",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#6b4226",
        marginBottom: 10,
        textAlign: "center"
    },

    sendBtn: {
        backgroundColor: "#6b4226",
    },
    // modalTitle: { fontSize: 20, fontWeight: "bold", color: "#6b4226", marginBottom: 10 },
    modalSubTitle: { fontSize: 16, color: "#6b4226", marginBottom: 10 },
    input: {
        width: "100%",
        height: 80,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: "#f9f9f9",
        textAlignVertical: "top",
    },
    sendButton: {
        backgroundColor: "#6b4226",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: "center",
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    sendButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    closeButton: {
        backgroundColor: "#d9534f",
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: "center",
        width: "100%",
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
