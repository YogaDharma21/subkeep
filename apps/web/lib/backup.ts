export type BackupVersion = 1 | 2 | 3

export interface NormalizedBackupData {
  subscriptions: any[]
  paymentMethods: any[]
  payments: any[]
  userSettings: any | null
  accounts: any[]
  transactions: any[]
  budgets: any[]
}

export interface BackupSummary {
  version: BackupVersion
  exportedAt?: string
  counts: Record<
    "subscriptions" | "paymentMethods" | "payments" | "userSettings" | "accounts" | "transactions" | "budgets",
    number
  >
  totalRecords: number
}

export interface ParsedBackup {
  version: BackupVersion
  exportedAt?: string
  data: NormalizedBackupData
  summary: BackupSummary
}

const RECOGNIZED_TABLE_KEYS = [
  "subscriptions",
  "paymentMethods",
  "payments",
  "userSettings",
  "accounts",
  "transactions",
  "budgets",
] as const

function isObject(val: unknown): val is Record<string, any> {
  return typeof val === "object" && val !== null && !Array.isArray(val)
}

function validateRecordsArray(arr: any[]): boolean {
  return arr.every((item) => isObject(item))
}

export function parseAndNormalizeBackup(raw: unknown): ParsedBackup {
  let parsed: unknown = raw

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
    }
  }

  let version: BackupVersion
  let exportedAt: string | undefined
  let data: NormalizedBackupData

  if (Array.isArray(parsed)) {
    // v1: array of subscriptions
    if (parsed.length > 0 && !validateRecordsArray(parsed)) {
      throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
    }

    version = 1
    exportedAt = undefined
    data = {
      subscriptions: parsed,
      paymentMethods: [],
      payments: [],
      userSettings: null,
      accounts: [],
      transactions: [],
      budgets: [],
    }
  } else if (isObject(parsed)) {
    const isV3 = parsed.version === 3 || "data" in parsed

    if (isV3) {
      version = 3
      exportedAt = typeof parsed.exportedAt === "string" ? parsed.exportedAt : undefined

      if ("data" in parsed && !isObject(parsed.data)) {
        throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
      }

      const source: Record<string, any> = isObject(parsed.data) ? parsed.data : parsed

      const subscriptions = Array.isArray(source.subscriptions) ? source.subscriptions : []
      const paymentMethods = Array.isArray(source.paymentMethods) ? source.paymentMethods : []
      const payments = Array.isArray(source.payments) ? source.payments : []
      const accounts = Array.isArray(source.accounts) ? source.accounts : []
      const transactions = Array.isArray(source.transactions) ? source.transactions : []
      const budgets = Array.isArray(source.budgets) ? source.budgets : []

      if (
        !validateRecordsArray(subscriptions) ||
        !validateRecordsArray(paymentMethods) ||
        !validateRecordsArray(payments) ||
        !validateRecordsArray(accounts) ||
        !validateRecordsArray(transactions) ||
        !validateRecordsArray(budgets)
      ) {
        throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
      }

      const rawSettings = source.userSettings
      const userSettings = Array.isArray(rawSettings)
        ? rawSettings.length > 0 && isObject(rawSettings[0])
          ? rawSettings[0]
          : null
        : isObject(rawSettings)
          ? rawSettings
          : null

      data = {
        subscriptions,
        paymentMethods,
        payments,
        userSettings,
        accounts,
        transactions,
        budgets,
      }
    } else if (parsed.subscriptions) {
      if (!Array.isArray(parsed.subscriptions) || !validateRecordsArray(parsed.subscriptions)) {
        throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
      }

      const payments = Array.isArray(parsed.payments) ? parsed.payments : []
      if (!validateRecordsArray(payments)) {
        throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
      }

      version = 2
      exportedAt = typeof parsed.exportedAt === "string" ? parsed.exportedAt : undefined
      data = {
        subscriptions: parsed.subscriptions,
        paymentMethods: [],
        payments,
        userSettings: null,
        accounts: [],
        transactions: [],
        budgets: [],
      }
    } else {
      throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
    }
  } else {
    throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
  }

  const counts: Record<
    "subscriptions" | "paymentMethods" | "payments" | "userSettings" | "accounts" | "transactions" | "budgets",
    number
  > = {
    subscriptions: data.subscriptions.length,
    paymentMethods: data.paymentMethods.length,
    payments: data.payments.length,
    userSettings: data.userSettings !== null && data.userSettings !== undefined ? 1 : 0,
    accounts: data.accounts.length,
    transactions: data.transactions.length,
    budgets: data.budgets.length,
  }

  const totalRecords =
    counts.subscriptions +
    counts.paymentMethods +
    counts.payments +
    counts.userSettings +
    counts.accounts +
    counts.transactions +
    counts.budgets

  if (totalRecords === 0) {
    const isValidEmptyV1 = Array.isArray(parsed)
    const isValidEmptyV2 =
      isObject(parsed) && "subscriptions" in parsed && Array.isArray(parsed.subscriptions)
    const isValidEmptyV3 =
      isObject(parsed) &&
      ("data" in parsed
        ? isObject(parsed.data) &&
          (Object.keys(parsed.data).length === 0 ||
            RECOGNIZED_TABLE_KEYS.some((key) => key in parsed.data))
        : RECOGNIZED_TABLE_KEYS.some((key) => key in parsed))

    if (!isValidEmptyV1 && !isValidEmptyV2 && !isValidEmptyV3) {
      throw new Error("Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON.")
    }
  }

  const summary: BackupSummary = {
    version,
    exportedAt,
    counts,
    totalRecords,
  }

  return {
    version,
    exportedAt,
    data,
    summary,
  }
}

export function downloadBackupJson(backupPayload: unknown, filename?: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return
  }

  const jsonString =
    typeof backupPayload === "string"
      ? backupPayload
      : JSON.stringify(backupPayload, null, 2)

  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const dateStr = new Date().toISOString().split("T")[0]
  const finalFilename = filename || `subkeep-backup-${dateStr}.json`

  const link = document.createElement("a")
  link.href = url
  link.download = finalFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
