import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"

const defaultTemplates = [
  {
    name: "Netflix",
    icon: "Tv",
    color: "#E50914",
    category: "entertainment",
    defaultPrice: 15.99,
    defaultCurrency: "USD",
    cancelUrl: "https://www.netflix.com/youraccount",
    cancellationSteps: [
      "Sign in to your Netflix account and open Account settings.",
      "Under Membership & Billing, click Cancel Membership.",
      "Click Finish Cancellation to confirm your cancellation.",
      "Access continues until the end of your current billing period.",
    ],
  },
  {
    name: "Disney+",
    icon: "Play",
    color: "#113CCF",
    category: "entertainment",
    defaultPrice: 7.99,
    defaultCurrency: "USD",
    cancelUrl: "https://www.disneyplus.com/account",
    cancellationSteps: [
      "Log in to your Disney+ account in a web browser.",
      "Select your profile icon and click Account.",
      "Under Subscription, select your Disney+ subscription plan.",
      "Click Cancel Subscription, choose a cancellation reason, and confirm.",
    ],
  },
  { name: "HBO Max", icon: "Clapperboard", color: "#B535F6", category: "entertainment", defaultPrice: 14.99, defaultCurrency: "USD", cancelUrl: "https://auth.max.com/account" },
  { name: "Hulu", icon: "Tv", color: "#1CE783", category: "entertainment", defaultPrice: 12.99, defaultCurrency: "USD", cancelUrl: "https://secure.hulu.com/account" },
  {
    name: "Prime Video",
    icon: "Play",
    color: "#00A8E1",
    category: "entertainment",
    defaultPrice: 14.99,
    defaultCurrency: "USD",
    cancelUrl: "https://www.amazon.com/mc/manage",
    cancellationSteps: [
      "Go to Amazon Account and open Memberships & Subscriptions.",
      "Find Prime Video or Amazon Prime and select Manage Membership.",
      "Click End Membership and benefits.",
      "Follow the prompts and confirm cancellation on the final screen.",
    ],
  },
  { name: "Apple TV+", icon: "Apple", color: "#555555", category: "entertainment", defaultPrice: 6.99, defaultCurrency: "USD", cancelUrl: "https://support.apple.com/HT202039" },
  { name: "Peacock", icon: "Feather", color: "#FDB927", category: "entertainment", defaultPrice: 5.99, defaultCurrency: "USD", cancelUrl: "https://www.peacocktv.com/account" },
  { name: "Paramount+", icon: "Mountain", color: "#0064FF", category: "entertainment", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://www.paramountplus.com/account/" },
  { name: "Tubi", icon: "Tv", color: "#FA382F", category: "entertainment", defaultPrice: 0, defaultCurrency: "USD", cancelUrl: "https://tubitv.com/account" },
  { name: "Crunchyroll", icon: "Play", color: "#F47521", category: "entertainment", defaultPrice: 7.99, defaultCurrency: "USD", cancelUrl: "https://www.crunchyroll.com/account/membership" },
  {
    name: "Spotify",
    icon: "Music",
    color: "#1DB954",
    category: "music",
    defaultPrice: 9.99,
    defaultCurrency: "USD",
    cancelUrl: "https://www.spotify.com/account/subscription/",
    cancellationSteps: [
      "Sign in to spotify.com/account in your web browser.",
      "Under Your plan, click Change plan.",
      "Scroll to Spotify Free and click Cancel Premium.",
      "Continue through the prompts until you reach the final confirmation page.",
    ],
  },
  {
    name: "Apple Music",
    icon: "Music",
    color: "#FC3C44",
    category: "music",
    defaultPrice: 10.99,
    defaultCurrency: "USD",
    cancelUrl: "https://support.apple.com/HT202039",
    cancellationSteps: [
      "Open Settings on your Apple device and tap your name, or open the Music app.",
      "Tap Subscriptions to view your active services.",
      "Select Apple Music from the list.",
      "Tap Cancel Subscription and confirm.",
    ],
  },
  {
    name: "YouTube Music",
    icon: "Youtube",
    color: "#FF0000",
    category: "music",
    defaultPrice: 10.99,
    defaultCurrency: "USD",
    cancelUrl: "https://www.youtube.com/paid_memberships",
    cancellationSteps: [
      "Go to youtube.com/paid_memberships and sign in with your Google account.",
      "Find YouTube Music Premium and click Manage membership.",
      "Click Deactivate, then select Continue to cancel.",
      "Choose a cancellation reason and click Next to confirm.",
    ],
  },
  { name: "Tidal", icon: "Waves", color: "#000000", category: "music", defaultPrice: 10.99, defaultCurrency: "USD", cancelUrl: "https://account.tidal.com/" },
  { name: "SoundCloud", icon: "Cloud", color: "#FF5500", category: "music", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://soundcloud.com/you/subscriptions" },
  { name: "Deezer", icon: "Music", color: "#A238FF", category: "music", defaultPrice: 10.99, defaultCurrency: "USD", cancelUrl: "https://www.deezer.com/account/subscription" },
  { name: "Audible", icon: "Headphones", color: "#F8991D", category: "music", defaultPrice: 14.95, defaultCurrency: "USD", cancelUrl: "https://www.audible.com/account/overview" },
  {
    name: "Microsoft 365",
    icon: "Monitor",
    color: "#0078D4",
    category: "productivity",
    defaultPrice: 6.99,
    defaultCurrency: "USD",
    cancelUrl: "https://account.microsoft.com/services",
    cancellationSteps: [
      "Sign in to account.microsoft.com/services with your Microsoft account.",
      "Locate Microsoft 365 and select Manage.",
      "Click Cancel subscription or Turn off recurring billing.",
      "Follow the on-screen instructions to finalize cancellation.",
    ],
  },
  { name: "Google Workspace", icon: "Briefcase", color: "#4285F4", category: "productivity", defaultPrice: 6.99, defaultCurrency: "USD", cancelUrl: "https://admin.google.com/ac/billing/subscriptions" },
  {
    name: "Notion",
    icon: "FileText",
    color: "#000000",
    category: "productivity",
    defaultPrice: 8.0,
    defaultCurrency: "USD",
    cancelUrl: "https://www.notion.so/settings",
    cancellationSteps: [
      "Open Notion on desktop or web and click Settings & members in the sidebar.",
      "Under Workspace, select Billing.",
      "Click Change plan or Downgrade to Free.",
      "Review the downgrade details and confirm.",
    ],
  },
  {
    name: "Slack",
    icon: "Hash",
    color: "#4A154B",
    category: "productivity",
    defaultPrice: 7.25,
    defaultCurrency: "USD",
    cancelUrl: "https://slack.com/admin/billing",
    cancellationSteps: [
      "Sign in to your Slack workspace and go to your admin billing page.",
      "Click Settings & administration, then choose Workspace settings > Billing.",
      "Select Change Plan and choose Downgrade to Free.",
      "Confirm downgrade before the next billing cycle.",
    ],
  },
  { name: "Zoom", icon: "Video", color: "#2D8CFF", category: "productivity", defaultPrice: 13.33, defaultCurrency: "USD", cancelUrl: "https://zoom.us/account/billing" },
  { name: "Todoist", icon: "CheckCircle", color: "#E44332", category: "productivity", defaultPrice: 4.0, defaultCurrency: "USD", cancelUrl: "https://todoist.com/app/settings/subscription" },
  { name: "1Password", icon: "Lock", color: "#1A8CFF", category: "productivity", defaultPrice: 2.99, defaultCurrency: "USD", cancelUrl: "https://my.1password.com/profile" },
  { name: "Evernote", icon: "StickyNote", color: "#00A82D", category: "productivity", defaultPrice: 10.99, defaultCurrency: "USD", cancelUrl: "https://www.evernote.com/UserSettings.action" },
  { name: "iCloud+", icon: "Cloud", color: "#555555", category: "cloud", defaultPrice: 2.99, defaultCurrency: "USD", cancelUrl: "https://support.apple.com/HT202039" },
  {
    name: "Google One",
    icon: "Cloud",
    color: "#4285F4",
    category: "cloud",
    defaultPrice: 2.99,
    defaultCurrency: "USD",
    cancelUrl: "https://one.google.com/settings",
    cancellationSteps: [
      "Sign in to one.google.com/settings.",
      "Scroll to Cancel membership and click Cancel membership.",
      "Review the storage limits change and click Cancel membership again.",
      "Your plan remains active until the end of the current billing cycle.",
    ],
  },
  {
    name: "Dropbox",
    icon: "Box",
    color: "#0061FF",
    category: "cloud",
    defaultPrice: 11.99,
    defaultCurrency: "USD",
    cancelUrl: "https://www.dropbox.com/account/plan",
    cancellationSteps: [
      "Sign in to dropbox.com and go to your account plan page.",
      "Scroll to Cancel plan or Manage plan.",
      "Select Cancel plan, pick a reason, and click Continue canceling.",
      "Confirm downgrade to Dropbox Basic.",
    ],
  },
  { name: "OneDrive", icon: "Cloud", color: "#0078D4", category: "cloud", defaultPrice: 1.99, defaultCurrency: "USD", cancelUrl: "https://account.microsoft.com/services" },
  {
    name: "Xbox Game Pass",
    icon: "Gamepad2",
    color: "#107C10",
    category: "gaming",
    defaultPrice: 14.99,
    defaultCurrency: "USD",
    cancelUrl: "https://account.microsoft.com/services",
    cancellationSteps: [
      "Sign in to account.microsoft.com/services.",
      "Find Xbox Game Pass and click Manage.",
      "Select Cancel subscription or Turn off recurring billing.",
      "Confirm cancellation to stop upcoming renewals.",
    ],
  },
  {
    name: "PlayStation Plus",
    icon: "Gamepad2",
    color: "#003087",
    category: "gaming",
    defaultPrice: 9.99,
    defaultCurrency: "USD",
    cancelUrl: "https://store.playstation.com/subscriptions",
    cancellationSteps: [
      "Sign in to store.playstation.com and select Subscriptions Management.",
      "Find PlayStation Plus in your active subscriptions.",
      "Select Turn Off Auto-Renew or Cancel Subscription.",
      "Confirm to keep benefits until your current expiration date.",
    ],
  },
  { name: "Nintendo Switch Online", icon: "Gamepad", color: "#E60012", category: "gaming", defaultPrice: 3.99, defaultCurrency: "USD", cancelUrl: "https://ec.nintendo.com/membership" },
  { name: "EA Play", icon: "Gamepad2", color: "#1A1A1A", category: "gaming", defaultPrice: 4.99, defaultCurrency: "USD", cancelUrl: "https://myaccount.ea.com/cp-ui/subscription/index" },
  { name: "Apple Arcade", icon: "Gamepad2", color: "#555555", category: "gaming", defaultPrice: 6.99, defaultCurrency: "USD", cancelUrl: "https://support.apple.com/HT202039" },
  { name: "GeForce Now", icon: "Monitor", color: "#76B900", category: "gaming", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://www.nvidia.com/en-us/account/gfn/" },
  {
    name: "Duolingo Plus",
    icon: "GraduationCap",
    color: "#58CC02",
    category: "education",
    defaultPrice: 12.99,
    defaultCurrency: "USD",
    cancelUrl: "https://www.duolingo.com/settings/account",
    cancellationSteps: [
      "Sign in to your Duolingo account in a browser or open the app.",
      "Go to Settings > Super Duolingo or Duolingo Plus.",
      "Select Manage Subscription and click Cancel Subscription.",
      "Confirm cancellation through Duolingo or your device app store.",
    ],
  },
  { name: "MasterClass", icon: "BookOpen", color: "#000000", category: "education", defaultPrice: 10.0, defaultCurrency: "USD", cancelUrl: "https://www.masterclass.com/account/settings" },
  { name: "Skillshare", icon: "Palette", color: "#00FF84", category: "education", defaultPrice: 13.99, defaultCurrency: "USD", cancelUrl: "https://www.skillshare.com/settings/payments" },
  { name: "Coursera", icon: "GraduationCap", color: "#0056D2", category: "education", defaultPrice: 59.0, defaultCurrency: "USD", cancelUrl: "https://www.coursera.org/user-preferences/purchases" },
  { name: "LinkedIn Learning", icon: "Briefcase", color: "#0077B5", category: "education", defaultPrice: 29.99, defaultCurrency: "USD", cancelUrl: "https://www.linkedin.com/premium/manage" },
  { name: "Peloton", icon: "Bicycle", color: "#E60023", category: "fitness", defaultPrice: 12.99, defaultCurrency: "USD", cancelUrl: "https://members.onepeloton.com/preferences/subscriptions" },
  { name: "Strava", icon: "Footprints", color: "#FC4C02", category: "fitness", defaultPrice: 7.99, defaultCurrency: "USD", cancelUrl: "https://www.strava.com/settings/billing" },
  { name: "Headspace", icon: "Flower2", color: "#F47D31", category: "fitness", defaultPrice: 12.99, defaultCurrency: "USD", cancelUrl: "https://www.headspace.com/subscription/manage" },
  { name: "Calm", icon: "Moon", color: "#3B6E8F", category: "fitness", defaultPrice: 14.99, defaultCurrency: "USD", cancelUrl: "https://www.calm.com/profile" },
  { name: "MyFitnessPal", icon: "Heart", color: "#0070C0", category: "fitness", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://www.myfitnesspal.com/account/subscription" },
  { name: "Nike Training Club", icon: "Dumbbell", color: "#111111", category: "fitness", defaultPrice: 14.99, defaultCurrency: "USD", cancelUrl: "https://www.nike.com/member/profile" },
  {
    name: "Adobe Creative Cloud",
    icon: "Palette",
    color: "#FF0000",
    category: "design",
    defaultPrice: 54.99,
    defaultCurrency: "USD",
    cancelUrl: "https://account.adobe.com/plans",
    cancellationSteps: [
      "Sign in to account.adobe.com/plans.",
      "Find your Creative Cloud plan and click Manage plan.",
      "Select Cancel your plan or End service.",
      "Choose your cancellation reason, decline promotional offers, and confirm cancellation.",
    ],
  },
  {
    name: "Canva Pro",
    icon: "Paintbrush",
    color: "#00C4CC",
    category: "design",
    defaultPrice: 12.99,
    defaultCurrency: "USD",
    cancelUrl: "https://www.canva.com/settings/billing-and-teams",
    cancellationSteps: [
      "Log in to Canva and open Account Settings > Billing & teams.",
      "Under Subscriptions, find Canva Pro and click the three dots or Cancel plan.",
      "Select Cancel subscription and choose a cancellation reason.",
      "Confirm cancellation to revert to Canva Free at the end of the cycle.",
    ],
  },
  {
    name: "Figma",
    icon: "PenTool",
    color: "#F24E1E",
    category: "design",
    defaultPrice: 12.0,
    defaultCurrency: "USD",
    cancelUrl: "https://www.figma.com/settings",
    cancellationSteps: [
      "Sign in to Figma and open your workspace settings.",
      "Go to Plan & billing for your team.",
      "Click Cancel plan or Downgrade to Starter.",
      "Confirm downgrade to finalize cancellation.",
    ],
  },
]

export const GENERIC_CANCELLATION_STEPS: string[] = [
  "Sign in to your account on the provider's website or app.",
  "Navigate to Account, Billing, or Subscription settings.",
  "Locate your active plan and select Cancel Subscription or Turn Off Auto-Renew.",
  "Follow the confirmation prompts and save your cancellation receipt or confirmation email.",
]

export interface CancellationGuide {
  cancelUrl?: string
  steps: string[]
  isGeneric: boolean
}

export function getCancellationGuide(
  name?: string,
  customCancelUrl?: string,
): CancellationGuide {
  const trimmedName = name?.trim()
  const customUrl = customCancelUrl?.trim() || undefined

  if (trimmedName) {
    const lowerName = trimmedName.toLowerCase()
    const matchedTemplate =
      defaultTemplates.find((t) => t.name.toLowerCase() === lowerName) ||
      defaultTemplates.find((t) => lowerName.includes(t.name.toLowerCase())) ||
      (lowerName.length >= 3
        ? defaultTemplates.find((t) => t.name.toLowerCase().includes(lowerName))
        : undefined)

    if (matchedTemplate?.cancellationSteps && matchedTemplate.cancellationSteps.length > 0) {
      return {
        cancelUrl: customUrl || matchedTemplate.cancelUrl,
        steps: matchedTemplate.cancellationSteps,
        isGeneric: false,
      }
    }
  }

  return {
    cancelUrl: customUrl,
    steps: GENERIC_CANCELLATION_STEPS,
    isGeneric: true,
  }
}

export const list = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category && args.category !== "all") {
      return await ctx.db
        .query("templates")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect()
    }
    return await ctx.db.query("templates").collect()
  },
})

export const search = query({
  args: { search: v.string(), category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let templates
    if (args.category && args.category !== "all") {
      templates = await ctx.db
        .query("templates")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect()
    } else {
      templates = await ctx.db.query("templates").collect()
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      return templates.filter((t) =>
        t.name.toLowerCase().includes(searchLower)
      )
    }
    return templates
  },
})

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("templates").collect()
    if (existing.length >= defaultTemplates.length) return "already_seeded"
    for (const t of existing) {
      await ctx.db.delete(t._id)
    }
    for (const template of defaultTemplates) {
      await ctx.db.insert("templates", template)
    }
    return "seeded"
  },
})

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("templates").collect()
    if (existing.length >= defaultTemplates.length) return "already_seeded"
    for (const t of existing) {
      await ctx.db.delete(t._id)
    }
    for (const template of defaultTemplates) {
      await ctx.db.insert("templates", template)
    }
    return "seeded"
  },
})
