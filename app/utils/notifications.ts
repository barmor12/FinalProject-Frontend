// app/utils/notifications.ts
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

/**
 * Sets the notification handler (defines how each notification will be displayed).
 */
export function registerNotifications() {
  // The handler was already set in the upper definition
}

// Set the handler for displaying the notification
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests push notification permissions and sends the token to the server
 */
export async function registerPushToken() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("⚠️ Push permissions not granted");
    return;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenData.data;
  console.log("📲 Expo Push Token:", pushToken);

  const jwt = await AsyncStorage.getItem("accessToken");
  console.log("🪪 JWT Token:", jwt);
  if (!jwt) return;

  // Get userId from storage
  const userId = await AsyncStorage.getItem("userId");
  console.log("📤 Sending token to backend:", pushToken, "for userId:", userId);

  try {
    const res = await fetch(`${config.BASE_URL}/notifications/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        token: pushToken,
        userId,
      }),
    });
    const data = await res.json();
    console.log("✅ Token registration response:", data);
  } catch (error) {
    console.error("❌ Failed to register token:", error);
  }
}

/**
 * Schedules a test notification with a 5-second delay (example)
 */
export async function scheduleTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "test",
      body: "Hellooooo",
      data: { test: true },
    },
    trigger: new Date(
      Date.now() + 5000
    ) as unknown as Notifications.NotificationTriggerInput,
  });
}

/**
 * Listens for notification reception and responses
 */
export function setupNotificationListeners() {
  const sub1 = Notifications.addNotificationReceivedListener((notification) => {
    console.log("Notification received:", notification);
  });
  const sub2 = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("Notification response:", response);
    }
  );
  return () => {
    sub1.remove();
    sub2.remove();
  };
}
export default {
  registerNotifications,
  registerPushToken,
  scheduleTestNotification,
  setupNotificationListeners,
};
