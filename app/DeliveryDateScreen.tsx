import React, { useState } from "react";
import { View, Text, Button, Alert, ActivityIndicator } from "react-native";
import DatePicker from "react-native-date-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import styles from "./styles/DeliveryDateStyles"; // Importing styles

export default function DeliveryDateScreen() {
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Check if selected date is available for delivery
  const checkDateAvailability = async () => {
    console.log("📅 Checking availability for:", date.toISOString());
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await axios.post(
        `${config.BASE_URL}/order/check-date`,
        { date },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.available) {
        Alert.alert(
          "✅ Success",
          "The selected date is available for delivery."
        );
      } else {
        Alert.alert("❌ Unavailable", "The selected date is not available.");
      }
    } catch (error) {
      console.error("⚠️ Failed to check date availability:", error);
      Alert.alert("Error", "Failed to check date availability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Delivery Date</Text>
      <DatePicker date={date} onDateChange={setDate} />
      {loading ? (
        <ActivityIndicator testID="loading-indicator" size="large" color="#6b4226" />
      ) : (
        <Button title="Check Availability" onPress={checkDateAvailability} />
      )}
    </View>
  );
}
