import type { Bottle } from "@/contexts/bottles-context"
import { useBottles } from "@/contexts/bottles-context"
import { bottleImages, type BottleImageKey } from "@/lib/assets"
import { formatNumber } from "@/lib/utils"
import { useTheme } from "@/theme/theme-provider"
import { Image } from "expo-image"
import { ArrowLeft, Minus, Plus, ShoppingBag, Wine } from "lucide-react-native"
import * as React from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { useToast } from "@/hooks/use-toast"

export interface GuestMenuModalProps {
  onClose: () => void
  open?: boolean
}

type Cart = Record<string, number>

export function GuestMenuModal({ onClose, open = true }: GuestMenuModalProps) {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { toast } = useToast()
  const { bottles, updateBottle } = useBottles()
  const [cart, setCart] = React.useState<Cart>({})
  const [paying, setPaying] = React.useState(false)
  const [paid, setPaid] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setPaid(false)
      setCart({})
      setPaying(false)
    }
  }, [open])

  const cartEntries = React.useMemo(
    () => Object.entries(cart).filter(([, qty]) => qty > 0),
    [cart]
  )
  const cartCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0)
  const cartTotal = React.useMemo(() => {
    return cartEntries.reduce((total, [id, qty]) => {
      const b = bottles.find((x) => x.id === id)
      return total + (b ? b.price * qty : 0)
    }, 0)
  }, [cartEntries, bottles])

  function addToCart(bottle: Bottle) {
    if (bottle.stock < 1) return
    setCart((prev) => ({
      ...prev,
      [bottle.id]: Math.min((prev[bottle.id] ?? 0) + 1, bottle.stock),
    }))
  }

  function removeFromCart(bottleId: string) {
    setCart((prev) => {
      const next = { ...prev }
      const q = (next[bottleId] ?? 0) - 1
      if (q <= 0) delete next[bottleId]
      else next[bottleId] = q
      return next
    })
  }

  function handlePay() {
    if (cartCount === 0) {
      toast({ title: "Cart is empty", description: "Add bottles to pay." })
      return
    }
    setPaying(true)
    setTimeout(() => {
      cartEntries.forEach(([id, qty]) => {
        const b = bottles.find((x) => x.id === id)
        if (b) updateBottle(id, { stock: Math.max(0, b.stock - qty) })
      })
      setCart({})
      setPaying(false)
      setPaid(true)
      toast({
        title: "Payment complete",
        description: `Total ${formatNumber(cartTotal, { prefix: "$" })}. Your order is on the way (demo).`,
      })
    }, 800)
  }

  if (paid) {
    return (
      <View style={[styles.root, { minHeight: 300, paddingBottom: insets.bottom + 16 }]}>
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top, 12), borderBottomColor: theme.colors.border },
          ]}
        >
          <HapticPressable onPress={onClose} style={styles.headerBack} accessibilityLabel="Close">
            <ArrowLeft size={22} color={theme.colors.foreground} />
          </HapticPressable>
          <View style={styles.headerTitleRow}>
            <Wine size={18} color={theme.colors.neonPink} />
            <Text style={[styles.headerTitle, { color: theme.colors.foreground }]}>Menu</Text>
          </View>
          <View style={styles.headerBack} />
        </View>
        <View style={styles.successWrap}>
          <Text style={[styles.successTitle, { color: theme.colors.foreground }]}>Order placed</Text>
          <Text style={[styles.successSub, { color: theme.colors.mutedForeground }]}>
            Your bottles are on the way. In production this would charge your tab.
          </Text>
          <Button onPress={onClose} style={{ marginTop: 20 }}>
            <Text style={{ color: "#000", fontFamily: "Orbitron_900Black" }}>Done</Text>
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.root, { minHeight: 300, paddingBottom: insets.bottom + 16 }]}>
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 12), borderBottomColor: theme.colors.border },
        ]}
      >
        <HapticPressable onPress={onClose} style={styles.headerBack} accessibilityLabel="Close">
          <ArrowLeft size={22} color={theme.colors.foreground} />
        </HapticPressable>
        <View style={styles.headerTitleRow}>
          <Wine size={18} color={theme.colors.neonPink} />
          <Text style={[styles.headerTitle, { color: theme.colors.foreground }]}>Menu</Text>
        </View>
        <View style={styles.headerBack} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { color: theme.colors.mutedForeground }]}>
          Bottles — add to cart and pay below
        </Text>
        {bottles.map((b) => {
          const qty = cart[b.id] ?? 0
          const canAdd = b.stock > 0 && qty < b.stock
          return (
            <Card
              key={b.id}
              variant="glass"
              style={[
                styles.bottleCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              {/* Image on the left */}
              <View style={styles.bottleImageWrap}>
                {b.imageKey && bottleImages[b.imageKey as BottleImageKey] != null ? (
                  <Image
                    source={bottleImages[b.imageKey as BottleImageKey]}
                    style={styles.bottleImage}
                    contentFit="contain"
                  />
                ) : (
                  <View style={[styles.bottleImagePlaceholder, { backgroundColor: theme.colors.muted }]}>
                    <Wine size={24} color={theme.colors.mutedForeground} />
                  </View>
                )}
              </View>
              {/* Selected part: name, price, quantity controls — to the right of image */}
              <View style={styles.bottleRight}>
                <Text style={[styles.bottleName, { color: theme.colors.foreground }]} numberOfLines={1}>
                  {b.name}
                </Text>
                <Text style={[styles.bottleMeta, { color: theme.colors.mutedForeground }]}>
                  {formatNumber(b.price, { prefix: "$" })} · {b.stock} in stock
                </Text>
                <View style={styles.bottleActions}>
                  <HapticPressable
                    onPress={() => removeFromCart(b.id)}
                    disabled={qty === 0}
                    style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                    accessibilityLabel="Remove one"
                  >
                    <Minus size={18} color={qty === 0 ? theme.colors.mutedForeground : theme.colors.foreground} />
                  </HapticPressable>
                  <Text style={[styles.qtyText, { color: theme.colors.foreground }]}>{qty}</Text>
                  <HapticPressable
                    onPress={() => addToCart(b)}
                    disabled={!canAdd}
                    style={[styles.qtyBtn, !canAdd && styles.qtyBtnDisabled]}
                    accessibilityLabel="Add one"
                  >
                    <Plus size={18} color={canAdd ? theme.colors.neonPink : theme.colors.mutedForeground} />
                  </HapticPressable>
                </View>
              </View>
            </Card>
          )
        })}
        {bottles.length === 0 && (
          <Text style={[styles.empty, { color: theme.colors.mutedForeground }]}>No bottles on the menu.</Text>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        <View style={styles.footerRow}>
          <View style={styles.footerLabel}>
            <ShoppingBag size={18} color={theme.colors.mutedForeground} />
            <Text style={[styles.footerLabelText, { color: theme.colors.mutedForeground }]}>
              {cartCount} item{cartCount !== 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={[styles.footerTotal, { color: theme.colors.foreground }]}>
            {formatNumber(cartTotal, { prefix: "$" })}
          </Text>
        </View>
        <Button
          onPress={handlePay}
          disabled={cartCount === 0 || paying}
          style={styles.payBtn}
        >
          {paying ? (
            <Text style={{ color: "#fff", fontFamily: "Orbitron_900Black" }}>Processing…</Text>
          ) : (
            <Text style={{ color: "#fff", fontFamily: "Orbitron_900Black" }}>Pay {formatNumber(cartTotal, { prefix: "$" })}</Text>
          )}
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Orbitron_900Black",
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 12,
    alignSelf: "stretch",
  },
  bottleCard: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    alignSelf: "center",
    width: "100%",
    maxWidth: 400,
  },
  bottleImageWrap: {
    width: 56,
    marginRight: 12,
  },
  bottleImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  bottleImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bottleRight: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  bottleName: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 15,
    marginBottom: 4,
  },
  bottleMeta: {
    fontSize: 13,
    marginBottom: 10,
  },
  bottleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  qtyText: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 14,
    minWidth: 24,
    textAlign: "center",
  },
  empty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  footerLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerLabelText: {
    fontSize: 14,
  },
  footerTotal: {
    fontFamily: "Orbitron_900Black",
    fontSize: 18,
  },
  payBtn: {
    borderRadius: 14,
  },
  successWrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontFamily: "Orbitron_900Black",
    fontSize: 20,
  },
  successSub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
})
