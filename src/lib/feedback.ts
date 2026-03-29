import type { Matrix2x2, Vector2x1, Result2x1, FeedbackColor, Guess, Puzzle, DigitStat } from '@/types/game'

/**
 * Generate Wordle-style feedback for a guess against the target puzzle
 * Returns array of 8 feedback colors for positions [a,b,c,d,e,f,g,h]
 * Now includes feedback for all positions including results
 */
export function generateFeedback(
  guess: Guess,
  target: Puzzle
): FeedbackColor[] {
  // Extract all 8 positions (including the results)
  const guessArray = [
    guess.matrix.a, guess.matrix.b,
    guess.matrix.c, guess.matrix.d,
    guess.vector.e, guess.vector.f,
    guess.result.g, guess.result.h
  ]
  
  const targetArray = [
    target.matrix.a, target.matrix.b,
    target.matrix.c, target.matrix.d,
    target.vector.e, target.vector.f,
    target.result.g, target.result.h
  ]
  
  const feedback: FeedbackColor[] = new Array(8)
  const targetUsed = new Array(8).fill(false)
  
  // First pass: mark exact position matches (GREEN)
  for (let i = 0; i < 8; i++) {
    if (guessArray[i] === targetArray[i]) {
      feedback[i] = 'correct'
      targetUsed[i] = true
    }
  }
  
  // Second pass: mark wrong position matches (YELLOW)
  for (let i = 0; i < 8; i++) {
    if (feedback[i] !== 'correct') {
      // Find this digit elsewhere in the target
      const foundIndex = targetArray.findIndex((digit, idx) => 
        digit === guessArray[i] && !targetUsed[idx]
      )
      
      if (foundIndex !== -1) {
        feedback[i] = 'wrong-position'
        targetUsed[foundIndex] = true
      } else {
        feedback[i] = 'not-in-puzzle'
      }
    }
  }
  
  return feedback
}

/**
 * Calculate placed/confirmed stats for each digit 0-9 based on all guesses.
 *
 * placed:    max greens for this digit in any single guess
 * confirmed: max (greens + yellows) in any single guess = lower bound on count in puzzle
 * exact:     true when a gray was seen — confirmed becomes the exact count
 */
export function calculateDigitStats(guesses: Guess[]): Record<string, DigitStat> {
  const stats: Record<string, DigitStat> = {}
  for (let i = 0; i <= 9; i++) {
    stats[i.toString()] = { placed: 0, confirmed: 0, exact: false }
  }

  guesses.forEach(guess => {
    const guessArray = [
      guess.matrix.a, guess.matrix.b,
      guess.matrix.c, guess.matrix.d,
      guess.vector.e, guess.vector.f,
      guess.result.g, guess.result.h
    ]

    // Tally greens/yellows/grays per digit for this guess
    const tally: Record<string, { greens: number; yellows: number; grays: number }> = {}
    guessArray.forEach((digit, index) => {
      const d = digit.toString()
      if (!tally[d]) tally[d] = { greens: 0, yellows: 0, grays: 0 }
      const fb = guess.feedback[index]
      if (fb === 'correct') tally[d].greens++
      else if (fb === 'wrong-position') tally[d].yellows++
      else tally[d].grays++
    })

    Object.entries(tally).forEach(([d, { greens, yellows, grays }]) => {
      const s = stats[d]
      const confirmedInGuess = greens + yellows
      if (greens > s.placed) s.placed = greens
      if (grays > 0) {
        // Gray caps the count exactly
        s.exact = true
        s.confirmed = confirmedInGuess
      } else if (confirmedInGuess > s.confirmed) {
        s.confirmed = confirmedInGuess
      }
    })
  })

  return stats
}

/**
 * Check if the guess matches the target (all positions correct)
 */
export function isWinningGuess(guess: Guess, target: Puzzle): boolean {
  return (
    guess.matrix.a === target.matrix.a &&
    guess.matrix.b === target.matrix.b &&
    guess.matrix.c === target.matrix.c &&
    guess.matrix.d === target.matrix.d &&
    guess.vector.e === target.vector.e &&
    guess.vector.f === target.vector.f &&
    guess.result.g === target.result.g &&
    guess.result.h === target.result.h
  )
}