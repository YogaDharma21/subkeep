import { createContext, useContext } from "react"

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

export interface AccountEditing {
  _id: string
  name: string
  type: string
  balance: number
  currency: string
  icon: string
  color: string
  last4?: string
}

interface GlobalUiContextType {
  showAlert: (options: AlertOptions | string, message?: string, buttons?: AlertButton[]) => void
  showToast: (message: string, type?: "success" | "error" | "info") => void
  showAboutModal: () => void
  showSearchModal: () => void
  showAddTransaction: () => void
  showAddSubscription: () => void
  showAddAccount: (editing?: AccountEditing | null) => void
  showAddBudget: () => void
}

export const GlobalUiContext = createContext<GlobalUiContextType | null>(null)

export function useAlert() {
  const context = useContext(GlobalUiContext)
  if (!context) {
    throw new Error("useAlert must be used within a CustomAlertProvider")
  }
  return context
}
