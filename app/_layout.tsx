import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Prevents the splash screen from closing automatically
SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  AdminOrdersScreen: { shouldRefresh?: boolean };
  OrderDetailsScreen: { orderId: string };
  AdminUsersScreen: undefined; // No parameters for this screen
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
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
