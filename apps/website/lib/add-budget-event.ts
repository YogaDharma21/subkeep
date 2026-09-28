export const OPEN_ADD_BUDGET_EVENT = "subkeep_open_add_budget"

export function openAddBudgetSheet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_ADD_BUDGET_EVENT))
  }
}
