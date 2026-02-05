/**
 * Nightclub role-based permissions.
 * Limits app functionality by role: promoter, door staff, manager, owner.
 *
 * PERMISSION MATRIX (nightclub business):
 *
 * | Feature              | Promoter | Door | Manager | Owner |
 * |----------------------|----------|------|---------|-------|
 * | Home (Vibe)          | View     | View | View    | View  |
 * | Vibe Events          | View     | View | View+Manage | View+Manage |
 * | Live Feed (Ops)      | No access| No access | View+Manage | View+Manage |
 * | Map tables           | Edit     | View | Edit    | Edit  |
 * | Club settings        | No       | No   | Yes     | Yes   |
 * | Ops tab              | No       | No   | Yes     | Yes   |
 * | Bottles & Stock      | View     | View | View+Manage | View+Manage |
 *
 * Vibe Events: Who can add/edit/delete events on Home. Manager & Owner only.
 * Bottles & Stock: Add/edit/delete bottles and stock — Manager & Owner only.
 * Live Feed: Part of Ops; only Manager & Owner can see Ops and manage feed.
 */

export type NightclubRole = "promoter" | "door" | "manager" | "owner"

export type StaffTabId = "home" | "chats" | "map" | "ops" | "profile"

/** Tab IDs each role can access. Owner & manager: full; door & promoter: no Ops. */
const TABS_BY_ROLE: Record<NightclubRole, StaffTabId[]> = {
  owner: ["home", "chats", "map", "ops", "profile"],
  manager: ["home", "chats", "map", "ops", "profile"],
  door: ["home", "chats", "map", "profile"],
  promoter: ["home", "chats", "map", "profile"],
}

export function getTabsForRole(role: NightclubRole | undefined): StaffTabId[] {
  if (!role) return TABS_BY_ROLE.manager
  return TABS_BY_ROLE[role] ?? TABS_BY_ROLE.manager
}

/** Owner and manager only. */
export function canManageClubSettings(role: NightclubRole | undefined): boolean {
  return role === "owner" || role === "manager"
}

/** Owner and manager only. Door and promoter do not see Ops tab. */
export function canAccessOps(role: NightclubRole | undefined): boolean {
  return role === "owner" || role === "manager"
}

/** Door staff: view-only on map (no editing tables). Owner, manager, promoter can edit. */
export function canEditMapTables(role: NightclubRole | undefined): boolean {
  return role !== "door"
}

/** Manager and owner can edit bottle girl / table girl; promoter cannot edit promoter or table girl. */
export function canEditTableGirl(role: NightclubRole | undefined): boolean {
  return role === "manager" || role === "owner"
}

// ─── Vibe Events (Home tab) ─────────────────────────────────────────────────
/** All roles with Home tab can view Vibe and Vibe Events list. */
export function canViewVibeEvents(role: NightclubRole | undefined): boolean {
  return true
}

/**
 * Nightclub business: Only manager and owner can add, edit, or delete Vibe events.
 * Promoter and door can view events only (no Add event button).
 */
export function canManageVibeEvents(role: NightclubRole | undefined): boolean {
  return role === "manager" || role === "owner"
}

// ─── Live Feed (Ops tab) ───────────────────────────────────────────────────
/**
 * Nightclub business: Only manager and owner can access Ops tab, hence view Live Feed.
 * Promoter and door do not see Ops or Live Feed.
 */
export function canViewLiveFeed(role: NightclubRole | undefined): boolean {
  return canAccessOps(role)
}

/**
 * Nightclub business: Only manager and owner can manage Live Feed (add/clear/moderate items).
 * Same as Ops access; use for future "add feed item" or feed config.
 */
export function canManageLiveFeed(role: NightclubRole | undefined): boolean {
  return role === "manager" || role === "owner"
}

// ─── Bottles & Stock ────────────────────────────────────────────────────────
/**
 * Nightclub business: Only manager and owner can add, edit, or delete bottles and stock.
 * Promoter and door can view the list only (no Add, Edit, or Delete).
 */
export function canManageBottlesAndStock(role: NightclubRole | undefined): boolean {
  return role === "manager" || role === "owner"
}
