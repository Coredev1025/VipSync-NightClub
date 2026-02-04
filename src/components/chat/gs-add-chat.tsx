import { Image } from "expo-image"
import { ArrowLeft, MoreVertical, UserPlus, Users } from "lucide-react-native"
import * as React from "react"
import {
    FlatList,
    Pressable,
    Text,
    View,
    useColorScheme
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useTheme } from "@/theme/theme-provider"

interface Contact {
  id: number | string
  name: string
  phone?: string
  avatar?: string
  status?: string
}

interface AddChatProps {
  contacts?: Contact[]
  onBack: () => void
  onContactPress: (contact: Contact) => void
  onNewGroupPress?: () => void
  onNewContactPress?: () => void
}

function getAddChatStyles(mode: string | null | undefined, theme: ReturnType<typeof useTheme>["theme"]) {
  const isDark = mode === "dark"
  return {
    container: {
      flex: 1,
      backgroundColor: "#050505",
    },
    topBarHolder: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    topBarMainText: {
      fontSize: 16,
      color: theme.colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    topBarSecText: {
      fontSize: 11,
      marginTop: 1,
      color: theme.colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    contactsHeading: {
      fontSize: 14,
      marginTop: 15,
      marginBottom: 5,
      color: theme.colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase" as const,
      letterSpacing: 1,
    },
    contactLink: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: 10,
    },
    contactLinkIconHolder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.neonPink,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: 18,
    },
    contactLinkText: {
      fontSize: 17,
      color: theme.colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    contactContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    contactAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    contactUser: {
      fontSize: 16,
      marginBottom: 2,
      color: theme.colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    contactStatus: {
      fontSize: 13,
      color: theme.colors.mutedForeground,
      marginLeft: 2,
      fontFamily: "Inter_400Regular",
    },
  }
}

export function GSAddChat({
  contacts = [],
  onBack,
  onContactPress,
  onNewGroupPress,
  onNewContactPress,
}: AddChatProps) {
  const mode = useColorScheme()
  const { theme } = useTheme()

  const defaultContacts: Contact[] = [
    { id: 1, name: "Sarah Miller", phone: "+1 (555) 102-2002", avatar: "https://i.pravatar.cc/320?u=sarah@geekspark.com", status: "VIP Operations Manager" },
    { id: 2, name: "Mike Johnson", phone: "+1 (555) 103-2003", avatar: "https://i.pravatar.cc/320?u=mike@geekspark.com", status: "Door Manager" },
    { id: 3, name: "John Doe", phone: "+1 (555) 200-3000", avatar: "https://i.pravatar.cc/320?u=john@geekspark.com", status: "Bar Manager" },
    { id: 4, name: "Jane Smith", phone: "+1 (555) 201-3001", avatar: "https://i.pravatar.cc/320?u=jane@geekspark.com", status: "Host" },
  ]

  const contactList = contacts.length > 0 ? contacts : defaultContacts

  const styles = getAddChatStyles(mode, theme)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBarHolder}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={onBack}>
            <ArrowLeft size={20} color={theme.colors.foreground} />
          </Pressable>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.topBarMainText}>Select Contact</Text>
            <Text style={styles.topBarSecText}>{contactList.length} Contacts</Text>
          </View>
        </View>

        <View>
          <Pressable>
            <MoreVertical size={16} color={theme.colors.foreground} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 15 }}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={contactList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ContactItem
              item={item}
              onPress={() => onContactPress(item)}
              styles={styles}
            />
          )}
          ListHeaderComponent={
            <ContactLinks
              onNewGroupPress={onNewGroupPress}
              onNewContactPress={onNewContactPress}
              styles={styles}
            />
          }
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      </View>
    </SafeAreaView>
  )
}

function ContactLinks({
  onNewGroupPress,
  onNewContactPress,
  styles,
}: {
  onNewGroupPress?: () => void
  onNewContactPress?: () => void
  styles: ReturnType<typeof getAddChatStyles>
}) {
  return (
    <View>
      <View>
        {onNewGroupPress && (
          <Pressable onPress={onNewGroupPress} style={styles.contactLink}>
            <View style={styles.contactLinkIconHolder}>
              <Users size={23} color="#fff" />
            </View>
            <Text style={styles.contactLinkText}>New group</Text>
          </Pressable>
        )}

        {onNewContactPress && (
          <Pressable onPress={onNewContactPress} style={styles.contactLink}>
            <View style={styles.contactLinkIconHolder}>
              <UserPlus size={23} color="#fff" />
            </View>
            <Text style={styles.contactLinkText}>New contact</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.contactsHeading}>Contacts on ChatApp</Text>
    </View>
  )
}

function getContactDisplayName(item: Contact): string {
  return (item.name?.trim() || item.phone || "Unknown").trim()
}

function ContactItem({
  item,
  onPress,
  styles,
}: {
  item: Contact
  onPress: () => void
  styles: ReturnType<typeof getAddChatStyles>
}) {
  const displayName = getContactDisplayName(item)
  const showPhoneSubtitle = item.phone && item.name?.trim()
  const showStatusSubtitle = item.status && !showPhoneSubtitle

  return (
    <Pressable onPress={onPress} style={styles.contactContainer}>
      <Image
        source={{ uri: item.avatar || "https://i.pravatar.cc/320?u=default" }}
        style={styles.contactAvatar}
        contentFit="cover"
      />

      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.contactUser}>{displayName}</Text>
        {showPhoneSubtitle ? (
          <Text style={styles.contactStatus} numberOfLines={1}>
            {item.phone}
          </Text>
        ) : showStatusSubtitle ? (
          <Text style={styles.contactStatus} numberOfLines={1}>
            {item.status}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}

