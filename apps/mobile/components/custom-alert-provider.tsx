import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Code2,
  X,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { SearchModal } from "@/components/command-palette"

export interface AlertButton {
  text: string
  style?: "default" | "cancel" | "destructive"
  onPress?: () => void
}

export interface AlertOptions {
  title: string
  message?: string
  buttons?: AlertButton[]
  icon?: "info" | "warning" | "error" | "success"
}

export interface ToastOptions {
  message: string
  type?: "success" | "error" | "info"
}

interface AlertContextType {
  showAlert: (options: AlertOptions | string, message?: string, buttons?: AlertButton[]) => void
  showToast: (message: string, type?: "success" | "error" | "info") => void
  showAboutModal: () => void
  showSearchModal: () => void
}

const AlertContext = createContext<AlertContextType | null>(null)

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error("useAlert must be used within a CustomAlertProvider")
  }
  return context
}

export function CustomAlertProvider({ children }: { children: ReactNode }) {
  const { colors } = useThemeColor()

  // Alert State
  const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null)

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // About Modal State
  const [aboutModalOpen, setAboutModalOpen] = useState(false)

  // Search Modal State
  const [searchModalOpen, setSearchModalOpen] = useState(false)

  const showAlert = useCallback(
    (options: AlertOptions | string, message?: string, buttons?: AlertButton[]) => {
      if (typeof options === "string") {
        setAlertConfig({
          title: options,
          message: message || "",
          buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK", style: "default" }],
        })
      } else {
        setAlertConfig(options)
      }
    },
    []
  )

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ message, type })
    setTimeout(() => {
      setToastMessage((prev) => (prev?.message === message ? null : prev))
    }, 2800)
  }, [])

  const showAboutModal = useCallback(() => {
    setAboutModalOpen(true)
  }, [])

  const showSearchModal = useCallback(() => {
    setSearchModalOpen(true)
  }, [])

  const closeAlert = () => {
    setAlertConfig(null)
  }

  const renderAlertIcon = () => {
    if (!alertConfig) return null
    if (alertConfig.icon === "warning") {
      return (
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(245, 158, 11, 0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <AlertTriangle size={24} color={colors.amber} />
        </View>
      )
    }
    if (alertConfig.icon === "error") {
      return (
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(239, 68, 68, 0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <XCircle size={24} color={colors.destructive} />
        </View>
      )
    }
    if (alertConfig.icon === "success") {
      return (
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(16, 185, 129, 0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <CheckCircle2 size={24} color={colors.emerald} />
        </View>
      )
    }
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHover, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Info size={24} color={colors.primary} />
      </View>
    )
  }

  return (
    <AlertContext.Provider value={{ showAlert, showToast, showAboutModal, showSearchModal }}>
      {children}

      {/* Custom Global Toast */}
      {toastMessage && (
        <SafeAreaView
          edges={["top"]}
          style={{
            position: "absolute",
            top: 10,
            left: 16,
            right: 16,
            zIndex: 9999,
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor:
                toastMessage.type === "error"
                  ? colors.destructive
                  : toastMessage.type === "success"
                  ? colors.emerald
                  : colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            {toastMessage.type === "error" ? (
              <XCircle size={16} color={colors.destructive} />
            ) : toastMessage.type === "success" ? (
              <CheckCircle2 size={16} color={colors.emerald} />
            ) : (
              <Info size={16} color={colors.primary} />
            )}
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
              {toastMessage.message}
            </Text>
          </View>
        </SafeAreaView>
      )}

      {/* Custom Alert / Confirmation Dialog */}
      {alertConfig && (
        <Modal
          visible={!!alertConfig}
          transparent={true}
          animationType="fade"
          onRequestClose={closeAlert}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 340,
                backgroundColor: colors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 20,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.35,
                shadowRadius: 20,
                elevation: 12,
              }}
            >
              {renderAlertIcon()}

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: alertConfig.message ? 8 : 16,
                }}
              >
                {alertConfig.title}
              </Text>

              {alertConfig.message ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.mutedText,
                    textAlign: "center",
                    lineHeight: 18,
                    marginBottom: 20,
                  }}
                >
                  {alertConfig.message}
                </Text>
              ) : null}

              {/* Action Buttons */}
              <View
                style={{
                  width: "100%",
                  flexDirection:
                    alertConfig.buttons && alertConfig.buttons.length > 2
                      ? "column"
                      : "row",
                  gap: 10,
                }}
              >
                {(alertConfig.buttons && alertConfig.buttons.length > 0
                  ? alertConfig.buttons
                  : ([{ text: "OK", style: "default" }] as AlertButton[])
                ).map((btn, index) => {
                  const isCancel = btn.style === "cancel"
                  const isDestructive = btn.style === "destructive"

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={() => {
                        closeAlert()
                        btn.onPress?.()
                      }}
                      style={{
                        flex: alertConfig.buttons && alertConfig.buttons.length > 2 ? undefined : 1,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDestructive
                          ? colors.destructive
                          : isCancel
                          ? colors.surface
                          : colors.primary,
                        borderWidth: isCancel ? 1 : 0,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: isDestructive || !isCancel
                            ? "#ffffff"
                            : colors.text,
                        }}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Custom About SubKeep Modal */}
      <Modal
        visible={aboutModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAboutModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              backgroundColor: colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 22,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            {/* Top Close Button */}
            <TouchableOpacity
              onPress={() => setAboutModalOpen(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={colors.mutedText} />
            </TouchableOpacity>

            {/* App Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
                marginBottom: 12,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
              }}
            >
              <Sparkles size={32} color="#ffffff" />
            </View>

            <Text style={{ fontSize: 19, fontWeight: "900", color: colors.text }}>
              SubKeep
            </Text>

            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                marginTop: 4,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                v0.0.1 (Mobile)
              </Text>
            </View>

            <Text
              style={{
                fontSize: 13,
                color: colors.mutedText,
                textAlign: "center",
                lineHeight: 18,
                marginBottom: 16,
              }}
            >
              Sleek & modern multi-currency subscription tracker with intelligent budget insights and SplitKeep tracking.
            </Text>

            {/* Feature Badges */}
            <View style={{ width: "100%", gap: 8, marginBottom: 18 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: colors.surface,
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Layers size={16} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                  Real-Time Multi-Currency Engine
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: colors.surface,
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Shield size={16} color={colors.emerald} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                  Encrypted Card Vault & Expiration Alerts
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ width: "100%", gap: 8 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL("https://github.com/YogaDharma21/subkeep")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Code2 size={16} color={colors.text} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  View on GitHub
                </Text>
                <ExternalLink size={14} color={colors.mutedText} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAboutModalOpen(false)}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global Search Modal */}
      <SearchModal
        visible={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </AlertContext.Provider>
  )
}
