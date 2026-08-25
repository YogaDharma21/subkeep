export interface CsvSubscriptionRow {
  name: string
  price: number
  currency: string
  cycle: string
  category: string
  startDate: string
  nextBilling: string
  endDate?: string
  account?: string
  website?: string
  isActive: boolean
  isTrial?: boolean
  trialEndDate?: string
  cancelUrl?: string
  reminderDays?: number
  isShared?: boolean
  totalPlanPrice?: number
  totalMembers?: number
  icon?: string
  color?: string
}

export function exportSubscriptionsToCSV(subscriptions: Record<string, unknown>[]): string {
  const headers = [
    "Name",
    "Price",
    "Currency",
    "Billing Cycle",
    "Category",
    "Start Date",
    "Next Billing",
    "End Date",
    "Account / Email",
    "Website",
    "Is Active",
    "Is Trial",
    "Trial End Date",
    "Cancellation URL",
    "Is Shared",
    "Total Plan Price",
    "Total Members",
    "Icon",
    "Color",
  ]

  const rows = subscriptions.map((s) => [
    escapeCsvValue(String(s.name || "")),
    escapeCsvValue(String(s.price ?? 0)),
    escapeCsvValue(String(s.currency || "USD")),
    escapeCsvValue(String(s.cycle || "monthly")),
    escapeCsvValue(String(s.category || "other")),
    escapeCsvValue(String(s.startDate || "")),
    escapeCsvValue(String(s.nextBilling || "")),
    escapeCsvValue(String(s.endDate || "")),
    escapeCsvValue(String(s.account || "")),
    escapeCsvValue(String(s.website || "")),
    s.isActive === false ? "false" : "true",
    s.isTrial ? "true" : "false",
    escapeCsvValue(String(s.trialEndDate || "")),
    escapeCsvValue(String(s.cancelUrl || "")),
    s.isShared ? "true" : "false",
    escapeCsvValue(String(s.totalPlanPrice || "")),
    escapeCsvValue(String(s.totalMembers || "")),
    escapeCsvValue(String(s.icon || "Receipt")),
    escapeCsvValue(String(s.color || "#000000")),
  ])

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
}

function escapeCsvValue(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export function parseCSVToSubscriptions(csvText: string): CsvSubscriptionRow[] {
  const lines = parseCSVRows(csvText)
  if (lines.length < 2) return []

  const headerRow = lines[0].map((h) => h.trim().toLowerCase())
  const results: CsvSubscriptionRow[] = []

  const getCol = (row: string[], ...names: string[]) => {
    for (const name of names) {
      const idx = headerRow.findIndex((h) => h.includes(name))
      if (idx !== -1 && row[idx] !== undefined) {
        return row[idx].trim()
      }
    }
    return ""
  }

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    if (row.length === 0 || row.every((c) => !c.trim())) continue

    const name = getCol(row, "name", "service", "title")
    if (!name) continue

    const priceRaw = getCol(row, "price", "amount", "cost")
    const price = parseFloat(priceRaw.replace(/[^0-9.-]+/g, "")) || 0
    const currency = (getCol(row, "currency", "curr") || "USD").toUpperCase()
    const cycle = (getCol(row, "billing cycle", "cycle", "frequency") || "monthly").toLowerCase()
    const category = (getCol(row, "category") || "other").toLowerCase()
    const startDate = getCol(row, "start date", "start") || new Date().toISOString().split("T")[0]
    const nextBilling = getCol(row, "next billing", "billing", "due") || startDate
    const endDate = getCol(row, "end date", "end") || undefined
    const account = getCol(row, "account", "email") || undefined
    const website = getCol(row, "website", "url") || undefined
    const isActive = getCol(row, "is active", "active").toLowerCase() !== "false"
    const isTrial = getCol(row, "is trial", "trial").toLowerCase() === "true"
    const trialEndDate = getCol(row, "trial end date", "trial end") || undefined
    const cancelUrl = getCol(row, "cancellation url", "cancel url", "cancel") || undefined
    const isShared = getCol(row, "is shared", "shared").toLowerCase() === "true"
    const totalPlanPriceRaw = getCol(row, "total plan price", "total price")
    const totalPlanPrice = totalPlanPriceRaw ? parseFloat(totalPlanPriceRaw) : undefined
    const totalMembersRaw = getCol(row, "total members", "members")
    const totalMembers = totalMembersRaw ? parseInt(totalMembersRaw) : undefined
    const icon = getCol(row, "icon") || "Receipt"
    const color = getCol(row, "color") || "#000000"

    results.push({
      name,
      price,
      currency,
      cycle,
      category,
      startDate,
      nextBilling,
      endDate,
      account,
      website,
      isActive,
      isTrial,
      trialEndDate,
      cancelUrl,
      isShared,
      totalPlanPrice,
      totalMembers,
      icon,
      color,
    })
  }

  return results
}

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentVal = ""
  let insideQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"'
        i++ // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentVal)
      currentVal = ""
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++ // Handle CRLF
      }
      currentRow.push(currentVal)
      rows.push(currentRow)
      currentRow = []
      currentVal = ""
    } else {
      currentVal += char
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal)
    rows.push(currentRow)
  }

  return rows
}
