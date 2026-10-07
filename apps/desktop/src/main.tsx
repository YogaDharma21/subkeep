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
          colorPrimary: "#A855F7",
          colorBackground: "#090A0F",
          colorInputBackground: "#11121C",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#94A3B8",
        },
        elements: {
          card: "bg-[#11121C] border border-white/10 text-white shadow-2xl rounded-2xl",
          modalContent: "bg-[#11121C] text-white border border-white/10 rounded-3xl",
          headerTitle: "text-white font-bold",
          headerSubtitle: "text-zinc-400",
          socialButtonsBlockButton: "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-white rounded-full",
          formButtonPrimary: "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-full",
          footerActionLink: "text-violet-400 hover:text-violet-300",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider defaultTheme="system" storageKey="subkeep-theme">
          <App />
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>
)
