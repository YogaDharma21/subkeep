import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

export interface TokenCache {
  getToken: (key: string) => Promise<string | undefined | null>
  saveToken: (key: string, token: string) => Promise<void>
  clearToken?: (key: string) => Promise<void>
}

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        if (Platform.OS === "web") {
          return localStorage.getItem(key)
        }
        return await SecureStore.getItemAsync(key)
      } catch (err) {
        console.error("Failed to retrieve token from SecureStore", err)
        return null
      }
    },
    saveToken: async (key: string, value: string) => {
      try {
        if (Platform.OS === "web") {
          localStorage.setItem(key, value)
          return
        }
        await SecureStore.setItemAsync(key, value)
      } catch (err) {
        console.error("Failed to save token in SecureStore", err)
      }
    },
    clearToken: async (key: string) => {
      try {
        if (Platform.OS === "web") {
          localStorage.removeItem(key)
          return
        }
        await SecureStore.deleteItemAsync(key)
      } catch (err) {
        console.error("Failed to delete token from SecureStore", err)
      }
    },
  }
}

export const tokenCache = createTokenCache()
