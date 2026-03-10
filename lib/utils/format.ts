import {
  CURRENCY_LOCALE,
  CURRENCY_CODE,
} from "@/lib/config/constants"

/**
 * Formats a price value as Kenyan Shillings.
 * Returns "—" for null/undefined prices.
 *
 * @param price - Numeric price or null
 * @returns Formatted string e.g. "KSh 2,500"
 */
export function formatPrice(
  price: number | null | undefined
): string {
  if (price == null) return "—"
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
