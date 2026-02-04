export interface FormatNumberOptions {
  prefix?: string
  suffix?: string
  decimals?: number
}

export function formatNumber(num: number, options?: FormatNumberOptions): string {
  const { prefix = "", suffix = "", decimals = 1 } = options || {}

  if (num >= 1000) {
    const kValue = num / 1000
    const formatted = kValue % 1 === 0 ? kValue.toString() : kValue.toFixed(decimals)
    return `${prefix}${formatted}k${suffix}`
  }

  return `${prefix}${num}${suffix}`
}

export function getInitials(value: string) {
  const cleaned = value.trim()
  if (!cleaned) return "?"

  const words = cleaned
    .split(/\s+/g)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  if (words) return words
  return cleaned.slice(0, 2).toUpperCase()
}

