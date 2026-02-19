import * as React from "react"
import { api, getAccessToken, isApiConnected } from "@/lib/api"

export interface ContactItem {
  id: string
  name: string
  phone?: string
  avatar?: string
  status: string
  profileId?: string
  createdAt?: string
  updatedAt?: string
}

interface ContactsContextValue {
  contacts: ContactItem[]
  isLoading: boolean
  fetchContacts: () => Promise<ContactItem[]>
  createContact: (data: { name: string; phone?: string; avatar?: string; status?: string; profileId?: string }) => Promise<ContactItem | null>
  updateContact: (id: string, data: Partial<Pick<ContactItem, "name" | "phone" | "avatar" | "status" | "profileId">>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  getContactByProfileId: (profileId: string) => ContactItem | undefined
}

const ContactsContext = React.createContext<ContactsContextValue | null>(null)

function apiRowToContact(r: Record<string, unknown>): ContactItem {
  return {
    id: String(r.id),
    name: (r.name as string) ?? "",
    phone: r.phone as string | undefined,
    avatar: r.avatar as string | undefined,
    status: (r.status as string) ?? "active",
    profileId: r.profileId as string | undefined,
    createdAt: r.createdAt as string | undefined,
    updatedAt: r.updatedAt as string | undefined,
  }
}

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = React.useState<ContactItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchContacts = React.useCallback(async (): Promise<ContactItem[]> => {
    if (!isApiConnected() || !getAccessToken()) return []
    setIsLoading(true)
    try {
      const res = await api.get<{ contacts: Array<Record<string, unknown>> }>("/api/contacts")
      const list = (res?.contacts ?? []).map((r) => apiRowToContact({ ...r, profileId: r.profile_id ?? r.profileId }))
      setContacts(list)
      return list
    } catch {
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createContact = React.useCallback(
    async (data: { name: string; phone?: string; avatar?: string; status?: string; profileId?: string }): Promise<ContactItem | null> => {
      if (!isApiConnected() || !getAccessToken()) return null
      try {
        const created = await api.post<Record<string, unknown>>("/api/contacts", {
          name: data.name,
          phone: data.phone,
          avatar: data.avatar,
          status: data.status ?? "active",
          profileId: data.profileId,
        })
        const item = apiRowToContact({ ...created, profileId: (created as { profile_id?: string }).profile_id ?? created.profileId })
        setContacts((prev) => [...prev, item])
        return item
      } catch {
        return null
      }
    },
    []
  )

  const updateContact = React.useCallback(
    async (id: string, data: Partial<Pick<ContactItem, "name" | "phone" | "avatar" | "status" | "profileId">>) => {
      if (!isApiConnected() || !getAccessToken()) return
      const toApi: Record<string, unknown> = {}
      if (data.name != null) toApi.name = data.name
      if (data.phone !== undefined) toApi.phone = data.phone
      if (data.avatar !== undefined) toApi.avatar = data.avatar
      if (data.status !== undefined) toApi.status = data.status
      if (data.profileId !== undefined) toApi.profileId = data.profileId
      try {
        const updated = await api.patch<Record<string, unknown>>(`/api/contacts/${id}`, toApi)
        const item = apiRowToContact({ ...updated, profileId: (updated as { profile_id?: string }).profile_id ?? updated.profileId })
        setContacts((prev) => prev.map((c) => (c.id === id ? item : c)))
      } catch {
        setContacts((prev) => prev.filter((c) => c.id !== id))
      }
    },
    []
  )

  const deleteContact = React.useCallback(async (id: string) => {
    if (!isApiConnected() || !getAccessToken()) return
    try {
      await api.delete(`/api/contacts/${id}`)
      setContacts((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setContacts((prev) => prev.filter((c) => c.id !== id))
    }
  }, [])

  const getContactByProfileId = React.useCallback(
    (profileId: string): ContactItem | undefined => contacts.find((c) => c.profileId === profileId),
    [contacts]
  )

  const value = React.useMemo(
    () => ({
      contacts,
      isLoading,
      fetchContacts,
      createContact,
      updateContact,
      deleteContact,
      getContactByProfileId,
    }),
    [contacts, isLoading, fetchContacts, createContact, updateContact, deleteContact, getContactByProfileId]
  )

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
}

export function useContacts(): ContactsContextValue {
  const ctx = React.useContext(ContactsContext)
  if (!ctx) throw new Error("useContacts must be used within ContactsProvider")
  return ctx
}

export function useContactsOptional(): ContactsContextValue | null {
  return React.useContext(ContactsContext)
}
