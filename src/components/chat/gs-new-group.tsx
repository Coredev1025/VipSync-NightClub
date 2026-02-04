import { Image } from "expo-image"
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react-native"
import * as React from "react"
import {
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
    useColorScheme
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useTheme } from "@/theme/theme-provider"

interface Contact {
  id: number | string
  name: string
  avatar?: string
  status?: string
}

interface NewGroupProps {
  contacts?: Contact[]
  onBack: () => void
  onContinue: (selectedContacts: Contact[]) => void
}

function getStyles(mode: string | null | undefined, theme: ReturnType<typeof useTheme>["theme"]) {
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
    selectedContact: {
      alignItems: "center" as const,
      marginRight: 25,
      marginVertical: 15,
    },
    linkIconHolder: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      position: "relative" as const,
    },
    linkAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatarHolder: {
      position: "absolute" as const,
      right: -5,
      bottom: 5,
      backgroundColor: theme.colors.card,
      borderRadius: 100,
      width: 20,
      height: 20,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedUser: {
      fontSize: 12,
      marginTop: 5,
      color: theme.colors.foreground,
      fontFamily: "Inter_400Regular",
      maxWidth: 60,
      textAlign: "center" as const,
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
    floatingBtn: {
      position: "absolute" as const,
      bottom: 15,
      right: 15,
      width: 52,
      height: 52,
      backgroundColor: theme.colors.neonPink,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderRadius: 15,
    },
    searchContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
      color: theme.colors.foreground,
      fontFamily: "Inter_400Regular",
    },
  }
}

export function GSNewGroup({
  contacts = [],
  onBack,
  onContinue,
}: NewGroupProps) {
  const mode = useColorScheme()
  const { theme } = useTheme()
  const styles = getStyles(mode, theme)
  const [selectedContacts, setSelectedContacts] = React.useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")

  const defaultContacts: Contact[] = [
    { id: 1, name: "John Doe", avatar: "https://i.pravatar.cc/300?u=jdoe@geekspark.com", status: "ChatApp is best!!!" },
    { id: 2, name: "Jason Smith", avatar: "https://i.pravatar.cc/301?u=jason@geekspark.com", status: "ChatApp is best!!!" },
    { id: 3, name: "Jimmy Nerd", avatar: "https://i.pravatar.cc/302?u=jimmy@geekspark.com", status: "ChatApp is best!!!" },
    { id: 4, name: "Gerald", avatar: "https://i.pravatar.cc/303?u=gerald@geekspark.com", status: "ChatApp is best!!!" },
    { id: 5, name: "John Snow", avatar: "https://i.pravatar.cc/304?u=jsnow@geekspark.com", status: "ChatApp is best!!!" },
    { id: 6, name: "Denarys", avatar: "https://i.pravatar.cc/305?u=denarys@geekspark.com", status: "ChatApp is best!!!" },
    { id: 7, name: "Jamie Lannister", avatar: "https://i.pravatar.cc/306?u=jamie@geekspark.com", status: "ChatApp is best!!!" },
    { id: 8, name: "Jonathan", avatar: "https://i.pravatar.cc/307?u=jhonny@geekspark.com", status: "ChatApp is best!!!" },
    { id: 9, name: "David", avatar: "https://i.pravatar.cc/308?u=david@geekspark.com", status: "ChatApp is best!!!" },
    { id: 10, name: "John Mooris", avatar: "https://i.pravatar.cc/309?u=jmor@geekspark.com", status: "ChatApp is best!!!" },
  ]

  const contactList = contacts.length > 0 ? contacts : defaultContacts

  const filteredContacts = contactList.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.status?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleContactSelect = (contact: Contact) => {
    if (selectedContacts.find((c) => c.id === contact.id)) {
      // Already selected, remove it
      setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id))
    } else {
      // Add to selection
      setSelectedContacts((prev) => [...prev, contact])
    }
  }

  const handleRemoveSelected = (contactId: number | string) => {
    setSelectedContacts((prev) => prev.filter((c) => c.id !== contactId))
  }

  const handleContinue = () => {
    if (selectedContacts.length > 0) {
      onContinue(selectedContacts)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBarHolder}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={onBack}>
            <ArrowLeft size={20} color={theme.colors.foreground} />
          </Pressable>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.topBarMainText}>New Group</Text>
            <Text style={styles.topBarSecText}>Add Members</Text>
          </View>
        </View>

        <View>
          <Pressable>
            <Search size={22} color={theme.colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={theme.colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={theme.colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <X size={18} color={theme.colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={selectedContacts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <SelectedItem
                item={item}
                onRemove={() => handleRemoveSelected(item.id)}
                styles={styles}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 15 }}
          />
        </View>
      )}

      {/* Contacts Listing */}
      <View style={{ paddingHorizontal: 15, flex: 1 }}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={filteredContacts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ContactItem
              item={item}
              isSelected={selectedContacts.some((c) => c.id === item.id)}
              onPress={() => handleContactSelect(item)}
              styles={styles}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.contactsHeading}>Contacts on ChatApp</Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </View>

      {/* Continue Button */}
      {selectedContacts.length > 0 && (
        <Pressable onPress={handleContinue} style={styles.floatingBtn}>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      )}
    </SafeAreaView>
  )
}

function ContactItem({
  item,
  isSelected,
  onPress,
  styles,
}: {
  item: Contact
  isSelected: boolean
  onPress: () => void
  styles: ReturnType<typeof getStyles>
}) {
  return (
    <Pressable onPress={onPress} style={styles.contactContainer}>
      <Image
        source={{ uri: item.avatar || "https://i.pravatar.cc/320?u=default" }}
        style={styles.contactAvatar}
        contentFit="cover"
      />

      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.contactUser}>{item.name}</Text>
        {item.status && <Text style={styles.contactStatus}>{item.status}</Text>}
      </View>

      {isSelected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: "#4CAF50",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>✓</Text>
        </View>
      )}
    </Pressable>
  )
}

function SelectedItem({
  item,
  onRemove,
  styles,
}: {
  item: Contact
  onRemove: () => void
  styles: ReturnType<typeof getStyles>
}) {
  const { theme } = useTheme()
  return (
    <Pressable onPress={onRemove} style={styles.selectedContact}>
      <View style={styles.linkIconHolder}>
        <Image
          source={{ uri: item.avatar || "https://i.pravatar.cc/320?u=default" }}
          style={styles.linkAvatar}
          contentFit="cover"
        />
        <View style={styles.avatarHolder}>
          <X size={12} color={theme.colors.foreground} />
        </View>
      </View>

      <Text style={styles.selectedUser} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  )
}
