import type { Puzzle } from '@/types/game'

// Puzzle #1 launch date
const EPOCH = '2026-03-29'

function dateHash(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (Math.imul(31, hash) + dateStr.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  return function (): number {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getPuzzleNumber(dateStr?: string): number {
  const date = dateStr ?? getTodayString()
  const epochMs = new Date(EPOCH).getTime()
  const targetMs = new Date(date).getTime()
  return Math.floor((targetMs - epochMs) / (1000 * 60 * 60 * 24)) + 1
}

export function getDailyPuzzle(dateStr?: string): Puzzle {
  const date = dateStr ?? getTodayString()
  const rand = mulberry32(dateHash(date))

  for (let attempt = 0; attempt < 1000; attempt++) {
    const a = Math.floor(rand() * 9) + 1
    const b = Math.floor(rand() * 9) + 1
    const c = Math.floor(rand() * 9) + 1
    const d = Math.floor(rand() * 9) + 1
    const e = Math.floor(rand() * 9) + 1
    const f = Math.floor(rand() * 9) + 1
    const g = a * e + b * f
    const h = c * e + d * f
    if (g <= 9 && h <= 9) {
      return {
        id: `daily-${date}`,
        date,
        matrix: { a, b, c, d },
        vector: { e, f },
        result: { g, h },
      }
    }
  }

  throw new Error(`Could not generate valid puzzle for ${date}`)
}
