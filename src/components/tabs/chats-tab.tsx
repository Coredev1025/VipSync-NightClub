import * as React from "react"

import { GSAddChat } from "@/components/chat/gs-add-chat"
import { GSCalling } from "@/components/chat/gs-calling"
import { GSCamera } from "@/components/chat/gs-camera"
import { GSChatDetails } from "@/components/chat/gs-chat-details"
import { GSChatHome, type ChatItem } from "@/components/chat/gs-chat-home"
import { GSEditContact } from "@/components/chat/gs-edit-contact"
import { GSEmojiPicker } from "@/components/chat/gs-emoji-picker"
import { GSNewContact } from "@/components/chat/gs-new-contact"
import { GSNewGroup } from "@/components/chat/gs-new-group"
import { useContacts } from "@/contexts/contacts-context"
import { useChats } from "@/contexts/chats-context"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Alert } from "react-native"

interface Contact {
  id: number | string
  name: string
  phone?: string
  avatar?: string
  status?: string
  email?: string
  profileId?: string
}

/** True if id is a real profile id (not our synthetic contact_/chat_ id). */
function validProfileId(id: number | string): boolean {
  const s = String(id)
  return s.length > 0 && !/^contact_/.test(s) && !/^chat_/.test(s)
}

type ViewState = "list" | "chat" | "addChat" | "calling" | "newGroup" | "newContact" | "editContact"

export interface ChatsTabProps {
  onOrderSynced?: (order: { tableNumber: number; guest: string; items: string }) => void
  /** When true, Main Ops chat is hidden (user/guest mode). */
  userMode?: boolean
}

export function ChatsTab({ onOrderSynced, userMode = false }: ChatsTabProps = {}) {
  const {
    chats,
    getMessages,
    fetchMessages,
    sendMessage,
    createChat,
    markChatRead,
    loadMoreMessages,
    hasMoreMessages,
    updateMessage,
    deleteMessage,
    clearChatHistory,
    deleteChat,
  } = useChats()
  const { contacts, fetchContacts, createContact, updateContact, deleteContact } = useContacts()
  const { toast } = useToast()
  const [viewState, setViewState] = React.useState<ViewState>("list")
  const [selectedChat, setSelectedChat] = React.useState<ChatItem | null>(null)
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
  const [messagesLoaded, setMessagesLoaded] = React.useState(false)
  const [showCamera, setShowCamera] = React.useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [emojiToInsert, setEmojiToInsert] = React.useState<string>("")
  const [canSendInChat, setCanSendInChat] = React.useState<boolean>(true)

  React.useEffect(() => {
    if (
      viewState === "chat" &&
      userMode &&
      selectedChat &&
      !selectedChat.group &&
      selectedChat.otherParticipantProfileId
    ) {
      api
        .get<{ allowed: boolean }>(`/api/contacts/can-chat-with/${selectedChat.otherParticipantProfileId}`)
        .then((res) => setCanSendInChat(res?.allowed ?? false))
        .catch(() => setCanSendInChat(false))
    } else {
      setCanSendInChat(true)
    }
  }, [viewState, userMode, selectedChat?.id, selectedChat?.group, selectedChat?.otherParticipantProfileId])

  React.useEffect(() => {
    if (viewState === "addChat") fetchContacts()
  }, [viewState, fetchContacts])

  const handleChatPress = React.useCallback((chat: ChatItem) => {
    setSelectedChat(chat)
    setMessagesLoaded(false)
    setViewState("chat")
  }, [])

  React.useEffect(() => {
    if (viewState === "chat" && selectedChat && !messagesLoaded) {
      const chatId = String(selectedChat.id)
      fetchMessages(chatId).then(() => setMessagesLoaded(true))
      markChatRead(chatId)
    }
  }, [viewState, selectedChat, messagesLoaded, fetchMessages, markChatRead])

  const handleAddChatPress = () => {
    setViewState("addChat")
  }

  const handleContactPress = React.useCallback(
    async (contact: Contact) => {
      setSelectedContact(contact)
      const memberIds = contact.profileId ? [contact.profileId] : (validProfileId(contact.id) ? [String(contact.id)] : undefined)
      const created = await createChat({
        name: contact.name,
        avatar: contact.avatar,
        phone: contact.phone,
        isGroup: false,
        memberIds,
      })
      const otherId = memberIds?.[0]
      const chat: ChatItem = created
        ? { ...created, otherParticipantProfileId: created.otherParticipantProfileId ?? otherId }
        : {
            id: `chat_${contact.id}_${Date.now()}`,
            img: contact.avatar || "https://i.pravatar.cc/320?u=default",
            name: contact.name,
            phone: contact.phone,
            lastMsg: "",
            time: new Date().toISOString(),
            seen: true,
            unread: 0,
            group: false,
            otherParticipantProfileId: otherId,
          }
      setSelectedChat(chat)
      setMessagesLoaded(false)
      setViewState("chat")
    },
    [createChat]
  )

  const handleNewGroupContinue = React.useCallback(
    async (selectedContacts: Contact[]) => {
      const groupName = selectedContacts.map((c) => c.name).join(", ")
      const memberIds = selectedContacts
        .map((c) => c.profileId ?? (validProfileId(c.id) ? String(c.id) : null))
        .filter((id): id is string => id != null && id.length > 0)
      const created = await createChat({
        name: groupName.length > 30 ? `${groupName.substring(0, 30)}...` : groupName,
        avatar: selectedContacts[0]?.avatar,
        isGroup: true,
        memberIds: memberIds.length > 0 ? memberIds : undefined,
      })
      const chat: ChatItem = created ?? {
        id: `group_${Date.now()}`,
        img: selectedContacts[0]?.avatar || "https://i.pravatar.cc/320?u=group",
        name: groupName.length > 30 ? `${groupName.substring(0, 30)}...` : groupName,
        lastMsg: "",
        time: new Date().toISOString(),
        seen: true,
        unread: 0,
        group: true,
      }
      setSelectedChat(chat)
      setMessagesLoaded(false)
      setViewState("chat")
    },
    [createChat]
  )

  // Compute lastSeen from current chat messages — must be unconditional (Rules of Hooks)
  const chatMessagesForLastSeen = selectedChat ? getMessages(String(selectedChat.id)) : []
  const lastSeenLabel = React.useMemo(() => {
    const list = chatMessagesForLastSeen
    if (!list || list.length === 0) return "last seen recently"
    const last = list[list.length - 1]
    try {
      const dt = new Date(last.time)
      const now = new Date()
      let dayPart = "today"
      if (dt.toDateString() !== now.toDateString()) {
        dayPart = dt.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      }
      const timePart = dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      return `last seen ${dayPart} at ${timePart.toLowerCase()}`
    } catch {
      return "last seen recently"
    }
  }, [chatMessagesForLastSeen])

  const handleNewContactSave = React.useCallback(
    async (contactData: Omit<Contact, "id">) => {
      const createdContact = await createContact({
        name: contactData.name.trim(),
        avatar: contactData.avatar,
        phone: contactData.phone,
        status: "active",
      })
      let profileId: string | undefined
      if (contactData.email?.trim()) {
        try {
          const r = await api.get<{ id: string }>("/api/profile/lookup", {
            params: { email: contactData.email.trim() },
          })
          profileId = r.id
          if (createdContact?.id) await updateContact(createdContact.id, { profileId })
        } catch {
          profileId = undefined
        }
      } else {
        profileId = undefined
      }
      const created = await createChat({
        name: contactData.name.trim(),
        avatar: contactData.avatar,
        phone: contactData.phone,
        isGroup: false,
        memberIds: profileId ? [profileId] : undefined,
      })
      const chat: ChatItem = created ?? {
        id: createdContact?.profileId ?? `chat_${createdContact?.id ?? Date.now()}_${Date.now()}`,
        img: contactData.avatar || "https://i.pravatar.cc/320?u=default",
        name: contactData.name.trim(),
        phone: contactData.phone,
        lastMsg: "",
        time: new Date().toISOString(),
        seen: true,
        unread: 0,
        group: false,
      }
      setSelectedChat(chat)
      setMessagesLoaded(false)
      setViewState("chat")
    },
    [createContact, updateContact, createChat]
  )

  if (viewState === "newGroup") {
    return (
      <GSNewGroup
        onBack={() => setViewState("addChat")}
        onContinue={handleNewGroupContinue}
      />
    )
  }

  if (viewState === "newContact") {
    return (
      <GSNewContact
        onBack={() => setViewState("addChat")}
        onSave={handleNewContactSave}
      />
    )
  }

  if (viewState === "editContact" && selectedContact) {
    return (
      <GSEditContact
        contact={selectedContact}
        onBack={() => {
          setSelectedContact(null)
          setViewState("addChat")
        }}
        onSave={async (data) => {
          await updateContact(String(selectedContact.id), data)
          setSelectedContact(null)
          setViewState("addChat")
        }}
      />
    )
  }

  if (viewState === "addChat") {
    const contactList: Contact[] = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      avatar: c.avatar,
      status: c.status,
      profileId: c.profileId,
    }))
    return (
      <GSAddChat
        contacts={contactList}
        onBack={() => setViewState("list")}
        onContactPress={handleContactPress}
        onEditContact={(contact) => {
          setSelectedContact(contact)
          setViewState("editContact")
        }}
        onDeleteContact={(contact) => {
          deleteContact(String(contact.id))
        }}
        onNewGroupPress={() => {
          setViewState("newGroup")
        }}
        onNewContactPress={() => {
          setViewState("newContact")
        }}
      />
    )
  }

  if (viewState === "calling" && selectedChat) {
    return (
      <GSCalling
        contactName={selectedChat.name?.trim() || "Unknown"}
        contactAvatar={selectedChat.img}
        onEndCall={() => {
          setViewState("chat")
        }}
        onMutePress={() => {
          // TODO: Implement mute functionality
          console.log("Mute pressed")
        }}
        onVideoPress={() => {
          // TODO: Implement video toggle
          console.log("Video pressed")
        }}
        onSpeakerPress={() => {
          // TODO: Implement speaker toggle
          console.log("Speaker pressed")
        }}
      />
    )
  }

  if (viewState === "chat" && selectedChat) {
    const chatId = String(selectedChat.id)
    const chatMessages = getMessages(chatId)
    const contactListForSender = contacts.map((c) => ({ profileId: c.profileId, name: c.name }))
    return (
      <>
        <GSChatDetails
          contactName={selectedChat.name}
          contactAvatar={selectedChat.img}
          lastSeen={lastSeenLabel}
          messages={chatMessages}
          hasMoreOlder={hasMoreMessages(chatId)}
          onLoadOlder={() => loadMoreMessages(chatId)}
          onOrderSynced={onOrderSynced}
          contacts={contactListForSender}
          chatId={chatId}
          canSend={canSendInChat}
          onEditMessage={(messageId, newText) => updateMessage(chatId, messageId, { msg: newText })}
          onDeleteMessage={(messageId) => deleteMessage(chatId, messageId)}
          onBack={() => {
            setSelectedChat(null)
            setSelectedContact(null)
            setViewState("list")
          }}
          onProfilePress={() => {
            // TODO: Navigate to profile
            console.log("Profile pressed")
          }}
          onCallPress={() => {
            setViewState("calling")
          }}
          onMorePress={() => {
            Alert.alert(
              "Chat options",
              undefined,
              [
                {
                  text: "Delete chat history",
                  style: "destructive",
                  onPress: () => {
                    clearChatHistory(chatId)
                  },
                },
                {
                  text: "Delete chat",
                  style: "destructive",
                  onPress: () => {
                    deleteChat(chatId)
                  },
                },
                { text: "Cancel", style: "cancel" },
              ],
              { cancelable: true }
            )
          }}
          onEmojiPress={() => {
            setShowEmojiPicker(true)
          }}
          onCameraPress={() => {
            setShowCamera(true)
          }}
          onSendMessage={
            canSendInChat
              ? (text) => {
                  sendMessage(String(selectedChat.id), text)
                }
              : () => {
                  toast({
                    title: "Cannot send",
                    description: "You can only message when you're both contacts. Add each other to contacts to chat.",
                    variant: "destructive",
                  })
                }
          }
          emojiToInsert={emojiToInsert}
        />
        <GSCamera
          open={showCamera}
          onClose={() => setShowCamera(false)}
          onImageSelect={(uri) => {
            // TODO: Send image message
            console.log("Image selected:", uri)
          }}
        />
        <GSEmojiPicker
          open={showEmojiPicker}
          onClose={() => {
            setShowEmojiPicker(false)
            // Clear emoji after a brief moment to allow insertion
            setTimeout(() => setEmojiToInsert(""), 100)
          }}
          onEmojiSelect={(emoji) => {
            setEmojiToInsert(emoji)
          }}
        />
      </>
    )
  }

  return (
    <GSChatHome
      chats={chats}
      hideMainOps={userMode}
      onChatPress={handleChatPress}
      onAddChatPress={handleAddChatPress}
      onGroupPress={(chat) => {
        // TODO: Navigate to group details
        console.log("Group pressed:", chat)
      }}
      onProfilePress={(chat) => {
        // TODO: Navigate to profile
        console.log("Profile pressed:", chat)
      }}
    />
  )
}


