import { query, internalMutation } from "./_generated/server"
import { v } from "convex/values"

const defaultTemplates = [
  { name: "Netflix", icon: "Tv", color: "#E50914", category: "entertainment", defaultPrice: 15.99, defaultCurrency: "USD" },
  { name: "Disney+", icon: "Play", color: "#113CCF", category: "entertainment", defaultPrice: 7.99, defaultCurrency: "USD" },
  { name: "HBO Max", icon: "Clapperboard", color: "#B535F6", category: "entertainment", defaultPrice: 14.99, defaultCurrency: "USD" },
  { name: "Hulu", icon: "Tv", color: "#1CE783", category: "entertainment", defaultPrice: 12.99, defaultCurrency: "USD" },
  { name: "Prime Video", icon: "Play", color: "#00A8E1", category: "entertainment", defaultPrice: 14.99, defaultCurrency: "USD" },
  { name: "Apple TV+", icon: "Apple", color: "#555555", category: "entertainment", defaultPrice: 6.99, defaultCurrency: "USD" },
  { name: "Peacock", icon: "Feather", color: "#FDB927", category: "entertainment", defaultPrice: 5.99, defaultCurrency: "USD" },
  { name: "Paramount+", icon: "Mountain", color: "#0064FF", category: "entertainment", defaultPrice: 9.99, defaultCurrency: "USD" },
  { name: "Tubi", icon: "Tv", color: "#FA382F", category: "entertainment", defaultPrice: 0, defaultCurrency: "USD" },
  { name: "Crunchyroll", icon: "Play", color: "#F47521", category: "entertainment", defaultPrice: 7.99, defaultCurrency: "USD" },
  { name: "Spotify", icon: "Music", color: "#1DB954", category: "music", defaultPrice: 9.99, defaultCurrency: "USD" },
  { name: "Apple Music", icon: "Music", color: "#FC3C44", category: "music", defaultPrice: 10.99, defaultCurrency: "USD" },
  { name: "YouTube Music", icon: "Youtube", color: "#FF0000", category: "music", defaultPrice: 10.99, defaultCurrency: "USD" },
  { name: "Tidal", icon: "Waves", color: "#000000", category: "music", defaultPrice: 10.99, defaultCurrency: "USD" },
  { name: "SoundCloud", icon: "Cloud", color: "#FF5500", category: "music", defaultPrice: 9.99, defaultCurrency: "USD" },
  { name: "Deezer", icon: "Music", color: "#A238FF", category: "music", defaultPrice: 10.99, defaultCurrency: "USD" },
  { name: "Audible", icon: "Headphones", color: "#F8991D", category: "music", defaultPrice: 14.95, defaultCurrency: "USD" },
  { name: "Microsoft 365", icon: "Monitor", color: "#0078D4", category: "productivity", defaultPrice: 6.99, defaultCurrency: "USD" },
  { name: "Google Workspace", icon: "Briefcase", color: "#4285F4", category: "productivity", defaultPrice: 6.99, defaultCurrency: "USD" },
  { name: "Notion", icon: "FileText", color: "#000000", category: "productivity", defaultPrice: 8.0, defaultCurrency: "USD" },
  { name: "Slack", icon: "Hash", color: "#4A154B", category: "productivity", defaultPrice: 7.25, defaultCurrency: "USD" },
  { name: "Zoom", icon: "Video", color: "#2D8CFF", category: "productivity", defaultPrice: 13.33, defaultCurrency: "USD" },
  { name: "Todoist", icon: "CheckCircle", color: "#E44332", category: "productivity", defaultPrice: 4.0, defaultCurrency: "USD" },
  { name: "1Password", icon: "Lock", color: "#1A8CFF", category: "productivity", defaultPrice: 2.99, defaultCurrency: "USD" },
  { name: "Evernote", icon: "StickyNote", color: "#00A82D", category: "productivity", defaultPrice: 10.99, defaultCurrency: "USD" },
  { name: "iCloud+", icon: "Cloud", color: "#555555", category: "cloud", defaultPrice: 2.99, defaultCurrency: "USD" },
  { name: "Google One", icon: "Cloud", color: "#4285F4", category: "cloud", defaultPrice: 2.99, defaultCurrency: "USD" },
  { name: "Dropbox", icon: "Box", color: "#0061FF", category: "cloud", defaultPrice: 11.99, defaultCurrency: "USD" },
  { name: "OneDrive", icon: "Cloud", color: "#0078D4", category: "cloud", defaultPrice: 1.99, defaultCurrency: "USD" },
  { name: "Xbox Game Pass", icon: "Gamepad2", color: "#107C10", category: "gaming", defaultPrice: 14.99, defaultCurrency: "USD" },
  { name: "PlayStation Plus", icon: "Gamepad2", color: "#003087", category: "gaming", defaultPrice: 9.99, defaultCurrency: "USD" },
  { name: "Nintendo Switch Online", icon: "Gamepad", color: "#E60012", category: "gaming", defaultPrice: 3.99, defaultCurrency: "USD" },
  { name: "EA Play", icon: "Gamepad2", color: "#1A1A1A", category: "gaming", defaultPrice: 4.99, defaultCurrency: "USD" },
  { name: "Apple Arcade", icon: "Gamepad2", color: "#555555", category: "gaming", defaultPrice: 6.99, defaultCurrency: "USD" },
  { name: "GeForce Now", icon: "Monitor", color: "#76B900", category: "gaming", defaultPrice: 9.99, defaultCurrency: "USD" },
  { name: "Duolingo Plus", icon: "GraduationCap", color: "#58CC02", category: "education", defaultPrice: 12.99, defaultCurrency: "USD" },
  { name: "MasterClass", icon: "BookOpen", color: "#000000", category: "education", defaultPrice: 10.0, defaultCurrency: "USD" },
  { name: "Skillshare", icon: "Palette", color: "#00FF84", category: "education", defaultPrice: 13.99, defaultCurrency: "USD" },
  { name: "Coursera", icon: "GraduationCap", color: "#0056D2", category: "education", defaultPrice: 59.0, defaultCurrency: "USD" },
  { name: "LinkedIn Learning", icon: "Briefcase", color: "#0077B5", category: "education", defaultPrice: 29.99, defaultCurrency: "USD" },
  { name: "Peloton", icon: "Bicycle", color: "#E60023", category: "fitness", defaultPrice: 12.99, defaultCurrency: "USD" },
  { name: "Strava", icon: "Footprints", color: "#FC4C02", category: "fitness", defaultPrice: 7.99, defaultCurrency: "USD" },
  { name: "Headspace", icon: "Flower2", color: "#F47D31", category: "fitness", defaultPrice: 12.99, defaultCurrency: "USD" },
  { name: "Calm", icon: "Moon", color: "#3B6E8F", category: "fitness", defaultPrice: 14.99, defaultCurrency: "USD" },
  { name: "MyFitnessPal", icon: "Heart", color: "#0070C0", category: "fitness", defaultPrice: 9.99, defaultCurrency: "USD" },
  { name: "Nike Training Club", icon: "Dumbbell", color: "#111111", category: "fitness", defaultPrice: 14.99, defaultCurrency: "USD" },
  { name: "Adobe Creative Cloud", icon: "Palette", color: "#FF0000", category: "design", defaultPrice: 54.99, defaultCurrency: "USD" },
  { name: "Canva Pro", icon: "Paintbrush", color: "#00C4CC", category: "design", defaultPrice: 12.99, defaultCurrency: "USD" },
  { name: "Figma", icon: "PenTool", color: "#F24E1E", category: "design", defaultPrice: 12.0, defaultCurrency: "USD" },
]

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
