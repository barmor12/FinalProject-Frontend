// app/utils/notifications.ts
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

/**
 * מגדיר את ה־notification handler (קובע כיצד תוצג כל הודעה).
 */
export function registerNotifications() {
  // כבר קבענו את ה־handler בהגדרה העליונה
}

// קבע את ה־handler להצגת ההודעה
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
 * מבקש הרשאות דחיפת הודעות ושולח לטוקן לשרת
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
  if (!jwt) return;

  await fetch(`${config.BASE_URL}/notifications/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ token: pushToken }),
  });
}

/**
 * מתזמן הודעה בדחייה של 5 שניות (לדוגמה)
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
 * מאזין לקבלה ותגובה על הודעות
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
