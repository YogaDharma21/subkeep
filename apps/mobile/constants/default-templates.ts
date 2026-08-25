export interface SubscriptionTemplate {
  name: string
  icon: string
  color: string
  category: string
  defaultPrice: number
  defaultCurrency: string
  cancelUrl?: string
}

export const DEFAULT_TEMPLATES: SubscriptionTemplate[] = [
  { name: "Netflix", icon: "Tv", color: "#E50914", category: "entertainment", defaultPrice: 15.99, defaultCurrency: "USD", cancelUrl: "https://www.netflix.com/youraccount" },
  { name: "Disney+", icon: "Play", color: "#113CCF", category: "entertainment", defaultPrice: 7.99, defaultCurrency: "USD", cancelUrl: "https://www.disneyplus.com/account" },
  { name: "HBO Max", icon: "Clapperboard", color: "#B535F6", category: "entertainment", defaultPrice: 14.99, defaultCurrency: "USD", cancelUrl: "https://auth.max.com/account" },
  { name: "Hulu", icon: "Tv", color: "#1CE783", category: "entertainment", defaultPrice: 12.99, defaultCurrency: "USD", cancelUrl: "https://secure.hulu.com/account" },
  { name: "Prime Video", icon: "Play", color: "#00A8E1", category: "entertainment", defaultPrice: 14.99, defaultCurrency: "USD", cancelUrl: "https://www.amazon.com/mc/manage" },
  { name: "Apple TV+", icon: "Apple", color: "#555555", category: "entertainment", defaultPrice: 6.99, defaultCurrency: "USD", cancelUrl: "https://support.apple.com/HT202039" },
  { name: "Peacock", icon: "Feather", color: "#FDB927", category: "entertainment", defaultPrice: 5.99, defaultCurrency: "USD", cancelUrl: "https://www.peacocktv.com/account" },
  { name: "Paramount+", icon: "Mountain", color: "#0064FF", category: "entertainment", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://www.paramountplus.com/account/" },
  { name: "Tubi", icon: "Tv", color: "#FA382F", category: "entertainment", defaultPrice: 0, defaultCurrency: "USD", cancelUrl: "https://tubitv.com/account" },
  { name: "Crunchyroll", icon: "Play", color: "#F47521", category: "entertainment", defaultPrice: 7.99, defaultCurrency: "USD", cancelUrl: "https://www.crunchyroll.com/account/membership" },
  { name: "Spotify", icon: "Music", color: "#1DB954", category: "music", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://www.spotify.com/account/subscription/" },
  { name: "Apple Music", icon: "Music", color: "#FC3C44", category: "music", defaultPrice: 10.99, defaultCurrency: "USD", cancelUrl: "https://support.apple.com/HT202039" },
  { name: "YouTube Music", icon: "Play", color: "#FF0000", category: "music", defaultPrice: 10.99, defaultCurrency: "USD", cancelUrl: "https://www.youtube.com/paid_memberships" },
  { name: "Tidal", icon: "Waves", color: "#000000", category: "music", defaultPrice: 10.99, defaultCurrency: "USD", cancelUrl: "https://account.tidal.com/" },
  { name: "SoundCloud", icon: "Cloud", color: "#FF5500", category: "music", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://soundcloud.com/you/subscriptions" },
  { name: "Deezer", icon: "Music", color: "#A238FF", category: "music", defaultPrice: 10.99, defaultCurrency: "USD", cancelUrl: "https://www.deezer.com/account/subscription" },
  { name: "Audible", icon: "Headphones", color: "#F8991D", category: "music", defaultPrice: 14.95, defaultCurrency: "USD", cancelUrl: "https://www.audible.com/account/overview" },
  { name: "Microsoft 365", icon: "Monitor", color: "#0078D4", category: "productivity", defaultPrice: 6.99, defaultCurrency: "USD", cancelUrl: "https://account.microsoft.com/services" },
  { name: "Google Workspace", icon: "Briefcase", color: "#4285F4", category: "productivity", defaultPrice: 6.99, defaultCurrency: "USD", cancelUrl: "https://admin.google.com/ac/billing/subscriptions" },
  { name: "Notion", icon: "FileText", color: "#000000", category: "productivity", defaultPrice: 8.0, defaultCurrency: "USD", cancelUrl: "https://www.notion.so/settings" },
  { name: "Slack", icon: "Hash", color: "#4A154B", category: "productivity", defaultPrice: 7.25, defaultCurrency: "USD", cancelUrl: "https://slack.com/admin/billing" },
  { name: "Zoom", icon: "Video", color: "#2D8CFF", category: "productivity", defaultPrice: 13.33, defaultCurrency: "USD", cancelUrl: "https://zoom.us/account/billing" },
  { name: "Todoist", icon: "CheckCircle", color: "#E44332", category: "productivity", defaultPrice: 4.0, defaultCurrency: "USD", cancelUrl: "https://todoist.com/app/settings/subscription" },
  { name: "1Password", icon: "Lock", color: "#1A8CFF", category: "productivity", defaultPrice: 2.99, defaultCurrency: "USD", cancelUrl: "https://my.1password.com/profile" },
  { name: "Evernote", icon: "StickyNote", color: "#00A82D", category: "productivity", defaultPrice: 10.99, defaultCurrency: "USD", cancelUrl: "https://www.evernote.com/UserSettings.action" },
  { name: "iCloud+", icon: "Cloud", color: "#555555", category: "cloud", defaultPrice: 2.99, defaultCurrency: "USD", cancelUrl: "https://support.apple.com/HT202039" },
  { name: "Google One", icon: "Cloud", color: "#4285F4", category: "cloud", defaultPrice: 2.99, defaultCurrency: "USD", cancelUrl: "https://one.google.com/settings" },
  { name: "Dropbox", icon: "Box", color: "#0061FF", category: "cloud", defaultPrice: 11.99, defaultCurrency: "USD", cancelUrl: "https://www.dropbox.com/account/plan" },
  { name: "OneDrive", icon: "Cloud", color: "#0078D4", category: "cloud", defaultPrice: 1.99, defaultCurrency: "USD", cancelUrl: "https://account.microsoft.com/services" },
  { name: "Xbox Game Pass", icon: "Gamepad2", color: "#107C10", category: "gaming", defaultPrice: 14.99, defaultCurrency: "USD", cancelUrl: "https://account.microsoft.com/services" },
  { name: "PlayStation Plus", icon: "Gamepad2", color: "#003087", category: "gaming", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://store.playstation.com/subscriptions" },
  { name: "Nintendo Switch Online", icon: "Gamepad", color: "#E60012", category: "gaming", defaultPrice: 3.99, defaultCurrency: "USD", cancelUrl: "https://ec.nintendo.com/membership" },
  { name: "EA Play", icon: "Gamepad2", color: "#1A1A1A", category: "gaming", defaultPrice: 4.99, defaultCurrency: "USD", cancelUrl: "https://myaccount.ea.com/cp-ui/subscription/index" },
  { name: "Apple Arcade", icon: "Gamepad2", color: "#555555", category: "gaming", defaultPrice: 6.99, defaultCurrency: "USD", cancelUrl: "https://support.apple.com/HT202039" },
  { name: "GeForce Now", icon: "Monitor", color: "#76B900", category: "gaming", defaultPrice: 9.99, defaultCurrency: "USD", cancelUrl: "https://www.nvidia.com/en-us/account/gfn/" },
  { name: "Duolingo Plus", icon: "GraduationCap", color: "#58CC02", category: "education", defaultPrice: 12.99, defaultCurrency: "USD", cancelUrl: "https://www.duolingo.com/settings/account" },
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
  { name: "Adobe Creative Cloud", icon: "Palette", color: "#FF0000", category: "productivity", defaultPrice: 54.99, defaultCurrency: "USD", cancelUrl: "https://account.adobe.com/plans" },
  { name: "Canva Pro", icon: "Paintbrush", color: "#00C4CC", category: "productivity", defaultPrice: 12.99, defaultCurrency: "USD", cancelUrl: "https://www.canva.com/settings/billing-and-teams" },
  { name: "Figma", icon: "PenTool", color: "#F24E1E", category: "productivity", defaultPrice: 12.0, defaultCurrency: "USD", cancelUrl: "https://www.figma.com/settings" },
]
