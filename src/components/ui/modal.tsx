import { X } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import {
    Dimensions,
    Modal,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useTheme } from "@/theme/theme-provider"

/** Dark-themed alert dialog: cyan border, centered icon/title/message, primary (solid cyan) + secondary (outline) buttons. */
export interface AlertDialogProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  icon?: React.ReactNode
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
}

export function AlertDialog({
  open,
  onClose,
  title,
  message,
  icon,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: AlertDialogProps) {
  const { theme } = useTheme()
  const accentColor = theme.colors.neonCyan

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <View style={alertStyles.backdropWrap}>
        <Pressable style={alertStyles.backdrop} onPress={onClose} />
        <MotiView
          from={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: "timing", duration: 200 }}
          style={[
            alertStyles.dialog,
            {
              backgroundColor: theme.colors.card,
              borderColor: accentColor,
            },
          ]}
        >
          {icon ? <View style={alertStyles.iconWrap}>{icon}</View> : null}
          <Text style={[alertStyles.title, { color: theme.colors.foreground }]}>{title}</Text>
          <Text style={[alertStyles.message, { color: theme.colors.foreground }]}>{message}</Text>
          <View style={alertStyles.actions}>
            <Pressable
              onPress={() => {
                onSecondary()
                onClose()
              }}
              style={({ pressed }) => [
                alertStyles.btn,
                alertStyles.btnSecondary,
                { borderColor: accentColor, opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
            >
              <Text style={[alertStyles.btnTextSecondary, { color: theme.colors.foreground }]}>{secondaryLabel}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onPrimary()
                onClose()
              }}
              style={({ pressed }) => [
                alertStyles.btn,
                alertStyles.btnPrimary,
                { backgroundColor: accentColor, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
            >
              <Text style={[alertStyles.btnTextPrimary, { color: theme.colors.background }]}>{primaryLabel}</Text>
            </Pressable>
          </View>
        </MotiView>
      </View>
    </Modal>
  )
}

const alertStyles = StyleSheet.create({
  backdropWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  iconWrap: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondary: {
    borderWidth: 1,
  },
  btnPrimary: {},
  btnTextSecondary: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 13,
    textTransform: "uppercase",
  },
  btnTextPrimary: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 13,
    textTransform: "uppercase",
  },
})

const HEADER_HEIGHT = 56

export interface ModalSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxHeightPct?: number // 0..1
  /** When true, shows a header with close button. Defaults to true when full screen (maxHeightPct === 1). */
  showHeader?: boolean
  /** Optional title shown in the header when showHeader is true. */
  title?: string
  style?: StyleProp<ViewStyle>
}

export function ModalSheet({
  open,
  onClose,
  children,
  maxHeightPct = 1,
  showHeader = maxHeightPct >= 1,
  title,
  style,
}: ModalSheetProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const windowHeight = Dimensions.get("window").height
  const headerSpace = Math.max(insets.top, 0) + HEADER_HEIGHT
  const isFullScreen = maxHeightPct >= 1
  const sheetHeight = isFullScreen ? windowHeight - headerSpace : `${Math.round(maxHeightPct * 100)}%`

  return (
    <Modal transparent visible={open} animationType="none" onRequestClose={onClose}>
      <View style={[styles.backdropWrap, isFullScreen && { paddingTop: headerSpace }]}>
        <Pressable
          style={[styles.backdrop, isFullScreen && { top: headerSpace, height: windowHeight - headerSpace }]}
          onPress={onClose}
        />
        <MotiView
          from={{ translateY: 40, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 40, opacity: 0 }}
          transition={{ type: "timing", duration: 220 }}
          style={[
            styles.sheet,
            {
              height: sheetHeight as any,
              maxHeight: sheetHeight as any,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
            style,
          ]}
        >
          <View style={styles.handle} />
          {showHeader ? (
            <View style={[styles.headerRow, { borderColor: theme.colors.border }]}>
              {title ? (
                <Text style={[styles.headerTitle, { color: theme.colors.foreground }]} numberOfLines={1}>
                  {title}
                </Text>
              ) : (
                <View style={styles.headerSpacer} />
              )}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeBtn, { backgroundColor: theme.colors.muted }, pressed && styles.closeBtnPressed]}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={18} color={theme.colors.foreground} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </MotiView>
      </View>
    </Modal>
  )
}

export interface ModalCardProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function ModalCard({ open, onClose, children, style }: ModalCardProps) {
  const { theme } = useTheme()
  return (
    <Modal transparent visible={open} animationType="none" onRequestClose={onClose}>
      <View style={styles.backdropWrap}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <MotiView
          from={{ scale: 0.97, opacity: 0, translateY: 8 }}
          animate={{ scale: 1, opacity: 1, translateY: 0 }}
          exit={{ scale: 0.97, opacity: 0, translateY: 8 }}
          transition={{ type: "timing", duration: 180 }}
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            style,
          ]}
        >
          {children}
        </MotiView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdropWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingBottom: 16,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginRight: 12,
  },
  headerSpacer: {
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnPressed: {
    opacity: 0.8,
  },
  card: {
    alignSelf: "center",
    marginBottom: 140,
    width: "92%",
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
})

