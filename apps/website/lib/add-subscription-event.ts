export const OPEN_ADD_SUBSCRIPTION_EVENT = "subkeep_open_add_subscription"

export function openAddSubscriptionSheet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_ADD_SUBSCRIPTION_EVENT))
  }
}
