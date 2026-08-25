import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import { fallbackRates, fetchExchangeRates } from "@/lib/currency"

const STORAGE_KEY = "subkeep_primary_currency"
const CURRENCY_CHANGE_EVENT = "subkeep_currency_changed"

export function usePrimaryCurrency() {
  const { isSignedIn } = useAuth()
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const updateSettings = useMutation(api.userSettings.update)

  const [localCurrency, setLocalCurrency] = useState<string | null>(null)
  const [rates, setRates] = useState<Record<string, number>>(fallbackRates)
  const [ratesLoaded, setRatesLoaded] = useState(false)

  // Fetch exchange rates once on mount
  useEffect(() => {
    fetchExchangeRates().then((loadedRates) => {
      setRates(loadedRates)
      setRatesLoaded(true)
    })
  }, [])

  // Listen to cross-component currency changes
  useEffect(() => {
    const handleLocalChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ currency: string }>
      if (customEvent.detail?.currency) {
        setLocalCurrency(customEvent.detail.currency)
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setLocalCurrency(e.newValue)
      }
    }

    window.addEventListener(CURRENCY_CHANGE_EVENT, handleLocalChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleLocalChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  let storedCurrency: string | null = null
  if (typeof window !== "undefined") {
    try {
      storedCurrency = localStorage.getItem(STORAGE_KEY)
    } catch {
      // ignore storage access errors
    }
  }

  const primaryCurrency =
    localCurrency || userSettings?.primaryCurrency || storedCurrency || "IDR"

  const setPrimaryCurrency = useCallback(
    async (newCurrency: string) => {
      if (!newCurrency) return
      setLocalCurrency(newCurrency)

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, newCurrency)
        } catch {
          // ignore storage access errors
        }
        window.dispatchEvent(
          new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: { currency: newCurrency } })
        )
      }

      if (isSignedIn) {
        try {
          await updateSettings({ primaryCurrency: newCurrency })
        } catch (err) {
          console.warn("Could not persist primary currency to Convex backend:", err)
        }
      }
    },
    [isSignedIn, updateSettings]
  )

  return {
    primaryCurrency,
    setPrimaryCurrency,
    rates,
    ratesLoaded,
  }
}
