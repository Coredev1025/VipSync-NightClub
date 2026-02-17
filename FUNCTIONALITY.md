# VIPsyncApp Mobile — Full Functionality List

VIPsyncApp is an Expo/React Native nightclub operations and guest experience app with two main modes: **Pro** (staff) and **User** (guest). Role-based permissions control what staff can see and edit.

---

## 1. App lifecycle & entry

- **Splash screen** — Animated loading with progress bar and staged messages (Initializing → Connecting servers → Loading venue data → Syncing tables → Ready to launch). Triggers `onComplete` when done.
- **Auth persistence** — Login state stored in AsyncStorage (`vipsync_auth`, `vipsync_auth_mode`, `vipsync_auth_pro_role`). App restores to app or auth based on stored values.
- **Root routing** — Expo Router Stack: `index` (main app with splash/auth/app) and `guest` route. Header hidden; platform-specific transitions (iOS default, Android fade from bottom).
- **App providers** — `GestureHandlerRootView` → `ThemeProvider` → `SafeAreaProvider` → `BottlesProvider` → `LiveFeedProvider` → `ToastProvider`. Custom fonts (Inter, Orbitron) loaded via `expo-font`; splash hidden when fonts ready.

---

## 2. Authentication & onboarding

- **Auth flow steps** — Welcome → Mode selection (Pro vs User) → Role selection (Pro only) → Profile (name, optional avatar).
- **Social sign-in** — Welcome screen offers **Continue with Google** and **Continue with Facebook** via OAuth 2.0 (`expo-auth-session`, `expo-web-browser`, `expo-crypto`). Redirect URI uses app scheme `vipsyncappmobile`. Add `extra.googleClientId` (Google Cloud OAuth 2.0 client ID) and `extra.facebookAppId` (Facebook App ID) in `app.json` or `app.config.js` to enable sign-in; otherwise the buttons show a configuration alert.
- **Mode selection** — **Pro**: venue staff (promoter, door, manager, owner). **User**: guest experience.
- **Pro role selection** — Promoter, Door Staff, Manager, Owner; each with title/description and glow styling. Role persisted and used for permissions.
- **Profile step** — Display name, optional profile photo (camera or gallery via `expo-image-picker`). Avatar shown in halo with theme glow.
- **Completion** — `onComplete(mode, proRole?)`; auth keys written to AsyncStorage; app switches to `AppShell` (Pro) or `GuestShell` (User).

---

## 3. Pro (staff) mode — App shell

- **Tab bar** — Role-based tabs from `getTabsForRole(role)`: Owner/Manager get Home, Chats, Map, Ops, Profile; Door/Promoter get Home, Chats, Map, Profile (no Ops).
- **Header** — Logo, search placeholder, notification bell with optional badge/pulsing dot, profile avatar. Notifications overlay: list of sample items (VIP Arriving, Table Request, Capacity Alert) and close.
- **Ambient UI** — Animated background blobs (Reanimated); neon-themed layout.
- **Logout** — Clears auth keys and returns to auth screen.

---

## 4. Pro — Home tab (Staff / Vibe)

- **Current vibe** — DJ name, status (ON DECKS / OFF DECKS / SCHEDULED / BREAK), genres, initials. “Open now” derived from time (e.g. 21:00–03:00).
- **Edit vibe** — Modal to edit DJ name, status, genres; save persists to `useLocalStorageState` (`vipsync_staff_vibe_v1`).
- **Vibe events list** — Up to 5 events shown (live first, then upcoming); sort by status then id. Each: DJ name, date, time, genres, status badge.
- **Add event** — Manager/Owner only (`canManageVibeEvents`). Form: DJ name, date, time, genres, status. New events get id `event-{timestamp}`.
- **View all events** — Sheet to see full list; same add/edit/delete rules.
- **Edit/delete event** — Manager/Owner only; delete with confirmation.
- **Bottles & menu** — Entry to Bottles tab (modal or inline depending on shell). Manager/Owner can manage; Door/Promoter view only.

---

## 5. Pro — Chats tab

- **Chat list** — List of chats with avatar, name, last message, time, seen state, unread count. “Main Ops” chat included for staff.
- **Chat details** — Message list with sender name/role, time, read state. Text input and send; optional emoji picker and camera.
- **New chat** — Add chat flow: choose existing contact or new contact.
- **New contact** — Form (name, phone, avatar, status); creates contact and opens new chat.
- **New group** — Select multiple contacts; group chat created with combined name.
- **Calling** — Placeholder/screen for voice/video call (e.g. `GSCalling`).
- **Camera** — In-chat camera capture (e.g. `GSCamera`).
- **Order sync** — Optional `onOrderSynced(tableNumber, guest, items)` callback for table orders from chat.

---

## 6. Pro — Map tab

- **View modes** — Map view (canvas floor plan with tables) and list view (table cards). Toggle via segment; list filter: All / Open / Occupied / Booked / Pending.
- **Floor plan** — Skia canvas: dance floor, bar, tables. Tables draggable (when `canEditMapTables(role)`); door staff view-only.
- **Table card (map/list)** — Number, status, capacity, guests, spend/pending spend, items summary, primary/backup staff, promoter, server, ETA, VIP flag, DJ booth flag and set time. Avatars for guest, promoter, bottle girl.
- **Table detail sheet** — Full table info; edit fields (guest name, spend, promoter, bottle girl, server, ETA, status, etc.). Manager/Owner can edit table girl; promoter cannot edit promoter/table girl (`canEditTableGirl`).
- **Staff assignment** — Pick promoter and bottle girl from lists; show online state and tables assigned.
- **Add table** — Add new table to floor (position, number, capacity, status, etc.).
- **DJ booth** — Special table type: “DJ” label, set time (e.g. 10pm–2am).
- **Bar / LTO** — Bar area with menu items; limited-time offers with date range (start/end); date picker for LTO.
- **Live feed** — Add feed items from map (e.g. order, arrival, alert, geo) via `useLiveFeed().addFeedItem`.
- **PDF import** — Pro only (hidden in user/guest mode). `PdfImportDialog`: pick PDF (expo-document-picker), “process” (placeholder), preview extracted tables, confirm import to add tables to map. Optional “view PDF” via `Linking.openURL`.
- **Menu update dialog** — After menu changes, dialog: “Send push notification to all active users?” — Yes (toast “Notification sent”) or No, silent (toast “Saved silently”).
- **User/guest mode** — When `userMode` (guest): no Guests section, no voice, no PDF import; read-only table info.

---

## 7. Pro — Ops tab

- **Access** — Manager and Owner only (`canAccessOps`). Door/Promoter see “Access restricted” if they open Ops.
- **Revenue donut** — Skia donut: current revenue vs goal; animated progress; center shows amount, % complete, and % change (e.g. +12% vs last Saturday). Color for positive/negative change.
- **Revenue blocks** — Current revenue, remaining to goal, tonight’s goal; comparison period label.
- **Live feed** — List of ops feed items (order, arrival, alert, geo). Manager/Owner can add/clear/moderate (`canManageLiveFeed`). Items from `useLiveFeed()` (persisted in `vipsync_ops_live_feed_v1`).
- **Add feed item** — Modal/sheet to add item with type, title, description, time, optional table/avatar.
- **Clear feed** — Clear all feed items (manage role only).

---

## 8. Pro — Profile tab

- **Profile card** — Avatar, name, role badge, stats (e.g. tables sold, revenue, nights). Copy referral link; share.
- **Achievements** — List of achievements (e.g. Top Seller, Revenue King, Night Owl) with progress and locked/unlocked state.
- **Settings menu** — Account, Notifications, Privacy & Security; Manager/Owner also see “Manage Club Settings” (`canManageClubSettings`).
- **Account settings** — Edit display name, email, phone, profile photo (camera/gallery). Persisted per `SETTINGS_ACCOUNT_KEY`.
- **Notifications settings** — Toggles: Push, SMS, Sound. Stored in AsyncStorage (`SETTINGS_NOTIFICATIONS_KEY`).
- **Privacy & security** — Privacy toggles and security options (stored `SETTINGS_PRIVACY_KEY`).
- **Manage club settings** — Manager/Owner only: club details, menu URL or PDF link (placeholder “Scan” toast), operational settings. Stored `SETTINGS_CLUB_KEY`.
- **Logout** — Confirmation dialog; calls `onLogout` and clears auth.

---

## 9. Pro — Bottles tab

- **List** — Bottles with name, price, stock, image (asset key or custom URI). Manager/Owner can add/edit/delete (`canManageBottlesAndStock`); Door/Promoter view only.
- **Add bottle** — Form: name, price, stock; optional image from library or camera; optional preset image key.
- **Edit bottle** — Same form; update existing. Delete with confirmation.
- **Bottles context** — In-memory list (initial seed); add/update/delete via `BottlesProvider`. No backend persistence in current code.

---

## 10. User (guest) mode — Guest shell

- **Tabs** — Home, Chat, Map, Me (account). No Ops; Chats run with `userMode` (Main Ops hidden).
- **Same shell UX** — Logo, search, notifications (badge/pulse), avatar; notifications overlay (guest can see “No notifications” or list).
- **Logout** — Returns to auth.

---

## 11. Guest — Home tab

- **Featured tables** — Cards: name, seats, min spend, tag (HOT, LIMITED, BEST VALUE). Follow/unfollow or CTA (e.g. request).
- **VIP tables** — Two types: **Bidding** (current bid, leader, next bid amount, place bid); **Booking** (min spend, description, book now).
- **Events** — List of events (title, date, time, venue, tag: TONIGHT / LIVE / UPCOMING). Follow DJs (e.g. DJ Khaled, Team Alpha); state in `vipsync_guest_home_follows_v1`.
- **Mode persistence** — Selected view/filters stored in `vipsync_guest_home_mode_v1`.

---

## 12. Guest — Chat tab

- **Chat list** — Same chat UI as Pro but with `userMode`: Main Ops chat hidden. Guest-specific chat list and threads.
- **Chat thread** — Messages with sender (guest/venue), author name/avatar, text, timestamp. Send text; optional attachments/emoji (if implemented).
- **Guest chat types** — `GuestChatMessage`: sender (guest | venue), authorName, authorAvatarSrc, text, createdAtISO, threadId.

---

## 13. Guest — Map tab

- **Read-only map** — Same floor plan and table list as Pro, but no edit/drag, no staff assignment, no PDF import, no “Guests” or voice. Table info: number, status, name, capacity only.

---

## 14. Guest — Me (account) tab

- **Profile** — Display name, email, phone, avatar; edit via Account settings. Stored `GUEST_SETTINGS_ACCOUNT_KEY`.
- **Settings sections** — Account, Notifications, Privacy, Help & Support.
- **Notifications** — Push and sound toggles (`GUEST_SETTINGS_NOTIFICATIONS_KEY`).
- **Privacy** — e.g. profile visibility (`GUEST_SETTINGS_PRIVACY_KEY`).
- **Help & support** — Placeholder content or links.
- **Logout** — Clears guest auth and returns to auth screen.

---

## 15. Role-based permissions (summary)

| Feature               | Promoter | Door | Manager | Owner |
|----------------------|----------|------|---------|-------|
| Home (Vibe)           | View     | View | View    | View  |
| Vibe events           | View     | View | View+Manage | View+Manage |
| Live Feed (Ops)       | No       | No   | View+Manage | View+Manage |
| Map tables            | Edit     | View | Edit    | Edit  |
| Club settings         | No       | No   | Yes     | Yes   |
| Ops tab               | No       | No   | Yes     | Yes   |
| Bottles & stock       | View     | View | View+Manage | View+Manage |
| Table girl edit       | No       | No   | Yes     | Yes   |

Helpers: `getTabsForRole`, `canManageClubSettings`, `canAccessOps`, `canEditMapTables`, `canEditTableGirl`, `canViewVibeEvents`, `canManageVibeEvents`, `canViewLiveFeed`, `canManageLiveFeed`, `canManageBottlesAndStock`.

---

## 16. Contexts & state

- **BottlesContext** — `bottles`, `addBottle`, `updateBottle`, `deleteBottle`. In-memory; initial seed list.
- **LiveFeedContext** — `feedItems`, `setFeedItems`, `addFeedItem`. Persisted via `useLocalStorageState` (`vipsync_ops_live_feed_v1`). Item types: order, arrival, alert, geo.
- **Theme** — ThemeProvider with dark/light (or system); neon palette (e.g. neonPink, neonCyan, neonGreen, neonOrange).
- **Toast** — ToastProvider; `toast({ title, description?, durationMs?, variant? })`; auto-dismiss overlay.
- **Guest storage** — `useLocalStorageState` (AsyncStorage) for vibe, vibe events, guest home follows/mode, settings keys.

---

## 17. UI & UX

- **Theme** — Dark-oriented theme with neon accents; SafeAreaProvider; responsive hooks.
- **Haptics** — `HapticPressable` and `useHapticFeedback` for taps where supported.
- **Animations** — Reanimated (entering/exit, shared values, springs, timings); Moti for some transitions. Skia for donut and map canvas.
- **Modals/sheets** — `ModalSheet`, `ModalCard`, `AlertDialog` from `@/components/ui/modal`.
- **Forms** — `Input`, `Button`, `Card`, `Badge`; `DateTimePicker` for dates.
- **Avatars** — `NeonAvatar`, `NeonAvatarGroup`, `ProfileAvatar`; asset-based or URI.
- **Assets** — `@/lib/assets`: avatars, bottles, tables, images; `resolveAvatar`, bottle/table image keys.

---

## 18. Technical stack

- **Framework** — Expo (SDK 54), React Native, expo-router.
- **Navigation** — expo-router (Stack); in-app tab switching is custom (no expo-router tabs for main app).
- **State** — React (useState, useCallback, useMemo), Context (Bottles, LiveFeed, Theme, Toast), AsyncStorage for persistence.
- **UI** — react-native-reanimated, react-native-gesture-handler, Moti, @shopify/react-native-skia, lucide-react-native, expo-image.
- **Pickers** — expo-image-picker, @react-native-community/datetimepicker, expo-document-picker (PDF).
- **Fonts** — @expo-google-fonts/inter, @expo-google-fonts/orbitron.
- **Utils** — expo-clipboard, expo-linking; `formatNumber`, `getInitials` in `@/lib/utils`; responsive helpers in `@/hooks/use-responsive` and `@/lib/responsive`.

---

## 19. Optional / placeholder

- **Push notifications** — UI only (“Send push to all users?” / “Notification sent” toast); no FCM or backend.
- **Scan menu / PDF link** — Profile “Menu URL or PDF link” and “Scan” toast; no real scan or URL sync.
- **PDF import** — Document pick and “process” flow; table extraction is placeholder (no real parsing).
- **Calls** — GSCalling screen placeholder; no real voice/video.
- **Backend** — When `EXPO_PUBLIC_API_URL` is set (non-localhost), the app uses the Node API and Supabase for bottles, live feed, vibe, vibe events, map tables, and profile sync. See `INTEGRATION.md` and `backend/`.

---

This document reflects the codebase as of the last review. For exact permission logic and keys, see `src/constants/role-permissions.ts` and the respective tab and context files.
