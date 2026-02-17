/**
 * Firebase Cloud Messaging (FCM) — send push notifications.
 * Optional: if FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS not set, send is a no-op and returns { sent: 0 }.
 */

let messaging = null

function initFcm() {
  if (messaging !== null) return
  try {
    const firebaseAdmin = require("firebase-admin")
    const credJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    if (credJson) {
      const cred = JSON.parse(credJson)
      if (!firebaseAdmin.apps.length) {
        firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(cred) })
      }
      messaging = firebaseAdmin.messaging()
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      if (!firebaseAdmin.apps.length) {
        firebaseAdmin.initializeApp()
      }
      messaging = firebaseAdmin.messaging()
    }
  } catch {
    // firebase-admin not installed or init failed
  }
}

export async function sendToTokens(tokens, title, body, data) {
  if (!tokens.length) return { sent: 0, failed: 0 }
  initFcm()
  if (!messaging) {
    console.warn("FCM not configured; skipping push")
    return { sent: 0, failed: tokens.length }
  }
  try {
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data ?? {},
      android: { priority: "high" },
      apns: { payload: { aps: { contentAvailable: true } } },
    })
    const successCount = result.successCount ?? 0
    const failureCount = "failureCount" in result ? result.failureCount : tokens.length - successCount
    return { sent: successCount, failed: failureCount }
  } catch (e) {
    console.error("FCM send error:", e)
    return { sent: 0, failed: tokens.length }
  }
}

export function isFcmConfigured() {
  initFcm()
  return !!messaging
}
