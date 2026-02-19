import * as React from "react"

import { GSAddChat } from "@/components/chat/gs-add-chat"
import { GSCalling } from "@/components/chat/gs-calling"
import { GSCamera } from "@/components/chat/gs-camera"
import { GSChatDetails, type ChatMessage } from "@/components/chat/gs-chat-details"
import { GSChatHome, type ChatItem } from "@/components/chat/gs-chat-home"
import { GSEmojiPicker } from "@/components/chat/gs-emoji-picker"
import { GSNewContact } from "@/components/chat/gs-new-contact"
import { GSNewGroup } from "@/components/chat/gs-new-group"
import { useChats } from "@/contexts/chats-context"
import { api } from "@/lib/api"

interface Contact {
  id: number | string
  name: string
  phone?: string
  avatar?: string
  status?: string
  email?: string
}

/** True if id is a real profile id (not our synthetic contact_/chat_ id). */
function validProfileId(id: number | string): boolean {
  const s = String(id)
  return s.length > 0 && !/^contact_/.test(s) && !/^chat_/.test(s)
}

type ViewState = "list" | "chat" | "addChat" | "calling" | "newGroup" | "newContact"

export interface ChatsTabProps {
  onOrderSynced?: (order: { tableNumber: number; guest: string; items: string }) => void
  /** When true, Main Ops chat is hidden (user/guest mode). */
  userMode?: boolean
}

export function ChatsTab({ onOrderSynced, userMode = false }: ChatsTabProps = {}) {
  const { chats, getMessages, fetchMessages, sendMessage, createChat, markChatRead, loadMoreMessages, hasMoreMessages } = useChats()
  const [viewState, setViewState] = React.useState<ViewState>("list")
  const [selectedChat, setSelectedChat] = React.useState<ChatItem | null>(null)
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
  const [messagesLoaded, setMessagesLoaded] = React.useState(false)
  const [showCamera, setShowCamera] = React.useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [emojiToInsert, setEmojiToInsert] = React.useState<string>("")

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
      const memberIds = validProfileId(contact.id) ? [String(contact.id)] : undefined
      const created = await createChat({
        name: contact.name,
        avatar: contact.avatar,
        phone: contact.phone,
        isGroup: false,
        memberIds,
      })
      const chat: ChatItem = created ?? {
        id: `chat_${contact.id}_${Date.now()}`,
        img: contact.avatar || "https://i.pravatar.cc/320?u=default",
        name: contact.name,
        phone: contact.phone,
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
    [createChat]
  )

  const handleNewGroupContinue = React.useCallback(
    async (selectedContacts: Contact[]) => {
      const groupName = selectedContacts.map((c) => c.name).join(", ")
      const memberIds = selectedContacts.map((c) => String(c.id)).filter(validProfileId)
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

  const handleNewContactSave = React.useCallback(
    async (contactData: Omit<Contact, "id">) => {
      const newContact: Contact = {
        id: `contact_${Date.now()}`,
        ...contactData,
      }
      let memberIds: string[] | undefined
      if (contactData.email?.trim()) {
        try {
          const r = await api.get<{ id: string }>("/api/profile/lookup", {
            params: { email: contactData.email.trim() },
          })
          memberIds = [r.id]
        } catch {
          memberIds = undefined
        }
      } else {
        memberIds = undefined
      }
      const created = await createChat({
        name: contactData.name,
        avatar: contactData.avatar,
        phone: contactData.phone,
        isGroup: false,
        memberIds,
      })
      const chat: ChatItem = created ?? {
        id: `chat_${newContact.id}_${Date.now()}`,
        img: newContact.avatar || "https://i.pravatar.cc/320?u=default",
        name: newContact.name,
        phone: newContact.phone,
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
    [createChat]
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

  if (viewState === "addChat") {
    return (
      <GSAddChat
        onBack={() => setViewState("list")}
        onContactPress={handleContactPress}
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
    return (
      <>
        <GSChatDetails
          contactName={selectedChat.name}
          contactAvatar={selectedChat.img}
          lastSeen="last seen today at 4:10 pm"
          messages={chatMessages}
          hasMoreOlder={hasMoreMessages(chatId)}
          onLoadOlder={() => loadMoreMessages(chatId)}
          onOrderSynced={onOrderSynced}
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
            // TODO: Implement more options
            console.log("More options pressed")
          }}
          onEmojiPress={() => {
            setShowEmojiPicker(true)
          }}
          onCameraPress={() => {
            setShowCamera(true)
          }}
          onSendMessage={(text) => {
            sendMessage(String(selectedChat.id), text)
          }}
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


