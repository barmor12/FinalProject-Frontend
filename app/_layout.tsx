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

// מונע סגירה אוטומטית של מסך הפתיחה
SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  AdminOrdersScreen: { shouldRefresh?: boolean };
  OrderDetailsScreen: { orderId: string };
  AdminUsersScreen: undefined; // אין פרמטרים למסך הזה
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
            headerShown: false, // מחיקת כותרת
          }}
        >
          {/* מסכי הרשמה ואימות */}
          <Stack.Screen name="SignUpScreen" />
          <Stack.Screen
            name="EmailVerificationScreen"
            options={{ title: "Verify Email" }}
          />

          {/* כאן יש להשתמש ב-component */}
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

          {/* הטאבים נטענים תמיד */}
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="(admintabs)"
            options={{ gestureEnabled: false }} // Disable swipe back for admin dashboard
          />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
