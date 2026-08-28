const fallbackAccountPortalUrl = "https://accounts.clerk.com/user"

export function getClerkAccountPortalUrl(): string {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

  try {
    const encodedFrontendApiHost = publishableKey?.split("_")[2]
    if (encodedFrontendApiHost && typeof atob !== "undefined") {
      const frontendApiHost = atob(encodedFrontendApiHost).replace(/\$$/, "")
      return `https://${frontendApiHost}/user`
    }
  } catch {
    // Use Clerk's generic portal URL when the publishable key cannot be decoded.
  }

  return fallbackAccountPortalUrl
}
