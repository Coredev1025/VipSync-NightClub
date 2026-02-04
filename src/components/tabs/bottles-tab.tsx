import type { Bottle } from "@/contexts/bottles-context"
import { useBottles } from "@/contexts/bottles-context"
import { bottleImages, type BottleImageKey } from "@/lib/assets"
import { formatNumber } from "@/lib/utils"
import { useTheme } from "@/theme/theme-provider"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { ArrowLeft, Camera, Pencil, Plus, Trash2, Wine, X } from "lucide-react-native"
import * as React from "react"
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { Input } from "@/components/ui/input"
import { ModalSheet } from "@/components/ui/modal"

export interface BottlesTabProps {
  onClose?: () => void
}

export function BottlesTab({ onClose }: BottlesTabProps) {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { bottles, addBottle, updateBottle, deleteBottle } = useBottles()
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [stock, setStock] = React.useState("")
  const [imageUri, setImageUri] = React.useState<string | null>(null)

  function openAdd() {
    setEditingId(null)
    setName("")
    setPrice("")
    setStock("")
    setImageUri(null)
    setFormOpen(true)
  }

  function openEdit(b: Bottle) {
    setEditingId(b.id)
    setName(b.name)
    setPrice(String(b.price))
    setStock(String(b.stock))
    setImageUri(b.imageUri ?? null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  async function handleInsertImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to add a bottle image.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri)
    }
  }

  function handleSave() {
    const priceNum = Number(price)
    const stockNum = Number(stock)
    if (!name.trim() || !Number.isFinite(priceNum) || priceNum < 0 || !Number.isFinite(stockNum) || stockNum < 0) return
    const payload = { name: name.trim(), price: priceNum, stock: stockNum, imageUri: imageUri ?? undefined }
    if (editingId) {
      updateBottle(editingId, payload)
    } else {
      addBottle(payload)
    }
    closeForm()
  }

  function handleDelete(id: string) {
    deleteBottle(id)
    if (editingId === id) closeForm()
  }

  const isModalStyle = Boolean(onClose)

  return (
    <View style={[styles.root, isModalStyle && { minHeight: 300, paddingBottom: insets.bottom + 16 }]}>
      {isModalStyle && (
        <View
          style={[
            styles.settingsHeader,
            { paddingTop: Math.max(insets.top, 12), borderBottomColor: theme.colors.border },
          ]}
        >
          <HapticPressable onPress={onClose} style={styles.settingsBack} accessibilityLabel="Close">
            <ArrowLeft size={22} color={theme.colors.foreground} />
          </HapticPressable>
          <View style={styles.settingsTitleRow}>
            <Wine size={18} color={theme.colors.neonPink} />
            <Text style={[styles.settingsTitle, { color: theme.colors.foreground }]} numberOfLines={1}>
              Bottles & Stock
            </Text>
          </View>
          <HapticPressable onPress={openAdd} style={styles.settingsBack} accessibilityLabel="Add bottle">
            <Plus size={22} color={theme.colors.foreground} />
          </HapticPressable>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isModalStyle && (
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colors.foreground }]}>Bottles & Stock</Text>
            <Button onPress={openAdd} size="sm">
              <Plus size={16} color="#000" />
              <Text style={styles.addLabel}>Add</Text>
            </Button>
          </View>
        )}
        {bottles.length === 0 ? (
          <Text style={[styles.empty, { color: theme.colors.mutedForeground }]}>
            No bottles yet. Tap Add to create one.
          </Text>
        ) : (
          bottles.map((b) => (
            <Card key={b.id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.cardImageWrap}>
                {b.imageUri ? (
                  <Image source={{ uri: b.imageUri }} style={styles.cardImage} contentFit="cover" />
                ) : b.imageKey && bottleImages[b.imageKey as BottleImageKey] != null ? (
                  <Image
                    source={bottleImages[b.imageKey as BottleImageKey]}
                    style={styles.cardImage}
                    contentFit="contain"
                  />
                ) : (
                  <View style={[styles.cardImagePlaceholder, { backgroundColor: theme.colors.muted }]}>
                    <Wine size={22} color={theme.colors.mutedForeground} />
                  </View>
                )}
              </View>
              <View style={styles.cardMain}>
                <Text style={[styles.bottleName, { color: theme.colors.foreground }]} numberOfLines={1}>
                  {b.name}
                </Text>
                <Text style={[styles.bottleMeta, { color: theme.colors.mutedForeground }]}>
                  {formatNumber(b.price, { prefix: "$" })} · Stock: {b.stock}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <HapticPressable onPress={() => openEdit(b)} style={styles.iconBtn} accessibilityLabel="Edit bottle">
                  <Pencil size={18} color={theme.colors.foreground} />
                </HapticPressable>
                <HapticPressable onPress={() => handleDelete(b.id)} style={styles.iconBtn} accessibilityLabel="Delete bottle">
                  <Trash2 size={18} color="#ff3b30" />
                </HapticPressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <ModalSheet open={formOpen} onClose={closeForm} maxHeightPct={1}>
        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: theme.colors.foreground }]}>
            {editingId ? "Edit bottle" : "Add bottle"}
          </Text>

          <View style={[styles.imageInsertRow, { borderColor: theme.colors.border }]}>
            <View style={styles.imageInsertPreview}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.imageInsertThumb} contentFit="cover" />
                  <HapticPressable
                    onPress={() => setImageUri(null)}
                    style={[styles.imageInsertClear, { backgroundColor: theme.colors.card }]}
                    accessibilityLabel="Remove image"
                  >
                    <X size={14} color={theme.colors.foreground} />
                  </HapticPressable>
                </>
              ) : (
                <View style={[styles.imageInsertPlaceholder, { backgroundColor: theme.colors.muted }]}>
                  <Wine size={28} color={theme.colors.mutedForeground} />
                </View>
              )}
            </View>
            <HapticPressable
              onPress={handleInsertImage}
              style={[styles.imageInsertBtn, { borderColor: theme.colors.neonCyan, backgroundColor: `${theme.colors.neonCyan}18` }]}
              accessibilityLabel="Insert bottle image"
            >
              <Camera size={18} color={theme.colors.neonCyan} />
              <Text style={[styles.imageInsertBtnText, { color: theme.colors.neonCyan }]}>
                {imageUri ? "Change image" : "Insert image"}
              </Text>
            </HapticPressable>
          </View>

          <Input
            placeholder="Name"
            value={name}
            onChangeText={setName}
            containerStyle={styles.inputWrap}
            style={{ color: theme.colors.foreground }}
          />
          <Input
            placeholder="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            containerStyle={styles.inputWrap}
            style={{ color: theme.colors.foreground }}
          />
          <Input
            placeholder="Stock"
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            containerStyle={styles.inputWrap}
            style={{ color: theme.colors.foreground }}
          />
          <View style={styles.formActions}>
            <HapticPressable onPress={closeForm}>
              <Badge tone="neutral">Cancel</Badge>
            </HapticPressable>
            <Button onPress={handleSave}>
              <Text style={{ color: theme.colors.foreground, fontFamily: "Orbitron_700Bold" }}>Save</Text>
            </Button>
          </View>
        </View>
      </ModalSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  settingsBack: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  settingsTitle: {
    fontFamily: "Orbitron_900Black",
    fontSize: 16,
    flexShrink: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Orbitron_900Black",
    fontSize: 18,
  },
  addLabel: {
    color: "#000",
    fontFamily: "Orbitron_700Bold",
    marginLeft: 6,
  },
  empty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  cardImageWrap: {
    marginRight: 12,
  },
  cardImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  cardImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMain: {
    flex: 1,
    marginRight: 12,
  },
  bottleName: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 15,
  },
  bottleMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 8,
  },
  form: {
    padding: 16,
    paddingBottom: 24,
  },
  formTitle: {
    fontFamily: "Orbitron_900Black",
    fontSize: 16,
    marginBottom: 16,
  },
  imageInsertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  imageInsertPreview: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imageInsertThumb: {
    width: "100%",
    height: "100%",
  },
  imageInsertClear: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  imageInsertPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  imageInsertBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  imageInsertBtnText: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 14,
  },
  inputWrap: {
    marginBottom: 12,
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
})
