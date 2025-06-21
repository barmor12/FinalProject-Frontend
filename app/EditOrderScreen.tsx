import React, { useEffect, useState } from "react";
// Helper function to safely parse ISO date strings
const parseISODate = (str: string) => {
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date(Date.now() + 86400000) : parsed;
};
import {
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  RefreshControl,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import Header from "../components/Header";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function EditOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [shippingMethod, setShippingMethod] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>(""); // נטען בהמשך עם useEffect
  const [addressId, setAddressId] = useState<string>("");
  const [addressLabel, setAddressLabel] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState<Date>(new Date());

  const [tempDeliveryDate, setTempDeliveryDate] = useState<Date>(new Date(Date.now() + 86400000));

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    // ריענון נתונים בעת הצורך
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      // 1) get order
      const response = await fetch(`${config.BASE_URL}/order/${orderId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", "Failed to fetch order details");
        return;
      }
      setShippingMethod(data.shippingMethod || "");
      setDeliveryDate(
        data.deliveryDate?.slice(0, 10) ||
        new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      );
      if (data.deliveryDate) {
        const parsed = new Date(data.deliveryDate);
        if (!isNaN(parsed.getTime())) {
          setDateObj(parsed);
          setTempDeliveryDate(parsed);
        }
      } else {
        setTempDeliveryDate(new Date(Date.now() + 86400000));
      }
      if (data.address) {
        setAddressId(data.address._id || "");
        setAddressLabel(
          `${data.address.fullName}, ${data.address.street}, ${data.address.city}`
        );
      }
      // 2) get addresses list
      try {
        const addrRes = await fetch(`${config.BASE_URL}/address`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const addrData = await addrRes.json();
        setAddresses(addrData);
      } catch {
        // ignore
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handleSave = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    const res = await fetch(
      `${config.BASE_URL}/order/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shippingMethod, deliveryDate, address: addressId }),
      }
    );
    if (!res.ok) {
      Alert.alert("Error", "Failed to update order");
      return;
    }
    Alert.alert("Success", "Order updated successfully");
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView>
        <ActivityIndicator size="large" testID="loading-indicator" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f3ea" }}>
      <Header title="Edit Order" showBack />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* הסר את ה־Text הגדול של הכותרת */}

        {/* Shipping Method */}
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#6b4226" }}>
          Shipping Method
        </Text>
        <TouchableOpacity
          onPress={() => setShippingMethod("Standard Delivery (2-3 days)")}
          style={{
            backgroundColor:
              shippingMethod === "Standard Delivery (2-3 days)" ? "#D2B48C" : "#fff",
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 15,
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#6b4226", fontSize: 16 }}>
            Standard Delivery (2-3 days)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShippingMethod("Self Pickup")}
          style={{
            backgroundColor: shippingMethod === "Self Pickup" ? "#D2B48C" : "#fff",
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#6b4226", fontSize: 16 }}>Self Pickup</Text>
        </TouchableOpacity>

        {/* Date Picker */}
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#6b4226" }}>
          {shippingMethod === "Self Pickup" ? "Pickup Date" : "Delivery Date"}
        </Text>
        <TouchableOpacity
          onPress={() => {
            const defaultDate = new Date(deliveryDate);
            const validDate = isNaN(defaultDate.getTime()) ? new Date(Date.now() + 86400000) : defaultDate;
            setTempDeliveryDate(validDate);
            setDeliveryDate(validDate.toISOString().slice(0, 10));
            setDateObj(validDate);
            setShowDatePicker(true);
          }}
          style={{
            borderWidth: 1,
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ color: "#6b4226", fontSize: 16 }}>
            {deliveryDate || "Select date"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <Modal transparent={true} animationType="fade">
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
              <View style={{ backgroundColor: "white", borderRadius: 10, padding: 20, width: 320 }}>
                <DateTimePicker
                  value={tempDeliveryDate || new Date()}
                  mode="date"
                  display={Platform.OS === "android" ? "calendar" : "spinner"}
                  themeVariant="light"
                  onChange={(event, selectedDate) => {
                    const dateToSet = selectedDate || tempDeliveryDate || new Date(Date.now() + 86400000);
                    setTempDeliveryDate(dateToSet);
                  }}
                  minimumDate={new Date(Date.now() + 86400000)}
                  maximumDate={new Date(new Date().getFullYear(), 11, 31)}
                  locale="en-GB"
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#ccc", borderRadius: 5 }}
                  >
                    <Text style={{ fontWeight: "600" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const finalDate = tempDeliveryDate || new Date(Date.now() + 86400000);
                      const y = finalDate.getFullYear();
                      const m = String(finalDate.getMonth() + 1).padStart(2, "0");
                      const d = String(finalDate.getDate()).padStart(2, "0");
                      setDeliveryDate(`${y}-${m}-${d}`);
                      setDateObj(finalDate);
                      setShowDatePicker(false);
                    }}
                    style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#6b4226", borderRadius: 5 }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Address Selection */}
        {shippingMethod !== "Self Pickup" && (
          <>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#6b4226" }}>
              Select Address
            </Text>
            <TouchableOpacity
              onPress={() => setAddressModalVisible(true)}
              style={{
                borderWidth: 1,
                padding: 15,
                borderRadius: 10,
                marginBottom: 20,
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ color: "#6b4226", fontSize: 16 }}>
                {addressLabel || "Choose address"}
              </Text>
            </TouchableOpacity>
            <Modal
              transparent
              visible={addressModalVisible}
              animationType="fade"
              onRequestClose={() => setAddressModalVisible(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPressOut={() => setAddressModalVisible(false)}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.4)",
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  style={{
                    width: "90%",
                    maxHeight: "70%",
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    padding: 24,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    elevation: 12,
                  }}
                >
                  <View
                    style={{
                      paddingVertical: 16,
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: "#6b4226",
                        textAlign: "center",
                        textShadowColor: 'rgba(0, 0, 0, 0.15)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                        backgroundColor: "#fff",
                        paddingVertical: 4,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        alignSelf: "center",
                      }}
                    >
                      Select Address
                    </Text>
                  </View>
                  <View style={{ height: 12 }} />
                  <ScrollView>
                    {addresses.map((a, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          setAddressId(a._id);
                          setAddressLabel(`${a.fullName}, ${a.street}, ${a.city}`);
                          setAddressModalVisible(false);
                        }}
                        style={{
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                          backgroundColor: "#fdf7f2",
                          borderRadius: 12,
                          marginBottom: 12,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <Text style={{ fontSize: 16, color: "#6b4226" }}>
                          {`${a.fullName}, ${a.street}, ${a.city}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={() => setAddressModalVisible(false)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: "#f0e6dd",
                      borderRadius: 20,
                      width: 36,
                      height: 36,
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.15,
                      shadowRadius: 2,
                      elevation: 3,
                    }}
                  >
                    <Text style={{ fontSize: 18, color: "#333" }}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          </>
        )}

        {/* Save */}
        <TouchableOpacity
          testID="save-button"
          onPress={handleSave}
          style={{
            backgroundColor: "#6b4226",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}