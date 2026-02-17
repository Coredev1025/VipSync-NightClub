import { api, isApiConnected } from "./api"

export interface ProfileData {
  id: string
  email?: string
  name?: string
  phone?: string
  picture?: string
  mode?: string
  pro_role?: string
  settings_account?: Record<string, unknown>
  settings_notifications?: Record<string, unknown>
  settings_privacy?: Record<string, unknown>
  settings_club?: Record<string, unknown>
}

export async function getProfile(): Promise<ProfileData | null> {
  if (!isApiConnected()) return null
  try {
    const data = await api.get<ProfileData>("/api/profile")
    return data ?? null
  } catch {
    return null
  }
}

export async function patchProfile(updates: Partial<ProfileData>): Promise<void> {
  if (!isApiConnected()) return
  try {
    await api.patch("/api/profile", updates)
  } catch {
    // ignore
  }
}
