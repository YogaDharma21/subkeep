import React from "react"
import ReactDOM from "react-dom/client"
import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { dark } from "@clerk/themes"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"
import { ThemeProvider } from "@/components/theme-provider"
import { App } from "@/App"
import "@/index.css"

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://avid-fox-180.convex.cloud"
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_ZW5nYWdpbmctbW9sZS0xMC5jbGVyay5hY2NvdW50cy5kZXYk"

const convex = new ConvexReactClient(convexUrl)

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Failed to find the root element")
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#f2f1ec",
          colorBackground: "#0d0e10",
          colorInputBackground: "#17181c",
          colorInputText: "#f4f4f2",
          colorText: "#f4f4f2",
          colorTextSecondary: "#8a8c92",
        },
        elements: {
          card: "bg-[#0d0e10] border border-white/10 text-[#f4f4f2] shadow-2xl",
          modalContent: "bg-[#0d0e10] text-[#f4f4f2] border border-white/10",
          headerTitle: "text-[#f4f4f2] font-medium",
          headerSubtitle: "text-[#8a8c92]",
          socialButtonsBlockButton: "bg-[#17181c] border border-white/10 hover:bg-[#1e2025] text-[#f4f4f2]",
          formButtonPrimary: "bg-[#f2f1ec] text-[#0a0a0b] hover:bg-[#f2f1ec]/90",
          footerActionLink: "text-[#f4f4f2] hover:text-[#b9b9b4]",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider defaultTheme="dark" storageKey="subkeep-theme">
          <App />
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>
)
