import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useNavigation,
} from "@react-navigation/native";
import { router } from "expo-router";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

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
  const subscription = Notifications.addNotificationResponseReceivedListener(() => {
    console.log('🔗 Redirecting to orders screen');
    router.push("/OrdersScreen");
  });

  return () => subscription.remove();
}, [navigation]);

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
            headerShown: false, // Remove header
          }}
        >
          {/* Registration and verification screens */}
          <Stack.Screen name="SignUpScreen" />
          <Stack.Screen
            name="EmailVerificationScreen"
            options={{ title: "Verify Email" }}
          />

          {/* Use a component here */}
          <Stack.Screen name="adminScreens/manageUsersScreen" />
          <Stack.Screen name="ProductDetailsScreen" />
          <Stack.Screen name="adminScreens/ProductDetailsScreenAdmin" />
          <Stack.Screen name="adminScreens/AddProductScreenAdmin" />
          <Stack.Screen name="AddressScreen" />
          <Stack.Screen name="adminScreens/adminDiscountCodesScreen" />
          <Stack.Screen name="CreditCardScreen" />
          <Stack.Screen name="index"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="adminScreens/adminOrdersScreen" />
          <Stack.Screen name="OrderDetailsScreen" />

          {/* Tabs are always loaded */}
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="(admintabs)"
            options={{ gestureEnabled: false }} // Disable swipe-back gesture for admin dashboard
          />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
