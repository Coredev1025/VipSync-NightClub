

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import admin from "firebase-admin"

let messaging = null

function initFcm() {
  if (messaging) return messaging

  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (jsonStr) {
    try {
      const cred = JSON.parse(jsonStr)
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(cred) })
      }
      messaging = admin.messaging()
      return messaging
    } catch (e) {
      console.warn("[FCM] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", e?.message)
      return null
    }
  }

  if (credPath) {
    try {
      const fullPath = resolve(process.cwd(), credPath)
      const cred = JSON.parse(readFileSync(fullPath, "utf8"))
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(cred) })
      }
      messaging = admin.messaging()
      return messaging
    } catch (e) {
      console.warn("[FCM] Failed to init from GOOGLE_APPLICATION_CREDENTIALS:", e?.message)
      return null
    }
  }

  return null
}

/**

 * @param {string[]} tokens 
 * @param {{ title: string, body?: string, data?: Record<string, string> }} payload
 * @returns {{ successCount: number, failureCount: number, failedTokens?: string[] }}
 */
export async function sendToTokens(tokens, payload) {
  const fcm = initFcm()
  if (!fcm || !tokens?.length) {
    return { successCount: 0, failureCount: tokens?.length ?? 0 }
  }

  const { title, body, data = {} } = payload
  const message = {
    notification: { title, body: body ?? "" },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [String(k), String(v)])
    ),
    android: {
      priority: "high",
      notification: { channelId: "default", priority: "high" },
    },
  }

  const results = await Promise.allSettled(
    tokens.map((token) =>
      fcm.send({ ...message, token: String(token).trim() })
    )
  )

  let successCount = 0
  const failedTokens = []
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "fulfilled") {
      successCount += 1
    } else {
      failedTokens.push(tokens[i])
      if (process.env.NODE_ENV !== "production") {
        console.warn("[FCM] Send failed for token:", tokens[i]?.slice?.(0, 20) + "...", results[i].reason?.message)
      }
    }
  }

  return {
    successCount,
    failureCount: tokens.length - successCount,
    failedTokens: failedTokens.length ? failedTokens : undefined,
  }
}

export function isFcmConfigured() {
  return initFcm() != null
}
