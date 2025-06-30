import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  RefreshControl,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/AdminScreensStyles/adminDiscountCodesScreenStyles";

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
  const [tempDate, setTempDate] = useState<Date | null>(null);

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
      const now = new Date();
      const updatedCodes = data.map((code: DiscountCode) => {
        if (code.expiryDate && new Date(code.expiryDate) < now && code.isActive) {
          return { ...code, isActive: false };
        }
        return code;
      });
      setCodes(updatedCodes);
    } catch {
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
    } catch {
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <SafeAreaView style={[styles.container, { flex: 1 }]}>
          <Header title="Manage Discount Codes" />
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchCodes} />
            }
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerContainer}>
              <Ionicons name="pricetags" size={28} color="#6b4226" style={{ marginRight: 8 }} />
            </View>
            {/* <Text style={styles.title}>Manage Discount Codes</Text> */}

            <View style={styles.inputRow}>
              <Ionicons name="key-outline" size={20} color="#6b4226" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Code"
                placeholderTextColor={"#aaa"}
                style={styles.input}
                value={code}
                onChangeText={setCode}
              />
            </View>
            <View style={styles.inputRow}>
              <Ionicons name="pricetag-outline" size={20} color="#6b4226" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Discount %"
                placeholderTextColor={"#aaa"}
                keyboardType="numeric"
                style={styles.input}
                value={discount}
                onChangeText={setDiscount}
              />
            </View>

            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerText}>Please select an expiry date:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setTempDate(expiryDate || new Date());
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {expiryDate ? expiryDate.toLocaleDateString() : "Select Date"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                Platform.OS === "ios" ? (
                  <Modal transparent={true} animationType="fade">
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                      <View style={{ backgroundColor: "white", borderRadius: 10, padding: 20, width: 320 }}>
                        <DateTimePicker
                          value={tempDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              setTempDate(selectedDate);
                            }
                          }}
                          minimumDate={new Date()}
                          locale="en-GB"
                        />
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ padding: 10, backgroundColor: "#ccc", borderRadius: 5 }}>
                            <Text style={{ fontWeight: "600" }}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => {
                            if (tempDate) {
                              setExpiryDate(tempDate);
                            }
                            setShowDatePicker(false);
                          }} style={{ padding: 10, backgroundColor: "#6b4226", borderRadius: 5 }}>
                            <Text style={{ color: "white", fontWeight: "600" }}>OK</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={tempDate || new Date()}
                    mode="date"
                    display="calendar"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (event.type === "set" && selectedDate) {
                        setExpiryDate(selectedDate);
                      }
                      setShowDatePicker(false);
                    }}
                  />
                )
              )}
            </View>

            <TouchableOpacity style={styles.button} onPress={createCode}>
              <Text style={styles.buttonText}>Create Code</Text>
            </TouchableOpacity>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>Total Codes: {codes.length}</Text>
              <Text style={styles.summaryText}>
                Active: {codes.filter((c) => c.isActive).length} | Inactive: {codes.filter((c) => !c.isActive).length}
              </Text>
            </View>

            {codes.map((item) => (
              <View key={item._id}>{renderCode({ item })}</View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
