import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isCardExpired(month?: number, year?: number): boolean {
  if (!month || !year) return false
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  return year < currentYear || (year === currentYear && month < currentMonth)
}
