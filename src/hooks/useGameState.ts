import { useState, useCallback, useEffect } from 'react'
import { generateFeedback, calculateDigitStats, isWinningGuess } from '@/lib/feedback'
import { getDailyPuzzle } from '@/lib/dailyPuzzle'
import type { Guess, Puzzle, DigitStat } from '@/types/game'
import type { Matrix2x2, Vector2x1, Result2x1 } from '@/types/game'

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameState {
  puzzle: Puzzle
  guesses: Guess[]
  currentGuess: number
  status: GameStatus
  digitStats: Record<string, DigitStat>
  retried: boolean
}

function defaultState(puzzle?: Puzzle): GameState {
  return {
    puzzle: puzzle ?? getDailyPuzzle(),
    guesses: [],
    currentGuess: 0,
    status: 'playing',
    digitStats: {},
    retried: false,
  }
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => defaultState())
  const [hydrated, setHydrated] = useState(false)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const puzzle = getDailyPuzzle()
    try {
      const saved = localStorage.getItem(`matrixle-${puzzle.date}`)
      if (saved) {
        const parsed = JSON.parse(saved) as GameState
        parsed.guesses = parsed.guesses.map((g) => ({
          ...g,
          timestamp: new Date(g.timestamp),
        }))
        setGameState({ ...parsed, puzzle })
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true)
  }, [])

  // Persist state to localStorage after hydration
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(`matrixle-${gameState.puzzle.date}`, JSON.stringify(gameState))
  }, [gameState, hydrated])

  const submitGuess = useCallback((guessInput: {
    matrix: Matrix2x2
    vector: Vector2x1
    result: Result2x1
  }) => {
    if (gameState.status !== 'playing') return

    const guess: Guess = {
      ...guessInput,
      feedback: [],
      timestamp: new Date()
    }

    guess.feedback = generateFeedback(guess, gameState.puzzle)

    setGameState(prev => {
      const newGuesses = [...prev.guesses, guess]
      const newDigitStats = calculateDigitStats(newGuesses)

      const isWin = isWinningGuess(guess, prev.puzzle)
      const isGameOver = newGuesses.length >= 6

      let newStatus: GameStatus = 'playing'
      if (isWin) newStatus = 'won'
      else if (isGameOver) newStatus = 'lost'

      return {
        ...prev,
        guesses: newGuesses,
        currentGuess: isWin || isGameOver ? prev.currentGuess : prev.currentGuess + 1,
        status: newStatus,
        digitStats: newDigitStats,
      }
    })
  }, [gameState.status, gameState.puzzle])

  const retryGame = useCallback(() => {
    setGameState(prev => ({
      ...defaultState(prev.puzzle),
      retried: true,
    }))
  }, [])

  return {
    gameState,
    submitGuess,
    retryGame,
  }
}
