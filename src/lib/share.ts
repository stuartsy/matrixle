import type { Guess } from '@/types/game'

const EMOJI: Record<string, string> = {
  'correct': '🟩',
  'wrong-position': '🟨',
  'not-in-puzzle': '⬛',
}

export function formatShareText(
  guesses: Guess[],
  puzzleNumber: number,
  guessCount: number,
  status: 'won' | 'lost',
  retried: boolean
): string {
  const result = status === 'won' ? `${guessCount}/6${retried ? '*' : ''}` : 'X/6'

  const rows = guesses.map(guess => {
    const [a, b, c, d, e, f, g, h] = guess.feedback.map(fb => EMOJI[fb])
    return `${a}${b} × ${e} = ${g}\n${c}${d}   ${f}   ${h}`
  })

  return `Matrixle #${puzzleNumber} ${result}\n\n${rows.join('\n\n')}`
}
