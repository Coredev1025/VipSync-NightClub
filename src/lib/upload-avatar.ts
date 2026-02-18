import { supabase } from "./supabase"

const AVATARS_BUCKET = "avatars"

/**
 * Upload a profile image to Supabase Storage and return the public URL.
 * Create the "avatars" bucket in Supabase Dashboard → Storage → New bucket
 * (public or with policy: authenticated users can upload).
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string | null> {
  try {
    const response = await fetch(localUri)
    const blob = await response.blob()
    const ext = localUri.split(".").pop()?.toLowerCase() || "jpg"
    const contentType = ext === "png" ? "image/png" : "image/jpeg"
    const path = `${userId}/avatar.${ext}`

    const { data, error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, blob, {
      upsert: true,
      contentType,
    })

    if (error) {
      if (__DEV__) console.warn("[UploadAvatar] Supabase storage error:", error.message)
      return null
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(data.path)
    return publicUrl
  } catch (e) {
    if (__DEV__) console.warn("[UploadAvatar] Upload failed:", e)
    return null
  }
}
