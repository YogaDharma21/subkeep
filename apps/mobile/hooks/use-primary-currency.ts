import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import {
  fetchExchangeRates,
  fallbackRates,
  getStoredExchangeRates,
  setExchangeRatesCache,
} from "@/lib/currency"
import AsyncStorage from "@react-native-async-storage/async-storage"

export function usePrimaryCurrency() {
  const { isSignedIn } = useAuth()
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const updateSettings = useMutation(api.userSettings.update)
  const convexRatesDoc = useQuery(
    api.exchangeRates.getLatest,
    isSignedIn ? { baseCurrency: "USD" } : "skip"
  )

  const [fetchedRates, setFetchedRates] = useState<Record<string, number>>(fallbackRates)
  const [localFallbackCurrency, setLocalFallbackCurrency] = useState<string>("USD")

  // Load exchange rates and cached currency on mount
  useEffect(() => {
    getStoredExchangeRates().then((local) => {
      if (local && Object.keys(local).length > 2) {
        setFetchedRates(local)
      }
    })
    fetchExchangeRates().then(setFetchedRates)
    AsyncStorage.getItem("subkeep_primary_currency").then((cached) => {
      if (cached) setLocalFallbackCurrency(cached)
    })
  }, [])

  // Reactive sync when Convex exchangeRates cache updates
  useEffect(() => {
    if (convexRatesDoc?.rates) {
      setExchangeRatesCache(convexRatesDoc.rates, convexRatesDoc.updatedAt)
    }
  }, [convexRatesDoc])

  const rates = convexRatesDoc?.rates
    ? { ...fallbackRates, ...convexRatesDoc.rates }
    : fetchedRates

  const primaryCurrency =
    userSettings?.primaryCurrency || localFallbackCurrency || "USD"

  const setPrimaryCurrency = useCallback(
    async (currency: string) => {
      const upper = currency.toUpperCase()
      setLocalFallbackCurrency(upper)
      await AsyncStorage.setItem("subkeep_primary_currency", upper)

      if (isSignedIn) {
        try {
          await updateSettings({ primaryCurrency: upper })
        } catch (e) {
          console.error("Failed to sync primary currency with Convex:", e)
        }
      }
    },
    [isSignedIn, updateSettings]
  )

  return {
    primaryCurrency,
    setPrimaryCurrency,
    rates,
    isLoaded: userSettings !== undefined || !isSignedIn,
  }
}
