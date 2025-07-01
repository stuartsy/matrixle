import type { Matrix2x2, Vector2x1, Result2x1, FeedbackColor, Guess, Puzzle } from '@/types/game'

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
 * Calculate the overall status of each digit (1-9) based on all guesses
 */
export function calculateDigitTracker(
  guesses: Guess[]
): Record<string, FeedbackColor> {
  const digitStatus: Record<string, FeedbackColor> = {}
  
  // Initialize all digits as unknown (not-in-puzzle initially)
  for (let i = 1; i <= 9; i++) {
    digitStatus[i.toString()] = 'not-in-puzzle'
  }
  
  // Process each guess to update digit status
  guesses.forEach(guess => {
    const guessArray = [
      guess.matrix.a, guess.matrix.b,
      guess.matrix.c, guess.matrix.d,
      guess.vector.e, guess.vector.f,
      guess.result.g, guess.result.h
    ]
    
    guessArray.forEach((digit, index) => {
      const digitStr = digit.toString()
      const currentStatus = digitStatus[digitStr]
      const newStatus = guess.feedback[index]
      
      // Priority: correct > wrong-position > not-in-puzzle
      if (newStatus === 'correct' || 
          (newStatus === 'wrong-position' && currentStatus === 'not-in-puzzle')) {
        digitStatus[digitStr] = newStatus
      }
    })
  })
  
  return digitStatus
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