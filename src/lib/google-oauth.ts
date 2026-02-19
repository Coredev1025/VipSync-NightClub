import * as WebBrowser from "expo-web-browser"
import { makeRedirectUri } from "expo-auth-session"
import * as Linking from "expo-linking"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { getApiBaseUrl, setAccessToken } from "@/lib/api"
import {
  getAuthCodeFromUrl,
  getAuthErrorFromUrl,
  getOAuthTokensFromUrl,
} from "@/lib/oauth-url"
import { supabase } from "@/lib/supabase"

export type CompleteOAuthResult =
  | { success: true }
  | { success: false; error: string }

  export function getOAuthRedirectUri(): string {
    return makeRedirectUri({ path: "auth/callback" }) || Linking.createURL("auth/callback")
  }

export async function completeOAuthFromUrl(
  url: string
): Promise<CompleteOAuthResult> {
  console.log('🔗 Processing OAuth callback URL:', url);
  
  const authError = getAuthErrorFromUrl(url);
  if (authError) {
    return {
      success: false,
      error: authError.description || authError.error || "Sign-in failed. Please try again.",
    };
  }

  const code = getAuthCodeFromUrl(url);
  const tokens = getOAuthTokensFromUrl(url);
  
  console.log('🔍 Parsed code:', code ? `${code.substring(0, 20)}...` : 'none');
  console.log('🔍 Parsed tokens:', tokens ? {
    access: tokens.access_token ? 'present' : 'missing',
    refresh: tokens.refresh_token ? 'present' : 'missing'
  } : 'none');

  if (code) {
    const keys = await AsyncStorage.getAllKeys();
    const hasVerifier = keys.some(k => k.includes('code-verifier'));
    console.log('🔐 PKCE verifier in storage:', hasVerifier);

    if (!hasVerifier) {
      return {
        success: false,
        error: "PKCE verifier not found. Storage may not be configured correctly. Try again."
      };
    }
  }

  try {
    if (code) {
      console.log('🔄 Exchanging code for session...');
      const start = Date.now();
      
      const exchangePromise = supabase.auth.exchangeCodeForSession(code);
      const timeoutMs = 30000; // 30s for slow networks / Supabase latency
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Code exchange timed out")), timeoutMs)
      );
      
      const { data, error } = await Promise.race([
        exchangePromise,
        timeoutPromise
      ]) as { data: any; error: any };
      
      console.log('🔄 Exchange took:', Date.now() - start, 'ms');
      
      if (error) {
        console.error('❌ Exchange error:', error);
        if (error.message?.includes('PKCE') || error.message?.includes('verifier')) {
          return {
            success: false,
            error: "Sign-in session expired. Please try again from the app."
          };
        }
        return {
          success: false,
          error: error.message || "Sign-in failed. Please try again.",
        };
      }
      
      if (data?.session) {
        console.log('✅ Session obtained via code exchange');
        const syncErr = await syncBackendSession(data.session);
        if (syncErr) return { success: false, error: syncErr };
        return { success: true };
      }
    }

    if (tokens?.access_token && tokens?.refresh_token) {
      console.log('🔄 Setting session with tokens from URL...');
      const setRes = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      
      if (setRes.error) {
        return {
          success: false,
          error: setRes.error.message || "Sign-in failed. Please try again.",
        };
      }
      
      if (setRes.data?.session) {
        console.log('✅ Session obtained via token set');
        const syncErr = await syncBackendSession(setRes.data.session);
        if (syncErr) return { success: false, error: syncErr };
        return { success: true };
      }
    }

    // 6. If neither worked
    return {
      success: false,
      error: "Could not complete sign-in. Invalid redirect or missing credentials.",
    };
    
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("💥 completeOAuthFromUrl error:", err);

    if (err.message.includes("Code exchange timed out")) {
      return {
        success: false,
        error: "Sign-in took too long. Check your connection and try again.",
      };
    }
    if (err.message.includes("PKCE") || err.message.includes("verifier")) {
      return {
        success: false,
        error: "Sign-in session expired. Please try again from the app.",
      };
    }

    return {
      success: false,
      error: err.message || "Sign-in failed. Try again.",
    };
  }
}

export async function syncBackendSession(session: {
  access_token: string
}): Promise<string | null> {
  const base = getApiBaseUrl()
  if (!base) return null
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(`${base}/api/auth/supabase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: session.access_token }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId) 
    const data = await res.json().catch(() => null)
    if (res.ok && data?.accessToken) {
      setAccessToken(data.accessToken)
      return null
    }
    if (res.status === 401 || res.status === 503) {
      return (
        data?.error ??
        "Backend sign-in failed. Check SUPABASE_JWT_SECRET in backend .env."
      )
    }
    return (data?.error ?? data?.hint) || `Backend error ${res.status}`
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError"
    return isAbort
      ? "Backend did not respond in time. Check EXPO_PUBLIC_API_URL and that the server is running."
      : "Could not reach backend. Check EXPO_PUBLIC_API_URL and that the server is running."
  }
}

export type SignInWithGoogleResult =
  | { success: true }
  | { success: false; error: string }

  export async function signInWithGoogle(): Promise<SignInWithGoogleResult> {
    WebBrowser.maybeCompleteAuthSession()
    const redirectTo = getOAuthRedirectUri()
  
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // Show Google account picker so user can choose existing Gmail or add another
        queryParams: {
          prompt: "select_account",
        },
      },
    })
  
    if (oauthError) {
      return {
        success: false,
        error: oauthError.message || "Google sign-in failed. Try again.",
      }
    }
  
    if (!data?.url) {
      return {
        success: false,
        error: "Could not start Google sign-in.",
      }
    }

    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  
      if (result.type === "success" && result.url) {
        const complete = await completeOAuthFromUrl(result.url)
        if (complete.success) return { success: true }
        return { success: false, error: complete.error }
      }
  
      if (result.type === "cancel" || result.type === "dismiss") {
        return { success: false, error: "Sign-in was cancelled." }
      }
  
      return { success: false, error: "Sign-in did not complete. Try again." }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { success: false, error: msg || "Google sign-in failed." }
    }
  }
