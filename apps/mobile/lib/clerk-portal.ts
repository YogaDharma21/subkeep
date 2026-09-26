const FALLBACK_PUBLISHABLE_KEY =
  "pk_test_ZW5nYWdpbmctbW9sZS0xMC5jbGVyay5hY2NvdW50cy5kZXYk"

function getFrontendApiHost(): string | null {
  const key =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY
  try {
    const parts = key.split("_")
    if (parts.length >= 3) {
      const base64Host = parts[2]
      if (typeof atob !== "undefined") {
        return atob(base64Host).replace(/\$$/, "")
      }
    }
  } catch (e) {
    console.error(e)
  }
  return null
}

export function getClerkPortalUrl(): string {
  const host = getFrontendApiHost()
  return host ? `https://${host}/user` : "https://accounts.clerk.com/user"
}

export function isClerkDevMode(): boolean {
  const key =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY
  return key.startsWith("pk_test_")
}
