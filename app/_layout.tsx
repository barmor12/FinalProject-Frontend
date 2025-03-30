
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
import AdminUsersNavigator from "./navigation/AdminUsersNavigator";

// מונע סגירה אוטומטית של מסך הפתיחה
SplashScreen.preventAutoHideAsync();
export type RootStackParamList = {
  AdminOrdersScreen: { shouldRefresh?: boolean };
  OrderDetailsScreen: { orderId: string };
  AdminUsersScreen: undefined; // אין פרמטרים למסך הזה
  UserDetails: { userId: string }; // מקבל פרמטר של userId
};
export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false, // מחיקת כותרת
        }}
      >
        {/* מסכי הרשמה ואימות */}
        <Stack.Screen name="SignUpScreen" />
        <Stack.Screen
          name="EmailVerificationScreen"
          options={{ title: "Verify Email" }}
        />
        <Stack.Screen name="AdminUsers">
          {() => <AdminUsersNavigator />}
        </Stack.Screen>

        <Stack.Screen name="ProductDetailsScreen" />
        <Stack.Screen name="ProductDetailsScreenAdmin" />
        <Stack.Screen name="AddProductScreenAdmin" />
        <Stack.Screen name="manageAddressScreen" />
        <Stack.Screen name="adminDiscountCodesScreen" />

        <Stack.Screen name="adminOrdersScreen" />
        <Stack.Screen name="OrderDetailsScreen" />

        {/* הטאבים נטענים תמיד */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admintabs)" />
        <Stack.Screen name="product/[id]" options={{ title: "Product" }} />

        <Stack.Screen name="SaveDraftOrder" />
        <Stack.Screen name="DuplicateOrder" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
