import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker"; // Dropdown לבחירת עוגות
import config from "../config";

// מבנה נתונים של עוגה
interface Cake {
  _id: string;
  name: string;
  price: number;
}

// מסך יצירת הזמנה חדשה
export default function CreateOrderScreen() {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  // **שליפת רשימת העוגות**
  useEffect(() => {
    const fetchCakes = async () => {
      try {
        const response = await axios.get(`${config.BASE_URL}/cakes`);
        setCakes(response.data);
      } catch (error) {
        console.error("Failed to fetch cakes:", error);
      }
    };

    fetchCakes();
  }, []);

  // **פונקציה לשליחת ההזמנה**
  const handlePlaceOrder = async () => {
    if (!selectedCake || quantity < 1) {
      Alert.alert("Error", "Please select a cake and enter a valid quantity.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const response = await axios.post(
        `${config.BASE_URL}/order/create`,
        {
          userId: "USER_ID_FROM_AUTH", // יש לעדכן עם ה-User ID הנכון
          cakeId: selectedCake._id,
          quantity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        Alert.alert("Success", "Your order has been placed successfully!");
        navigation.navigate("OrdersScreen"); // חזרה לרשימת ההזמנות
      } else {
        Alert.alert("Error", "Failed to place order.");
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      Alert.alert("Error", "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create New Order</Text>

      {/* תפריט בחירת עוגה */}
      <Text style={styles.label}>Select a Cake:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCake?._id || ""}
          onValueChange={(itemValue) => {
            const selected = cakes.find((cake) => cake._id === itemValue);
            setSelectedCake(selected || null);
          }}
        >
          <Picker.Item label="Select a cake..." value="" />
          {cakes.map((cake) => (
            <Picker.Item key={cake._id} label={cake.name} value={cake._id} />
          ))}
        </Picker>
      </View>

      {/* שדה כמות */}
      <Text style={styles.label}>Quantity:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={quantity.toString()}
        onChangeText={(text) => {
          const parsed = parseInt(text);
          setQuantity(isNaN(parsed) ? 1 : parsed);
        }}
      />

      {/* מחיר כולל */}
      {selectedCake && (
        <Text style={styles.totalPrice}>
          Total Price: ${(selectedCake.price * quantity).toFixed(2)}
        </Text>
      )}

      {/* כפתור יצירת הזמנה */}
      <TouchableOpacity
        style={styles.orderButton}
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        <Text style={styles.orderButtonText}>
          {loading ? "Placing Order..." : "Place Order"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// **עיצוב המסך**
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
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6b4226",
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#6b4226",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: 5,
    padding: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#6b4226",
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    backgroundColor: "#fff",
    marginTop: 5,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6b4226",
    textAlign: "center",
    marginVertical: 20,
  },
  orderButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
