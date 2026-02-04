import * as React from "react"

import { GSAddChat } from "@/components/chat/gs-add-chat"
import { GSCalling } from "@/components/chat/gs-calling"
import { GSCamera } from "@/components/chat/gs-camera"
import { GSChatDetails, type ChatMessage } from "@/components/chat/gs-chat-details"
import { GSChatHome } from "@/components/chat/gs-chat-home"
import { GSEmojiPicker } from "@/components/chat/gs-emoji-picker"
import { GSNewContact } from "@/components/chat/gs-new-contact"
import { GSNewGroup } from "@/components/chat/gs-new-group"

const mainOpsInitialMessages: ChatMessage[] = [
  {
    id: "sarah-1",
    msg: "Copy. Security, keep front clear. VIPs in 10.",
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    me: false,
    sender: "Sarah",
    role: "MANAGER",
  },
  {
    id: "dave-1",
    msg: "Table 2, i got James he wants 2 bottles of Collon.",
    time: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    me: false,
    sender: "Dave",
    role: "PROMOTER",
  },
]

interface ChatItem {
  id: number | string
  img: string
  name: string
  phone?: string
  lastMsg: string
  time: string
  seen: boolean
  unread: number
  group: boolean
}

interface Contact {
  id: number | string
  name: string
  phone?: string
  avatar?: string
  status?: string
}

type ViewState = "list" | "chat" | "addChat" | "calling" | "newGroup" | "newContact"

export interface ChatsTabProps {
  onOrderSynced?: (order: { tableNumber: number; guest: string; items: string }) => void
  /** When true, Main Ops chat is hidden (user/guest mode). */
  userMode?: boolean
}

export function ChatsTab({ onOrderSynced, userMode = false }: ChatsTabProps = {}) {
  const [viewState, setViewState] = React.useState<ViewState>("list")
  const [selectedChat, setSelectedChat] = React.useState<ChatItem | null>(null)
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
  const [showCamera, setShowCamera] = React.useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [emojiToInsert, setEmojiToInsert] = React.useState<string>("")

  const handleChatPress = (chat: ChatItem) => {
    setSelectedChat(chat)
    setViewState("chat")
  }

  const handleAddChatPress = () => {
    setViewState("addChat")
  }

  const handleContactPress = (contact: Contact) => {
    setSelectedContact(contact)
    const newChat: ChatItem = {
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
    setSelectedChat(newChat)
    setViewState("chat")
  }

  const handleNewGroupContinue = (selectedContacts: Contact[]) => {
    // Create a group chat from selected contacts
    const groupName = selectedContacts.map((c) => c.name).join(", ")
    const newGroupChat: ChatItem = {
      id: `group_${Date.now()}`,
      img: selectedContacts[0]?.avatar || "https://i.pravatar.cc/320?u=group",
      name: groupName.length > 30 ? `${groupName.substring(0, 30)}...` : groupName,
      lastMsg: "",
      time: new Date().toISOString(),
      seen: true,
      unread: 0,
      group: true,
    }
    setSelectedChat(newGroupChat)
    setViewState("chat")
  }

  const handleNewContactSave = (contactData: Omit<Contact, "id">) => {
    const newContact: Contact = {
      id: `contact_${Date.now()}`,
      ...contactData,
    }
    const newChat: ChatItem = {
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
    setSelectedChat(newChat)
    setViewState("chat")
  }

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
        contactName={selectedChat.name?.trim() || selectedChat.phone || "Unknown"}
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
    return (
      <>
        <GSChatDetails
          contactName={selectedChat.name}
          contactPhone={selectedChat.phone}
          contactAvatar={selectedChat.img}
          lastSeen="last seen today at 4:10 pm"
          initialMessages={selectedChat.name === "Main Ops" ? mainOpsInitialMessages : undefined}
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
          onSendMessage={(message) => {
            // TODO: Send message to backend
            console.log("Message sent:", message)
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


