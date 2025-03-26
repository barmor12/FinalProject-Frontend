import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export default function UserDetailsScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const route = useRoute();
    const { userId } = route.params as { userId: string };

    useEffect(() => {
        fetchUserDetails();
    }, [userId]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                alert("You need to be logged in.");
                return;
            }

            const response = await fetch(`${config.BASE_URL}/users/${userId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user details");
            }

            const data = await response.json();
            setUser(data);
        } catch (error) {
            console.error("Error fetching user details:", error);
            alert("Failed to fetch user details.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = (newRole: string) => {
        // פונקציה לעדכון תפקיד המשתמש
        alert(`Update role to: ${newRole}`);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>User Details</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : user ? (
                <View>
                    <Text style={styles.userInfo}>Name: {user.firstName} {user.lastName}</Text>
                    <Text style={styles.userInfo}>Email: {user.email}</Text>
                    <Text style={styles.userInfo}>Role: {user.role}</Text>

                    <Button title="Change Role to Admin" onPress={() => handleUpdateRole("admin")} />
                </View>
            ) : (
                <Text>User not found</Text>
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
    userInfo: {
        fontSize: 18,
        marginBottom: 10,
    },
});
