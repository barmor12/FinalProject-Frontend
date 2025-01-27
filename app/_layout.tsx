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

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Hide the splash screen once the app is ready
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false, // Disable the global header for all screens
        }}
      >
        {/* Registration Screen */}
        <Stack.Screen
          name="SignUpScreen"
          options={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />

        {/* Email Verification Screen */}
        <Stack.Screen
          name="EmailVerificationScreen"
          options={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="ProductDetailsScreen"
          options={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />

        {/* Tabs Navigation (Dashboard) */}
        <Stack.Screen
          name="(tabs)" // Tabs layout for navigating between Dashboard, Orders, Inventory, and Profile
          options={{
            headerShown: false, // Disable the header for the tabs layout
          }}
        />

        {/* Save Draft Order Screen */}
        <Stack.Screen
          name="SaveDraftOrder"
          options={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />

        {/* Duplicate Order Screen */}
        <Stack.Screen
          name="DuplicateOrder"
          options={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
      </Stack>
      {/* Set the status bar style to match the system */}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
