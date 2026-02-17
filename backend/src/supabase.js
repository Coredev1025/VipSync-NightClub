import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") })

import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add to backend/.env (see backend/.env.example)"
  )
}

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})
