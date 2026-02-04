import { ArrowLeft, Search, UserPlus, Users } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import {
    FlatList,
    StyleSheet,
    Text,
    View
} from "react-native"

import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { NeonAvatar } from "@/components/ui/neon-avatar"
import { resolveAvatar } from "@/lib/assets"
import { useTheme } from "@/theme/theme-provider"

export interface Contact {
  id: string
  name: string
  avatar?: string
  status?: string
  isOnline?: boolean
}

interface AddChatProps {
  contacts: Contact[]
  onBack: () => void
  onContactPress: (contact: Contact) => void
  onNewGroupPress: () => void
  onNewContactPress: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function AddChat({
  contacts,
  onBack,
  onContactPress,
  onNewGroupPress,
  onNewContactPress,
  searchQuery = "",
  onSearchChange,
}: AddChatProps) {
  const { theme } = useTheme()

  const filteredContacts = React.useMemo(() => {
    if (!searchQuery.trim()) return contacts

    const query = searchQuery.toLowerCase()
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.status?.toLowerCase().includes(query)
    )
  }, [contacts, searchQuery])

  return (
    <View style={[styles.container, { backgroundColor: "#050505" }]}>
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        <HapticPressable
          onPress={onBack}
          neonBorder
          borderColor={`${theme.colors.neonCyan}AA`}
          style={[styles.backBtn, { backgroundColor: "transparent" }]}
        >
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </HapticPressable>

        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text
            style={{
              color: theme.colors.foreground,
              fontFamily: "Orbitron_900Black",
              fontSize: 16,
            }}
          >
            Select Contact
          </Text>
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
          >
            {contacts.length} Contacts
          </Text>
        </View>
      </MotiView>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 80 }}
        >
          <View style={styles.searchRow}>
            <Search size={16} color={theme.colors.mutedForeground} />
            <Input
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search contacts..."
              containerStyle={{ flex: 1 }}
              style={{ paddingLeft: 30 }}
            />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 120 }}
        >
          <Card variant="glass" style={styles.actionCard}>
            <HapticPressable
              onPress={onNewGroupPress}
              style={styles.actionItem}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${theme.colors.neonCyan}22` },
                ]}
              >
                <Users size={20} color={theme.colors.neonCyan} />
              </View>
              <Text
                style={{
                  color: theme.colors.foreground,
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 14,
                }}
              >
                New group
              </Text>
            </HapticPressable>

            <HapticPressable
              onPress={onNewContactPress}
              style={styles.actionItem}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${theme.colors.neonPink}22` },
                ]}
              >
                <UserPlus size={20} color={theme.colors.neonPink} />
              </View>
              <Text
                style={{
                  color: theme.colors.foreground,
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 14,
                }}
              >
                New contact
              </Text>
            </HapticPressable>
          </Card>
        </MotiView>

        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: "Orbitron_700Bold",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: 8,
          }}
        >
          Contacts on ChatApp
        </Text>
      </View>

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateX: -18 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{
              type: "timing",
              duration: 220,
              delay: index * 30,
            }}
          >
            <HapticPressable
              onPress={() => onContactPress(item)}
              style={[
                styles.contactRow,
                {
                  borderBottomColor: `${theme.colors.border}66`,
                },
              ]}
            >
              <NeonAvatar
                source={resolveAvatar(item.avatar)}
                fallback={item.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
                size="md"
                glow={item.isOnline ? "green" : "cyan"}
                status={item.isOnline ? "online" : undefined}
                showRing
              />

              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text
                  style={{
                    color: theme.colors.foreground,
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 15,
                  }}
                >
                  {item.name}
                </Text>
                {item.status ? (
                  <Text
                    style={{
                      color: theme.colors.mutedForeground,
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {item.status}
                  </Text>
                ) : null}
              </View>
            </HapticPressable>
          </MotiView>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        style={{ flex: 1 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionCard: {
    padding: 12,
    gap: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
})
