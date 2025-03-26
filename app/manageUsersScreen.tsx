import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, Button, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    const navigation = useNavigation();

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        // חיפוש דינמי
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

            const response = await fetch(`${config.BASE_URL}/users`, {
                method: "GET",
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

    const handleUserPress = (userId: string) => {
        // ניווט למסך פרטי המשתמש
        navigation.navigate("UserDetails", { userId });
    };

    const renderItem = ({ item }: { item: User }) => (
        <View style={styles.userItem}>
            <Text style={styles.userName}>{`${item.firstName} ${item.lastName}`}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Button
                title="View Details"
                onPress={() => handleUserPress(item._id)}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin User Management</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search by name"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                />
            )}
        </View>
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
});
