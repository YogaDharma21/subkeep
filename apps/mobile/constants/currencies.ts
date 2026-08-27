export const currencies = [
  { value: "IDR", label: "Rp IDR" },
  { value: "USD", label: "$ USD" },
]

export const currencySymbols: Record<string, string> = {
  IDR: "Rp",
  USD: "$",
}

export function getSymbol(currency: string): string {
  return currencySymbols[currency] || "$"
}
