import React, { useState, useEffect } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

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
  const [discount, setDiscount] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
          expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Alert.alert("Success", "Discount code created");
      setCode("");
      setDiscount("");
      setExpiryDate(undefined);
      fetchCodes();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error:", err.message);
      } else {
        console.error("Unknown error:", err);
      }
    }
  };

  const deleteCode = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${config.BASE_URL}/discount/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete discount code");
      Alert.alert("Success", "Discount code deleted");
      fetchCodes();
    } catch (error) {
      Alert.alert("Error", "Failed to delete discount code");
    }
  };

  const renderCode = ({ item }: { item: DiscountCode }) => (
    <View style={styles.codeCard}>
      <View style={styles.codeDetails}>
        <Text style={styles.codeText}>Code: {item.code}</Text>
        <Text style={styles.codeText}>
          Discount: {item.discountPercentage}%
        </Text>
        <Text style={styles.codeText}>
          Expires:{" "}
          {item.expiryDate
            ? new Date(item.expiryDate).toLocaleDateString()
            : "No expiry"}
        </Text>
        <Text
          style={[styles.codeText, { color: item.isActive ? "green" : "red" }]}
        >
          Status: {item.isActive ? "Active" : "Inactive"}
        </Text>
      </View>
      {/* כפתור מחיקת קוד במרכז בצד ימין */}
      <TouchableOpacity
        style={styles.trashButton}
        onPress={() => deleteCode(item._id)}
      >
        <Ionicons name="trash" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss(); // מסתיר את המקלדת כאשר לוחצים מחוץ לשדות קלט
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Manage Discount Codes</Text>

        <TextInput
          placeholder="Code"
          placeholderTextColor={"#aaa"}
          style={styles.input}
          value={code}
          onChangeText={setCode}
        />
        <TextInput
          placeholder="Discount %"
          placeholderTextColor={"#aaa"}
          keyboardType="numeric"
          style={styles.input}
          value={discount}
          onChangeText={setDiscount}
        />

        {/* תאריך בורר */}
        <View style={styles.datePickerContainer}>
          <Text style={styles.datePickerText}>
            Please select an expiry date:
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {expiryDate ? expiryDate.toLocaleDateString() : "Select Date"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expiryDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (event.type === "set" && selectedDate) {
                  setExpiryDate(selectedDate);
                }
              }}
            />
          )}
        </View>

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
    </TouchableWithoutFeedback>
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
    flexDirection: "row", // מאפשר את הצגת האלמנטים בשורה
    justifyContent: "space-between", // משאיר רווח בין האלמנטים
    alignItems: "center", // יישור האלמנטים במרכז בגובה
  },
  codeDetails: {
    flex: 1, // מאפשר להרחיב את הטקסט למלא את השטח הפנוי
  },
  codeText: {
    fontSize: 16,
    color: "#333",
  },
  datePickerContainer: {
    marginTop: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: "#6b4226",
    marginBottom: 10,
    textAlign: "center",
  },
  trashButton: {
    padding: 5,
    alignSelf: "flex-end", // ממקם את הכפתור בצד ימין
    marginBottom: 25,
  },
  dateButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    width: "100%",
    alignItems: "center",
  },
  dateButtonText: {
    color: "#6b4226",
    fontSize: 16,
  },
});
