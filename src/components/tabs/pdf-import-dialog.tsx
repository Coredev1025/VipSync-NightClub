import * as DocumentPicker from "expo-document-picker"
import { AlertCircle, CheckCircle, ExternalLink, FileText, Upload, X } from "lucide-react-native"
import * as React from "react"
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HapticPressable } from "@/components/ui/haptic-pressable"
import { ModalSheet } from "@/components/ui/modal"
import { useTheme } from "@/theme/theme-provider"

interface PdfImportDialogProps {
  open: boolean
  onClose: () => void
  onImportComplete?: (tables: ImportedTable[]) => void
}

export interface ImportedTable {
  id: string
  number: number
  x: number
  y: number
  capacity: number
}

export function PdfImportDialog({ open, onClose, onImportComplete }: PdfImportDialogProps) {
  const { theme } = useTheme()
  const [selectedFile, setSelectedFile] = React.useState<DocumentPicker.DocumentPickerAsset | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [importStatus, setImportStatus] = React.useState<"idle" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [extractedTables, setExtractedTables] = React.useState<ImportedTable[]>([])

  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setIsProcessing(false)
      setImportStatus("idle")
      setErrorMessage(null)
      setExtractedTables([])
    }
  }, [open])

  async function handleViewPdf() {
    if (!selectedFile?.uri) return
    try {
      const canOpen = await Linking.canOpenURL(selectedFile.uri)
      if (canOpen) {
        await Linking.openURL(selectedFile.uri)
      } else {
        Alert.alert("Cannot open PDF", "No app available to open this PDF.")
      }
    } catch {
      Alert.alert("Error", "Could not open PDF.")
    }
  }

  async function handlePickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0])
        setImportStatus("idle")
        setErrorMessage(null)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick PDF file. Please try again.")
      console.error("Document picker error:", error)
    }
  }

  async function handleProcessPdf() {
    if (!selectedFile) return
    setIsProcessing(true)
    setImportStatus("processing")
    setErrorMessage(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      // Real PDF parsing and table extraction should be implemented here.
      // For now, we avoid injecting mock tables that don't exist in the database.
      setExtractedTables([])
      setImportStatus("error")
      setErrorMessage("PDF processing is not available yet. Please contact your admin to import the table map.")
    } catch (error) {
      setImportStatus("error")
      setErrorMessage("Failed to process PDF. Please ensure the file contains valid table map data.")
      console.error("PDF processing error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  function handleConfirmImport() {
    if (extractedTables.length > 0) {
      onImportComplete?.(extractedTables)
      onClose()
    }
  }

  function handleCancel() {
    setSelectedFile(null)
    setExtractedTables([])
    setImportStatus("idle")
    setErrorMessage(null)
  }

  return (
    <ModalSheet open={open} onClose={onClose} maxHeightPct={1}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.neonCyan}22`, borderColor: `${theme.colors.neonCyan}55` }]}>
              <FileText size={24} color={theme.colors.neonCyan} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.foreground }]}>Import Table Map</Text>
              <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>Upload PDF to extract table layout</Text>
            </View>
          </View>
          <HapticPressable onPress={onClose} neonBorder borderColor={`${theme.colors.neonPink}AA`} style={styles.closeBtn}>
            <X size={18} color={theme.colors.foreground} />
          </HapticPressable>
        </View>

        {!selectedFile ? (
          <View style={styles.uploadSection}>
            <Pressable onPress={handlePickDocument} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
              <View style={[styles.uploadButton, { backgroundColor: `${theme.colors.neonCyan}33`, borderWidth: 2.5, borderColor: theme.colors.neonCyan, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 28, alignItems: "center", justifyContent: "center" }]}>
                <View style={styles.rowCenter}>
                  <FileText size={22} color={theme.colors.neonCyan} />
                  <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_700Bold", fontSize: 17 }}>
                    Choose PDF
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.processingSection}>
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Card variant="glass" style={[styles.fileCard, { borderColor: `${theme.colors.neonGreen}44` }]}>
                  <View style={styles.fileInfo}>
                    <View style={[styles.fileIconContainer, { backgroundColor: `${theme.colors.neonGreen}1a` }]}>
                      <FileText size={20} color={theme.colors.neonGreen} />
                    </View>
                    <View style={styles.fileDetails}>
                      <Text style={[styles.fileName, { color: theme.colors.foreground }]} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={[styles.fileSize, { color: theme.colors.mutedForeground }]}>
                        {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Unknown size"}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>

              {importStatus === "idle" && (
                <>
                  <View style={styles.previewSection}>
                    <Text style={[styles.previewSectionTitle, { color: theme.colors.foreground }]}>Preview</Text>
                    <Card variant="glass" style={[styles.previewBox, { borderColor: theme.colors.border }]}>
                      <View style={styles.previewBoxCentered}>
                        <FileText size={40} color={theme.colors.neonCyan} />
                        <Text style={[styles.previewPlaceholder, { color: theme.colors.mutedForeground, marginTop: 12 }]}>
                          {selectedFile?.name ?? "PDF selected"}
                        </Text>
                        <Text style={[styles.previewPlaceholder, { color: theme.colors.mutedForeground, fontSize: 12, marginTop: 4 }]}>
                          {selectedFile?.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ""}
                        </Text>
                        <Button variant="outline" tone="cyan" onPress={handleViewPdf} style={{ marginTop: 16 }}>
                          <View style={styles.rowCenter}>
                            <ExternalLink size={18} color={theme.colors.neonCyan} />
                            <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_600SemiBold" }}>View PDF</Text>
                          </View>
                        </Button>
                      </View>
                    </Card>
                  </View>
                  <View style={styles.actionSection}>
                  <Button variant="solid" tone="cyan" onPress={handleProcessPdf} style={styles.processButton}>
                    <View style={styles.rowCenter}>
                      <Upload size={18} color={theme.colors.background} />
                      <Text style={{ color: theme.colors.background, fontFamily: "Inter_600SemiBold" }}>Process PDF</Text>
                    </View>
                  </Button>
                  <Button variant="outline" tone="neutral" onPress={handleCancel} style={styles.cancelButton}>
                    <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold" }}>Choose Different File</Text>
                  </Button>
                </View>
                </>
              )}

              {importStatus === "processing" && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.statusSection}>
                  <Card variant="glass" style={[styles.statusCard, { borderColor: `${theme.colors.neonCyan}44` }]}>
                    <ActivityIndicator size="large" color={theme.colors.neonCyan} />
                    <Text style={[styles.statusText, { color: theme.colors.foreground }]}>Processing PDF...</Text>
                    <Text style={[styles.statusSubtext, { color: theme.colors.mutedForeground }]}>Extracting table positions and data</Text>
                  </Card>
                </Animated.View>
              )}

              {importStatus === "error" && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.statusSection}>
                  <Card variant="glass" style={[styles.statusCard, { borderColor: `${theme.colors.neonOrange}44` }]}>
                    <AlertCircle size={24} color={theme.colors.neonOrange} />
                    <Text style={[styles.statusText, { color: theme.colors.foreground }]}>Processing Failed</Text>
                    {errorMessage && <Text style={[styles.statusSubtext, { color: theme.colors.mutedForeground }]}>{errorMessage}</Text>}
                    <Button variant="outline" tone="orange" onPress={handleProcessPdf} style={styles.retryButton}>
                      <Text style={{ color: theme.colors.neonOrange, fontFamily: "Inter_600SemiBold" }}>Try Again</Text>
                    </Button>
                  </Card>
                </Animated.View>
              )}

              {importStatus === "success" && extractedTables.length > 0 && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.successSection}>
                  <Card variant="glass" style={[styles.statusCard, { borderColor: `${theme.colors.neonGreen}44` }]}>
                    <CheckCircle size={24} color={theme.colors.neonGreen} />
                    <Text style={[styles.statusText, { color: theme.colors.foreground }]}>Import Successful</Text>
                    <Text style={[styles.statusSubtext, { color: theme.colors.mutedForeground }]}>
                      Found {extractedTables.length} table{extractedTables.length !== 1 ? "s" : ""} in the PDF
                    </Text>
                  </Card>
                  <View style={styles.tablesPreview}>
                    <Text style={[styles.previewTitle, { color: theme.colors.foreground }]}>Extracted Tables</Text>
                    <ScrollView style={styles.tablesList} contentContainerStyle={styles.tablesListContent}>
                      {extractedTables.map((table) => (
                        <Card key={table.id} variant="glass" style={[styles.tablePreviewCard, { borderColor: `${theme.colors.neonCyan}33` }]}>
                          <View style={styles.tablePreviewContent}>
                            <View style={[styles.tableNumberBadge, { borderColor: theme.colors.neonCyan, backgroundColor: `${theme.colors.neonCyan}1a` }]}>
                              <Text style={{ color: theme.colors.neonCyan, fontFamily: "Inter_700Bold", fontSize: 16 }}>{table.number}</Text>
                            </View>
                            <View style={styles.tablePreviewInfo}>
                              <Text style={[styles.tablePreviewText, { color: theme.colors.foreground }]}>Table {table.number}</Text>
                              <Text style={[styles.tablePreviewSubtext, { color: theme.colors.mutedForeground }]}>
                                Position: ({table.x}%, {table.y}%) • Capacity: {table.capacity}
                              </Text>
                            </View>
                          </View>
                        </Card>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.confirmSection}>
                    <Button variant="outline" tone="neutral" onPress={handleCancel} style={styles.cancelButton}>
                      <Text style={{ color: theme.colors.foreground, fontFamily: "Inter_600SemiBold" }}>Cancel</Text>
                    </Button>
                    <Button variant="solid" tone="green" onPress={handleConfirmImport} style={styles.confirmButton}>
                      <View style={styles.rowCenter}>
                        <CheckCircle size={18} color={theme.colors.background} />
                        <Text style={{ color: theme.colors.background, fontFamily: "Inter_600SemiBold" }}>Import Tables</Text>
                      </View>
                    </Button>
                  </View>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </ModalSheet>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingTop: 4,
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  uploadSection: { paddingHorizontal: 4, paddingTop: 0, paddingBottom: 12 },
  uploadButton: { alignSelf: "stretch", minWidth: "100%" },
  processingSection: { gap: 16 },
  fileCard: { padding: 16, borderWidth: 1 },
  fileInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileDetails: { flex: 1, minWidth: 0 },
  fileName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  fileSize: { fontSize: 12, fontFamily: "Inter_400Regular" },
  previewSection: { gap: 10 },
  previewSectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  previewBox: { minHeight: 200, borderRadius: 12, borderWidth: 1 },
  previewBoxCentered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  previewPlaceholder: { fontSize: 14, fontFamily: "Inter_400Regular" },
  actionSection: { gap: 12 },
  processButton: { width: "100%" },
  cancelButton: { width: "100%" },
  statusSection: { marginTop: 8 },
  statusCard: { padding: 20, alignItems: "center", gap: 12, borderWidth: 1 },
  statusText: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  statusSubtext: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  retryButton: { marginTop: 8, width: "100%" },
  successSection: { gap: 16 },
  tablesPreview: { gap: 12 },
  previewTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 8 },
  tablesList: { maxHeight: 300 },
  tablesListContent: { gap: 10 },
  tablePreviewCard: { padding: 12, borderWidth: 1 },
  tablePreviewContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  tableNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tablePreviewInfo: { flex: 1 },
  tablePreviewText: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  tablePreviewSubtext: { fontSize: 12, fontFamily: "Inter_400Regular" },
  confirmSection: { flexDirection: "row", gap: 12, marginTop: 8 },
  confirmButton: { flex: 1 },
  rowCenter: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
})
