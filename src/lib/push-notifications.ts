/**
 * Push notification registration and handlers.
 * Registers FCM device token with backend on sign-in.
 * Requires expo-notifications, expo-device.
 */

import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { api, getAccessToken } from "./api"

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/** Platform string for backend: 'android' | 'ios' */
function getPlatform(): "android" | "ios" {
  return Platform.OS === "android" ? "android" : "ios"
}

/**
 * Request notification permissions and return whether granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    if (__DEV__) console.warn("[Push] Must use a physical device for push notifications")
    return false
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === "granted") return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === "granted"
}

/**
 * Get the native device push token (FCM on Android, APNs on iOS).
 * Returns null if not a device, permissions denied, or token fetch fails.
 */
export async function getDevicePushToken(): Promise<string | null> {
  if (!Device.isDevice) return null

  const granted = await requestNotificationPermissions()
  if (!granted) return null

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync()
    const token = tokenData?.data
    return typeof token === "string" && token.length > 0 ? token : null
  } catch (e) {
    if (__DEV__) console.warn("[Push] Failed to get device push token:", e)
    return null
  }
}

/**
 * Register the device push token with the backend.
 * Call after user is signed in and we have an access token.
 */
export async function registerPushToken(): Promise<void> {
  if (!getAccessToken()) return

  const pushToken = await getDevicePushToken()
  if (!pushToken) return

  try {
    await api.post("/api/push/register", {
      token: pushToken,
      platform: getPlatform(),
    })
    if (__DEV__) console.log("[Push] Token registered with backend")
  } catch (e) {
    if (__DEV__) console.warn("[Push] Failed to register token:", e)
  }
}

/**
 * Set up notification listeners.
 * Returns unsubscribe function.
 */
export function setupNotificationListeners(
  onReceived?: (notification: Notifications.Notification) => void,
  onTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  const subReceived = Notifications.addNotificationReceivedListener((notification) => {
    if (__DEV__) console.log("[Push] Received:", notification)
    onReceived?.(notification)
  })

  const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
    if (__DEV__) console.log("[Push] Tapped:", response)
    onTapped?.(response)
  })

  return () => {
    subReceived.remove()
    subResponse.remove()
  }
}
