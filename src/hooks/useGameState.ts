import { useState, useCallback } from 'react'
import { generateFeedback, calculateDigitTracker, isWinningGuess } from '@/lib/feedback'
import type { Guess, Puzzle, FeedbackColor } from '@/types/game'
import type { Matrix2x2, Vector2x1, Result2x1 } from '@/types/game'

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameState {
  puzzle: Puzzle
  guesses: Guess[]
  currentGuess: number
  status: GameStatus
  digitTracker: Record<string, FeedbackColor>
}

// Temporary puzzle for testing (will be replaced with daily puzzle system)
const TEST_PUZZLE: Puzzle = {
  id: 'test-1',
  date: '2024-01-01',
  matrix: { a: 2, b: 1, c: 1, d: 3 },
  vector: { e: 3, f: 2 },
  result: { g: 8, h: 9 } // 2*3+1*2=8, 1*3+3*2=9
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    puzzle: TEST_PUZZLE,
    guesses: [],
    currentGuess: 0,
    status: 'playing',
    digitTracker: {}
  })

  const submitGuess = useCallback((guessInput: {
    matrix: Matrix2x2
    vector: Vector2x1
    result: Result2x1
  }) => {
    if (gameState.status !== 'playing') return

    // Create the guess object with feedback
    const guess: Guess = {
      ...guessInput,
      feedback: [],
      timestamp: new Date()
    }

    // Generate feedback
    guess.feedback = generateFeedback(guess, gameState.puzzle)

    // Update game state
    setGameState(prev => {
      const newGuesses = [...prev.guesses, guess]
      const newDigitTracker = calculateDigitTracker(newGuesses)
      
      // Check win condition
      const isWin = isWinningGuess(guess, prev.puzzle)
      const isGameOver = newGuesses.length >= 6
      
      let newStatus: GameStatus = 'playing'
      if (isWin) {
        newStatus = 'won'
      } else if (isGameOver) {
        newStatus = 'lost'
      }

      return {
        ...prev,
        guesses: newGuesses,
        currentGuess: isWin || isGameOver ? prev.currentGuess : prev.currentGuess + 1,
        status: newStatus,
        digitTracker: newDigitTracker
      }
    })
  }, [gameState.status, gameState.puzzle])

  const resetGame = useCallback(() => {
    setGameState({
      puzzle: TEST_PUZZLE,
      guesses: [],
      currentGuess: 0,
      status: 'playing',
      digitTracker: {}
    })
  }, [])

  return {
    gameState,
    submitGuess,
    resetGame
  }
}