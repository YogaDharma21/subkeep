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
          colorPrimary: "#ffffff",
          colorBackground: "#09090b",
          colorInputBackground: "#18181b",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#a1a1aa",
        },
        elements: {
          card: "bg-zinc-950 border border-zinc-800 text-white shadow-2xl",
          modalContent: "bg-zinc-950 text-white border border-zinc-800",
          headerTitle: "text-white font-bold",
          headerSubtitle: "text-zinc-400",
          socialButtonsBlockButton: "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white",
          formButtonPrimary: "bg-white text-black hover:bg-zinc-200",
          footerActionLink: "text-white hover:text-zinc-300",
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
