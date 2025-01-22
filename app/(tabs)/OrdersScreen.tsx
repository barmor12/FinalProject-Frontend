import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import config from "../../config";

// Typing for an individual order
interface Order {
  _id: string;
  cake: {
    name: string;
  };
  quantity: number;
  totalPrice: number;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");

        if (!token) {
          console.error("No access token found");
          return;
        }

        const response = await axios.get(`${config.BASE_URL}/order/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Fetched orders:", response.data);
        setOrders(response.data);
      } catch (error) {
        if ((error as any).response?.status === 403) {
          console.error("Access denied. Admin role required.");
        } else if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          console.error("Unauthorized. Token may be missing or expired.");
        } else {
          console.error("Failed to fetch orders:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6b4226" />
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>
          No orders found or insufficient permissions.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("SaveDraftOrder")}
        >
          <Text style={styles.buttonText}>Create New Order</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.orderText}>Order ID: {item._id}</Text>
            <Text style={styles.orderText}>Cake: {item.cake.name}</Text>
            <Text style={styles.orderText}>Quantity: {item.quantity}</Text>
            <Text style={styles.orderText}>Total: ${item.totalPrice}</Text>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("SaveDraftOrder")}
      >
        <Text style={styles.buttonText}>Create New Order</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f3ea",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b4226",
    marginBottom: 20,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  orderText: {
    fontSize: 16,
    color: "#6b4226",
  },
  button: {
    backgroundColor: "#6b4226",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
