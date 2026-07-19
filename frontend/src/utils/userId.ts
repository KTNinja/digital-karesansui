const SESSION_KEY = 'zen_user_id'

// Palette chosen to stay visible against the sand canvas (#c4ae8c range)
const COLOR_PALETTE = [
  '#6a8a94', '#c49460', '#68a868', '#a06090',
  '#5a78b0', '#b06048', '#7a9858', '#9a6878',
]

export function getUserId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem(SESSION_KEY, id)
  return id
}

export function deriveInitials(id: string): string {
  return id.slice(0, 2).toUpperCase()
}

export function deriveColor(id: string): string {
  const n = parseInt(id.replace(/-/g, '').slice(0, 8), 16)
  return COLOR_PALETTE[n % COLOR_PALETTE.length] ?? COLOR_PALETTE[0]!
}
