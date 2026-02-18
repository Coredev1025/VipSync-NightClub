# VIPsync Database Schema

Supabase PostgreSQL schema for VIPsync. Run migrations in order:
1. `migrations/20250210000000_initial.sql`
2. `migrations/20250210100000_supabase_auth_rls.sql`
3. `migrations/20250211000000_otp_contacts_revenue_push_guest.sql`

---

## Tables

### profiles

User profiles (linked to Supabase Auth via `auth_id`).

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| auth_id | UUID | UNIQUE (links to auth.users.id) |
| email | TEXT | |
| name | TEXT | |
| phone | TEXT | |
| picture | TEXT | |
| mode | TEXT | NOT NULL, DEFAULT 'pro', CHECK (pro, user) |
| pro_role | TEXT | NOT NULL, DEFAULT 'promoter', CHECK (promoter, door, manager, owner) |
| settings_account | JSONB | DEFAULT '{}' |
| settings_notifications | JSONB | DEFAULT '{}' |
| settings_privacy | JSONB | DEFAULT '{}' |
| settings_club | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

**Trigger:** `on_auth_user_created` – inserts/updates profile when a new user signs up (e.g. OAuth or magic link).

---

### bottles

Venue bottle inventory.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | TEXT | NOT NULL |
| price | NUMERIC | NOT NULL |
| stock | INTEGER | NOT NULL, DEFAULT 0 |
| image_key | TEXT | |
| image_uri | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL |

---

### live_feed_items

Live ops feed items.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| type | TEXT | NOT NULL, CHECK (order, arrival, alert, geo) |
| title | TEXT | NOT NULL |
| description | TEXT | NOT NULL |
| time | TEXT | NOT NULL |
| table | INTEGER | |
| avatar | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL |

**Index:** `idx_live_feed_created` on (created_at DESC)

---

### vibe

Current DJ state (singleton per venue).

| Column | Type | Constraints |
|--------|------|-------------|
| venue_id | TEXT | PRIMARY KEY, DEFAULT 'default' |
| dj_name | TEXT | NOT NULL, DEFAULT 'DJ KHALED' |
| dj_status | TEXT | NOT NULL, CHECK (ON DECKS, OFF DECKS, SCHEDULED, BREAK) |
| genres | TEXT | NOT NULL, DEFAULT '' |
| dj_initials | TEXT | NOT NULL, DEFAULT 'DK' |
| scheduled_time | TEXT | |
| updated_at | TIMESTAMPTZ | NOT NULL |

---

### vibe_events

DJ events/schedule.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| venue_id | TEXT | NOT NULL, DEFAULT 'default' |
| dj_name | TEXT | NOT NULL |
| date | TEXT | NOT NULL |
| time | TEXT | NOT NULL |
| genres | TEXT | NOT NULL, DEFAULT '' |
| status | TEXT | NOT NULL, CHECK (upcoming, live) |
| created_at | TIMESTAMPTZ | NOT NULL |

**Index:** `idx_vibe_events_venue` on (venue_id)

---

### map_tables

Floor plan tables.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| venue_id | TEXT | NOT NULL, DEFAULT 'default' |
| number | INTEGER | NOT NULL |
| x | NUMERIC | NOT NULL |
| y | NUMERIC | NOT NULL |
| status | TEXT | NOT NULL, CHECK (open, occupied, booked, pending) |
| capacity | INTEGER | NOT NULL, DEFAULT 6 |
| current_guests | INTEGER | NOT NULL, DEFAULT 0 |
| guest_name | TEXT | |
| spend | NUMERIC | |
| pending_spend | NUMERIC | |
| items_summary | TEXT | |
| primary_staff | TEXT | |
| backup_staff | TEXT | |
| assigned_to | TEXT | |
| promoter | TEXT | |
| server | TEXT | |
| eta | TEXT | |
| guest_avatar_key | TEXT | |
| promoter_avatar_key | TEXT | |
| bottle_girl_avatar_key | TEXT | |
| is_vip | BOOLEAN | DEFAULT FALSE |
| is_dj_booth | BOOLEAN | DEFAULT FALSE |
| dj_set_time | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

**Index:** `idx_map_tables_venue` on (venue_id)

---

### chats

Chat conversations.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| name | TEXT | NOT NULL |
| avatar | TEXT | |
| phone | TEXT | |
| is_group | BOOLEAN | NOT NULL, DEFAULT FALSE |
| created_by | TEXT | REFERENCES profiles(id) |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

---

### chat_messages

Chat messages.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| chat_id | UUID | NOT NULL, REFERENCES chats(id) ON DELETE CASCADE |
| msg | TEXT | NOT NULL |
| me | BOOLEAN | NOT NULL, DEFAULT TRUE |
| sender | TEXT | |
| role | TEXT | |
| sender_id | TEXT | REFERENCES profiles(id) |
| created_at | TIMESTAMPTZ | NOT NULL |

**Index:** `idx_chat_messages_chat_id` on (chat_id)

---

### contacts

Staff contacts (for chat / new contact flow).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| owner_id | TEXT | NOT NULL, REFERENCES profiles(id) |
| name | TEXT | NOT NULL |
| phone | TEXT | |
| avatar | TEXT | |
| status | TEXT | DEFAULT 'active' |
| created_at, updated_at | TIMESTAMPTZ | NOT NULL |

---

### chat_participants

Group chat membership (chat_id, profile_id).

---

### revenue_goals

Ops revenue goal per venue per date (goal_amount, current_amount, comparison_*).

---

### push_tokens

FCM device tokens per user (user_id, token, platform). UNIQUE(user_id, token).

---

### featured_tables

Guest home featured tables (venue_id, name, seats, min_spend, tag).

---

### vip_tables

Guest home VIP tables: type = bidding (current_bid, leader, next_bid_amount) or booking (description, min_spend). Now linked to floor plan `map_tables` via `map_table_id` (optional).

---

### guest_follows

Guest follows for DJs/entities (profile_id, entity_type, entity_id). UNIQUE(profile_id, entity_type, entity_id).

---

### bar_lto

Bar limited-time offers (venue_id, name, start_date, end_date, menu_items JSONB).

---

### table_service_items

Table service menu items (VIP bottle packages), each optionally linked to a `bottles` inventory record via `bottle_id`.

---

### bar_drink_items

Bar drink menu items (e.g. cocktails), each optionally linked to a `bottles` inventory record via `bottle_id`.

---

### table_service_lto

Table service limited-time offers (venue_id, name, start_date, end_date, menu_items JSONB).

---

## Row Level Security (RLS)

All tables have RLS enabled.

| Table | Policy | Access |
|-------|--------|--------|
| profiles | profiles_select_own | SELECT where auth_id = auth.uid() |
| profiles | profiles_update_own | UPDATE where auth_id = auth.uid() |
| profiles | profiles_insert_own | INSERT where auth_id = auth.uid() |
| bottles | bottles_all_authenticated | ALL for authenticated |
| live_feed_items | live_feed_all_authenticated | ALL for authenticated |
| vibe | vibe_all_authenticated | ALL for authenticated |
| vibe_events | vibe_events_all_authenticated | ALL for authenticated |
| map_tables | map_tables_all_authenticated | ALL for authenticated |
| chats | chats_all_authenticated | ALL for authenticated |
| chat_messages | chat_messages_all_authenticated | ALL for authenticated |

---

## Entity Relationship

```
auth.users (Supabase)
    └── profiles (auth_id = auth.users.id)
            ├── chats.created_by
            └── chat_messages.sender_id

chats
    └── chat_messages.chat_id (ON DELETE CASCADE)
```
