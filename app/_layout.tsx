import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useNavigation,
} from "@react-navigation/native";
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NotificationHistoryModal from '../components/NotificationHistoryModal';

// Removed SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  AdminOrdersScreen: { shouldRefresh?: boolean };
  OrderDetailsScreen: { orderId: string };
  AdminUsersScreen: undefined; // No parameters for this screen
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [initialRoute, setInitialRoute] = useState<string | undefined>(undefined);
  const navigation = useNavigation();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

useEffect(() => {
  const checkLoginStatus = async () => {
    try {
      const fromBack = await AsyncStorage.getItem("fromBack");
      const token = await AsyncStorage.getItem("accessToken");
      // Immediately after getItem("accessToken"), check for token presence
      if (!token) {
        console.warn("⚠️ No access token found, skipping cart fetch.");
        // You can skip cart fetch or other logic here
        // Optionally, could return here if needed
        // For this example, just continue
      }
      const role = await AsyncStorage.getItem("role");
      const isPasswordSet = await AsyncStorage.getItem("isPasswordSet");

      if (token && role) {
        if (fromBack === "true") {
          if (isPasswordSet !== "true") {
            setInitialRoute("SetPasswordScreen");
          } else {
            setInitialRoute("index");
          }
          await AsyncStorage.removeItem("fromBack");
        } else {
          setInitialRoute("index");
        }
      } else {
        setInitialRoute("SignUpScreen");
      }

      // Example: Network call (like fetching cart) should not crash navigation
      if (token) {
        try {
          // Example: await fetchCart(token);
          // await fetchCart(token);
        } catch (err) {
          console.warn("Warning: Failed to fetch cart:", err);
        }
      }

      await SplashScreen.hideAsync();
    } catch (err) {
      console.error("Error checking login status:", err);
    }
  };
  checkLoginStatus();
}, []);

useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data as {
      type?: string;
      orderId?: string;
      navigateTo?: string;
    };

    const role = await AsyncStorage.getItem("role");
    console.log('🧭 Navigating with data:', data, '| Role:', role);

    if (role === "admin" && data.type === "new_order") {
      router.push("/adminScreens/adminOrdersScreen");
    } else if (role === "user" && data.type === "order_status_change") {
      router.push("/OrdersScreen");
    } else {
      // fallback - navigate to home screen
      router.push("/");
    }
  });

  return () => subscription.remove();
}, []);

  if (!initialRoute) {
    // You can add a loading spinner here if needed
    return null; // or a loading indicator while checking login status
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Registration and verification screens */}
          <Stack.Screen name="SignUpScreen" options={{ headerShown: false }} />
          <Stack.Screen
            name="EmailVerificationScreen"
            options={{ title: "Verify Email", headerShown: false }}
          />

          {/* Use a component here */}
          <Stack.Screen name="adminScreens/manageUsersScreen" options={{ headerShown: false }} />
          <Stack.Screen name="ProductDetailsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="adminScreens/ProductDetailsScreenAdmin" options={{ headerShown: false }} />
          <Stack.Screen name="adminScreens/AddProductScreenAdmin" options={{ headerShown: false }} />
          <Stack.Screen name="AddressScreen" options={{ headerShown: false }} />
          <Stack.Screen name="adminScreens/adminDiscountCodesScreen" options={{ headerShown: false }} />
          <Stack.Screen name="CreditCardScreen" options={{ headerShown: false }} />
          <Stack.Screen name="index"
            options={{ gestureEnabled: false, headerShown: false }}
          />
          <Stack.Screen name="adminScreens/adminOrdersScreen" options={{ headerShown: false }} />
          <Stack.Screen name="OrderDetailsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="CheckoutScreen" options={{ headerShown: false }} />

          {/* Removed the (tabs) screen to prevent rendering the tab bar again */}

          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }} // Disable header for tabs screen
          />
        </Stack>

        {/* Floating notification button and notification modal removed */}

        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
