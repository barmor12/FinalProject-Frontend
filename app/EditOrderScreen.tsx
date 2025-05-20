import React, { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";

export default function EditOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [shippingMethod, setShippingMethod] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [addressId, setAddressId] = useState<string>("");
  const [addressLabel, setAddressLabel] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  // New states for address selection
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await fetch(`${config.BASE_URL}/order/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", "Failed to fetch order details");
        return;
      }
      setShippingMethod(data.shippingMethod || "");
      setDeliveryDate(data.deliveryDate?.slice(0, 10) || "");
      if (data.address) {
        setAddressId(data.address._id || "");
        setAddressLabel(
          `${data.address.fullName}, ${data.address.street}, ${data.address.city}`
        );
      } else {
        setAddressId("");
        setAddressLabel("");
      }
      // Fetch addresses for selection
      try {
        const addressRes = await fetch(`${config.BASE_URL}/address`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const addressData = await addressRes.json();
        setAddresses(addressData); // Keep full address objects
      } catch (err) {
        // ignore address fetch error here
      }
      setLoading(false);
    };
    fetchOrder();
  }, []);

  const handleSave = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    const response = await fetch(`${config.BASE_URL}/order/${orderId}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shippingMethod,
        deliveryDate,
        address: addressId,
      }),
    });
    if (!response.ok) {
      Alert.alert("Error", "Failed to update order");
      return;
    }
    Alert.alert("Success", "Order updated successfully");
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f3ea" }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#6b4226",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Edit Order
        </Text>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 8,
            color: "#6b4226",
          }}
        >
          Shipping Method
        </Text>
        <TouchableOpacity
          onPress={() => setShippingMethod("Standard Delivery (2-3 days)")}
          style={{
            backgroundColor:
              shippingMethod === "Standard Delivery (2-3 days)"
                ? "#D2B48C"
                : "#fff",
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
            backgroundColor:
              shippingMethod === "Self Pickup" ? "#D2B48C" : "#fff",
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#6b4226", fontSize: 16 }}>Self Pickup</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 8,
            color: "#6b4226",
          }}
        >
          {shippingMethod === "Self Pickup" ? "Pickup Date" : "Delivery Date"}
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={{
            borderWidth: 1,
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ color: "#6b4226", fontSize: 16 }}>
            {deliveryDate ? deliveryDate : "Select date"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateObj || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === "ios");
              if (selectedDate) {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(
                  2,
                  "0"
                );
                const day = String(selectedDate.getDate()).padStart(2, "0");
                setDeliveryDate(`${year}-${month}-${day}`);
                setDateObj(selectedDate);
              }
            }}
          />
        )}

        {shippingMethod !== "Self Pickup" && (
          <>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 8,
                color: "#6b4226",
              }}
            >
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
            <Modal visible={addressModalVisible} animationType="slide">
              <SafeAreaView
                style={{ flex: 1, padding: 20, backgroundColor: "#f9f3ea" }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    marginBottom: 20,
                    color: "#6b4226",
                  }}
                >
                  Select Address
                </Text>
                {addresses.map((a: any, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setAddressId(a._id);
                      setAddressLabel(`${a.fullName}, ${a.street}, ${a.city}`);
                      setAddressModalVisible(false);
                    }}
                    style={{
                      padding: 15,
                      borderBottomWidth: 1,
                      borderColor: "#ccc",
                    }}
                  >
                    <Text style={{ fontSize: 16, color: "#6b4226" }}>
                      {`${a.fullName}, ${a.street}, ${a.city}`}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setAddressModalVisible(false)}
                  style={{
                    marginTop: 30,
                    backgroundColor: "#d9534f",
                    padding: 15,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </SafeAreaView>
            </Modal>
          </>
        )}

        <TouchableOpacity
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
      </View>
    </SafeAreaView>
  );
}
