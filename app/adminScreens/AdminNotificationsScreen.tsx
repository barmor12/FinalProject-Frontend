import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import styles from "../styles/AdminScreensStyles/AdminNotificationsScreenStyles";
import Header from "../../components/Header";
// import useNotifications from '../hooks/useNotifications';
// import BackButton from "../../components/BackButton";
import { useRouter } from "expo-router";

export default function AdminNotificationsScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notificationType, setNotificationType] = useState<
    "all" | "promotion" | "newProduct"
  >("all");
  const [recentNotifications, setRecentNotifications] = useState<
    Array<{
      _id: string;
      title: string;
      message: string;
      type: string;
      sentAt: string;
      sentTo: number;
    }>
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [couponCode, setCouponCode] = useState("");
  const [productName, setProductName] = useState("");

  // Get the notification functions
  // const { sendTestNotification } = useNotifications();

  React.useEffect(() => {
    fetchRecentNotifications();
  }, []);

  // עדכון כותרת דיפולט ל-promo כאשר נבחר promotion
  React.useEffect(() => {
    if (notificationType === 'promotion') {
      if (!title || title === 'Promo') {
        setTitle('Promo');
      }
    } else if (title === 'Promo') {
      setTitle('');
    }
    if (notificationType === 'newProduct') {
      if (!title || title === 'New Product') {
        setTitle('New Product');
      }
    } else if (title === 'New Product') {
      setTitle('');
    }
  }, [notificationType]);

  const fetchRecentNotifications = async () => {
    try {
      console.log("🔍 Fetching recent notifications...");
      console.log("📡 Using BASE_URL:", config.BASE_URL);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in");
        return;
      }

      const response = await fetch(`${config.BASE_URL}/notifications/recent`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(`Failed to fetch recent notifications: ${errorText}`);
      }

      const data = await response.json();
      setRecentNotifications(data);
    } catch (error) {
      console.error("Error fetching recent notifications:", error);
      Alert.alert("Error", "Failed to fetch recent notifications");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentNotifications();
    setRefreshing(false);
  };

  // טקסט דוגמה אוטומטי לקופון
  const promoTemplate = `🎉 Use code ${couponCode || 'ABC123'} and get ${discountPercent}% off!`;
  // טקסט דוגמה אוטומטי למוצר חדש
  const newProductTemplate = `🎂 New product launched: ${productName || 'Chocolate Cake'}! Check it out now.`;

  const sendNotification = async () => {
    console.log("🚀 Sending notification...");
    console.log("Title:", title);
    console.log("Message:", message);
    console.log("Type:", notificationType);

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a notification title");
      return;
    }

    let finalMessage = message;
    if (notificationType === "promotion" && (!message.trim() || message.trim() === promoTemplate)) {
      finalMessage = promoTemplate;
    }
    if (notificationType === "newProduct" && (!message.trim() || message.trim() === newProductTemplate)) {
      finalMessage = newProductTemplate;
    }

    if (!finalMessage.trim()) {
      Alert.alert("Error", "Please enter a notification message");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in");
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.BASE_URL}/notifications/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message: finalMessage,
          type: notificationType,
          ...(notificationType === "promotion" ? { discountPercent, couponCode } : {}),
          ...(notificationType === "newProduct" ? { productName } : {}),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(`Failed to send notification: ${errorText}`);
      }

      const result = await response.json();
      Alert.alert(
        "Success",
        `Notification sent to ${result.sentTo || 0} customers`
      );

      // Clear form and refresh list
      setTitle("");
      setMessage("");
      setCouponCode("");
      setDiscountPercent(10);
      setProductName("");
      fetchRecentNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send notification";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderNotificationType = (
    type: "all" | "promotion" | "newProduct",
    label: string,
    icon: string
  ) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        notificationType === type && styles.selectedTypeButton,
      ]}
      onPress={() => setNotificationType(type)}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={notificationType === type ? "#fff" : "#6b4226"}
      />
      <Text
        style={[
          styles.typeButtonText,
          notificationType === type && styles.selectedTypeButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container]}>
      <Header title="Admin Notifications" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerSubtitle}>
              Send notifications to all customers about promotions, new
              products, or important updates.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Notification Type</Text>
            <View style={styles.typeContainer}>
              {renderNotificationType("all", "All Customers", "people-outline")}
              {renderNotificationType(
                "promotion",
                "Promotion",
                "pricetag-outline"
              )}
              {renderNotificationType(
                "newProduct",
                "New Product",
                "gift-outline"
              )}
            </View>

            {/* שדות ייעודיים לקופון */}
            {notificationType === "promotion" && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Discount %</Text>
                <TextInput
                  style={styles.input}
                  value={discountPercent.toString()}
                  onChangeText={v => setDiscountPercent(Number(v.replace(/[^0-9]/g, "")))}
                  placeholder="Enter discount percent"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.label}>Coupon Code</Text>
                <TextInput
                  style={styles.input}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholder="Enter coupon code"
                  maxLength={20}
                  autoCapitalize="characters"
                />
                <Text style={{ color: '#6b4226', fontSize: 13, marginTop: 4, marginBottom: 8 }}>
                  view example: {promoTemplate}
                </Text>
              </View>
            )}
            {notificationType === "newProduct" && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput
                  style={styles.input}
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="Enter product name"
                  maxLength={40}
                />
                <Text style={{ color: '#6b4226', fontSize: 13, marginTop: 4, marginBottom: 8 }}>
                  view example: {newProductTemplate}
                </Text>
              </View>
            )}

            <Text style={styles.label}>Notification Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter notification title"
              placeholderTextColor="#888"
              maxLength={50}
            />
            <Text style={styles.charCounter}>{title.length}/50</Text>

            <Text style={styles.label}>Notification Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter notification message"
              placeholderTextColor="#888"
              multiline
              maxLength={200}
              {...(notificationType === "promotion" && { value: message || promoTemplate })}
              {...(notificationType === "newProduct" && { value: message || newProductTemplate })}
            />
            <Text style={styles.charCounter}>{message.length}/200</Text>

            <TouchableOpacity
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={sendNotification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.sendButtonText}>Send Notification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {recentNotifications.length > 0 ? (
              recentNotifications
                .filter((notification) => notification.type !== 'new_order')
                .map((notification) => (
                  <View key={notification._id} style={styles.notificationCard}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <View style={styles.typeTag}>
                        <Text style={styles.typeTagText}>
                          {notification.type}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <View style={styles.notificationFooter}>
                      <Text style={styles.notificationDate}>
                        {(() => {
                          const d = new Date(notification.sentAt);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()} •
                        {new Date(notification.sentAt).toLocaleTimeString()}
                      </Text>
                      <Text style={styles.notificationSentTo}>
                        Sent to {notification.sentTo} customers
                      </Text>
                    </View>
                  </View>
                ))
            ) : (
              <Text style={styles.emptyText}>No recent notifications</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
