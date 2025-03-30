import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, FlatList, Button, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./_layout";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export default function AdminUsersScreen() {
    const [users, setUsers] = useState<User[]>([]); // כל המשתמשים
    const [searchQuery, setSearchQuery] = useState(""); // חיפוש
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // משתמשים אחרי סינון
    const [loading, setLoading] = useState(false); // מצב טעינה
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // משתמש שנבחר לתפריט
    const [menuVisible, setMenuVisible] = useState(false); // תצוגת התפריט

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    type manageUsersScreenRouteProp = RouteProp<{ manageUsersScreen: { shouldRefresh?: boolean } }, "manageUsersScreen">;
    const route = useRoute<manageUsersScreenRouteProp>();

    const { shouldRefresh } = route.params || {}; // אם יש צורך לעדכן את המשתמשים

    // טעינה מחדש של המשתמשים כאשר צריך
    useFocusEffect(
        useCallback(() => {
            if (shouldRefresh) {
                fetchUsers();
                navigation.setParams({ shouldRefresh: false });
            }
        }, [shouldRefresh])
    );

    // טעינת המשתמשים ב-Effect ראשון
    useEffect(() => {
        fetchUsers();
    }, []);

    // סינון המשתמשים לפי חיפוש
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
            setFilteredUsers(users); // אם אין חיפוש, החזרת כל המשתמשים
        }
    }, [searchQuery, users]);

    // פונקציה לטיפול בטעינת המשתמשים
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                alert("You need to be logged in.");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/admin/users`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            console.log(data);  // הדפסת הנתונים
            setUsers(data);
            setFilteredUsers(data); // עדכון גם את המשתמשים המסוננים

        } catch (error) {
            console.error("Error fetching users:", error);
            alert("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    // ניווט לפרטי המשתמש
    const handleUserPress = (userId: string) => {
        console.log(userId);
        navigation.navigate("UserDetails", { userId });
    };

    // הצגת תפריט ליד המשתמש
    const toggleMenu = (userId: string) => {
        if (selectedUserId === userId) {
            setMenuVisible(!menuVisible);
        } else {
            setSelectedUserId(userId);
            setMenuVisible(true);
        }
    };

    // רכיב של כל משתמש ב-FlatList
    const renderItem = ({ item }: { item: User }) => (
        <View style={styles.userItem}>
            <Text style={styles.userName}>{`${item.firstName} ${item.lastName}`}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Button
                title="View Details"
                onPress={() => handleUserPress(item._id)}
            />
            <TouchableOpacity onPress={() => toggleMenu(item._id)} style={styles.menuButton}>
                <Text style={styles.menuText}>•••</Text>
            </TouchableOpacity>

            {menuVisible && selectedUserId === item._id && (
                <Modal
                    transparent={true}
                    visible={menuVisible}
                    animationType="fade"
                    onRequestClose={() => setMenuVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Button title="Edit" onPress={() => { }} />
                            <Button title="Delete" onPress={() => { }} />
                            <Button title="Cancel" onPress={() => setMenuVisible(false)} />
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );

    return (
        <SafeAreaView>
            <Text style={styles.title}>Admin User Management</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search by name"
                value={searchQuery}
                onChangeText={setSearchQuery} // עדכון של חיפוש בזמן אמת
            />

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={filteredUsers} // מוצג רק מה שנמצא אחרי סינון
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fafafa",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    searchInput: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
        paddingLeft: 10,
    },
    userItem: {
        backgroundColor: "#fff",
        padding: 15,
        marginBottom: 10,
        borderRadius: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
        position: "relative",
    },
    userName: {
        fontSize: 18,
        fontWeight: "bold",
    },
    userEmail: {
        fontSize: 14,
        color: "#777",
        marginBottom: 10,
    },
    menuButton: {
        position: "absolute",
        top: 15,
        right: 15,
    },
    menuText: {
        fontSize: 20,
        color: "#000",
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
        borderRadius: 8,
        width: "80%",
        alignItems: "center",
    },
});
