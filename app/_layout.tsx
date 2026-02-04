import "react-native-gesture-handler"
import "react-native-reanimated"

import * as SplashScreen from "expo-splash-screen"
import { Stack } from "expo-router"
import { useEffect } from "react"
import { Platform } from "react-native"

import { AppProviders } from "@/providers/app-providers"

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: "index",
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  return (
    <AppProviders>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: Platform.select({
            ios: 'default',
            android: 'fade_from_bottom',
            default: 'default',
          }),
          animationDuration: 350,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="guest" />
      </Stack>
    </AppProviders>
  )
}
