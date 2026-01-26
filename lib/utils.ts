import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number to a compact string representation.
 * Numbers >= 1000 are formatted as "k" (e.g., 4200 -> "4.2k", 10600 -> "10.6k")
 * Numbers < 1000 are returned as-is
 * 
 * @param num - The number to format
 * @param options - Optional formatting options
 * @returns Formatted string representation
 */
export function formatNumber(
  num: number,
  options?: {
    prefix?: string // e.g., "$" for currency
    suffix?: string // e.g., "k" (already added automatically for >= 1000)
    decimals?: number // number of decimal places (default: 1)
  }
): string {
  const { prefix = "", suffix = "", decimals = 1 } = options || {}
  
  if (num >= 1000) {
    const kValue = num / 1000
    // If it's a whole number, don't show decimals
    const formatted = kValue % 1 === 0 
      ? kValue.toString() 
      : kValue.toFixed(decimals)
    return `${prefix}${formatted}k${suffix}`
  }
  
  return `${prefix}${num}${suffix}`
}
