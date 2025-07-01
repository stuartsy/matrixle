# Milestone 5: Daily Puzzle System

## Objective
Implement a consistent daily puzzle system where all users worldwide get the same puzzle each day, with localStorage persistence to maintain game state across browser sessions.

## Success Criteria
- [ ] Same puzzle appears for all users on the same date
- [ ] Puzzle selection is deterministic and based on date
- [ ] Game state persists across browser refreshes
- [ ] One puzzle per day (no replaying until next day)
- [ ] Timezone-independent puzzle selection
- [ ] Game state includes date validation to prevent cheating
- [ ] Clean transition between days (auto-reset)

## Technical Implementation

### 1. Puzzle Database (`src/lib/puzzles.ts`)
```typescript
export interface Puzzle {
  id: string
  date: string
  matrix: { a: number; b: number; c: number; d: number }
  vector: { e: number; f: number }
  result: { g: number; h: number }
  difficulty?: 'easy' | 'medium' | 'hard'
}

// Pre-generated puzzle database (365+ puzzles for a full year)
export const DAILY_PUZZLES: Puzzle[] = [
  {
    id: 'puzzle-001',
    date: '2024-01-01',
    matrix: { a: 2, b: 1, c: 1, d: 3 },
    vector: { e: 3, f: 2 },
    result: { g: 8, h: 9 }, // 2*3+1*2=8, 1*3+3*2=9
    difficulty: 'easy'
  },
  {
    id: 'puzzle-002', 
    date: '2024-01-02',
    matrix: { a: 1, b: 4, c: 2, d: 1 },
    vector: { e: 2, f: 1 },
    result: { g: 6, h: 5 }, // 1*2+4*1=6, 2*2+1*1=5
    difficulty: 'easy'
  },
  {
    id: 'puzzle-003',
    date: '2024-01-03', 
    matrix: { a: 3, b: 2, c: 1, d: 4 },
    vector: { e: 1, f: 3 },
    result: { g: 9, h: 13 }, // 3*1+2*3=9, 1*1+4*3=13
    difficulty: 'medium'
  },
  // ... continue with 365+ puzzles
  // For now, we'll generate a few and use modulo for cycling
]

/**
 * Get today's puzzle based on current date
 * Uses deterministic selection based on days since epoch
 */
export function getTodaysPuzzle(): Puzzle {
  const today = new Date()
  const utcDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const dateString = utcDate.toISOString().split('T')[0]
  
  // Calculate days since epoch (Jan 1, 1970)
  const epochStart = new Date('1970-01-01')
  const daysSinceEpoch = Math.floor((utcDate.getTime() - epochStart.getTime()) / (1000 * 60 * 60 * 24))
  
  // Use modulo to cycle through available puzzles
  const puzzleIndex = daysSinceEpoch % DAILY_PUZZLES.length
  
  // Return puzzle with today's date
  return {
    ...DAILY_PUZZLES[puzzleIndex],
    date: dateString,
    id: `puzzle-${dateString}`
  }
}

/**
 * Get puzzle for a specific date (for testing)
 */
export function getPuzzleForDate(dateString: string): Puzzle {
  const targetDate = new Date(dateString + 'T00:00:00.000Z')
  const epochStart = new Date('1970-01-01')
  const daysSinceEpoch = Math.floor((targetDate.getTime() - epochStart.getTime()) / (1000 * 60 * 60 * 24))
  
  const puzzleIndex = daysSinceEpoch % DAILY_PUZZLES.length
  
  return {
    ...DAILY_PUZZLES[puzzleIndex],
    date: dateString,
    id: `puzzle-${dateString}`
  }
}

/**
 * Check if a given date string is today
 */
export function isToday(dateString: string): boolean {
  const today = new Date()
  const utcToday = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const todayString = utcToday.toISOString().split('T')[0]
  
  return dateString === todayString
}

/**
 * Generate additional puzzles programmatically
 * This ensures we have enough puzzles even if manually created list is short
 */
function generatePuzzle(seed: number): Omit<Puzzle, 'id' | 'date'> {
  // Simple deterministic puzzle generation based on seed
  // Ensures same seed always produces same puzzle
  const random = (n: number) => Math.floor((seed * 9301 + 49297) % 233280 / 233280 * n) + 1
  
  const a = random(9)
  const b = random(9) 
  const c = random(9)
  const d = random(9)
  const e = random(9)
  const f = random(9)
  
  // Calculate results
  const g = a * e + b * f
  const h = c * e + d * f
  
  // Ensure results are reasonable (not too large)
  if (g > 99 || h > 99) {
    // Regenerate with smaller values
    return generatePuzzle(seed + 1)
  }
  
  const difficulty = (g + h) > 30 ? 'hard' : (g + h) > 20 ? 'medium' : 'easy'
  
  return {
    matrix: { a, b, c, d },
    vector: { e, f },
    result: { g, h },
    difficulty
  }
}

// Extend puzzle database if needed
if (DAILY_PUZZLES.length < 365) {
  for (let i = DAILY_PUZZLES.length; i < 365; i++) {
    const generated = generatePuzzle(i + 1000) // +1000 to avoid conflicts
    DAILY_PUZZLES.push({
      id: `puzzle-${String(i + 1).padStart(3, '0')}`,
      date: `2024-01-${String((i % 31) + 1).padStart(2, '0')}`, // Placeholder dates
      ...generated
    })
  }
}
```

### 2. Local Storage Management (`src/hooks/useLocalStorage.ts`)
```typescript
import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        if (item) {
          const parsed = JSON.parse(item)
          setStoredValue(parsed)
        }
      }
    } catch (error) {
      console.warn(`Error loading localStorage key "${key}":`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Clear the stored value
  const clearValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error clearing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, clearValue, isLoaded] as const
}
```

### 3. Daily Puzzle Hook (`src/hooks/useDailyPuzzle.ts`)
```typescript
import { useEffect, useState } from 'react'
import { getTodaysPuzzle, isToday } from '@/lib/puzzles'
import { useLocalStorage } from './useLocalStorage'
import type { Puzzle } from '@/lib/puzzles'
import type { GameState } from './useGameState'

interface StoredGameData {
  puzzle: Puzzle
  gameState: GameState
  lastPlayed: string
  completedAt?: string
}

export function useDailyPuzzle() {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null)
  const [storedData, setStoredData, clearStoredData, isLoaded] = useLocalStorage<StoredGameData | null>('matrixle-daily-game', null)
  const [shouldResetGame, setShouldResetGame] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    const todaysPuzzle = getTodaysPuzzle()
    
    // Check if we have stored data for today
    if (storedData && storedData.puzzle.date === todaysPuzzle.date) {
      // Continue with today's puzzle
      setCurrentPuzzle(storedData.puzzle)
    } else {
      // New day - reset to today's puzzle
      setCurrentPuzzle(todaysPuzzle)
      setShouldResetGame(true)
      
      // Clear old data if it exists
      if (storedData) {
        clearStoredData()
      }
    }
  }, [isLoaded, storedData, clearStoredData])

  const saveGameState = (gameState: GameState) => {
    if (!currentPuzzle) return

    const dataToStore: StoredGameData = {
      puzzle: currentPuzzle,
      gameState,
      lastPlayed: new Date().toISOString(),
      completedAt: gameState.status !== 'playing' ? new Date().toISOString() : undefined
    }

    setStoredData(dataToStore)
  }

  const getStoredGameState = (): GameState | null => {
    if (!storedData || !currentPuzzle) return null
    if (storedData.puzzle.date !== currentPuzzle.date) return null
    
    return storedData.gameState
  }

  const canPlayToday = (): boolean => {
    if (!currentPuzzle) return false
    
    // Can play if:
    // 1. No stored data (first time playing today)
    // 2. Stored data is for today and game is not completed
    if (!storedData) return true
    if (storedData.puzzle.date !== currentPuzzle.date) return true
    if (storedData.gameState.status === 'playing') return true
    
    return false
  }

  const getTimeUntilNextPuzzle = (): number => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    
    return tomorrow.getTime() - now.getTime()
  }

  return {
    currentPuzzle,
    saveGameState,
    getStoredGameState,
    canPlayToday: canPlayToday(),
    timeUntilNextPuzzle: getTimeUntilNextPuzzle(),
    shouldResetGame,
    setShouldResetGame,
    isLoaded
  }
}
```

### 4. Enhanced Game State Hook (`src/hooks/useGameState.ts`)
```typescript
import { useState, useCallback, useEffect } from 'react'
import { generateFeedback, calculateDigitTracker, isWinningGuess } from '@/lib/feedback'
import { useDailyPuzzle } from './useDailyPuzzle'
import type { Guess, FeedbackColor } from '@/lib/feedback'
import type { Matrix2x2, Vector2x1, Result2x1, Puzzle } from '@/types/game'

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameState {
  puzzle: Puzzle
  guesses: Guess[]
  currentGuess: number
  status: GameStatus
  digitTracker: Record<string, FeedbackColor>
  startedAt: string
  completedAt?: string
}

export function useGameState() {
  const { 
    currentPuzzle, 
    saveGameState, 
    getStoredGameState, 
    canPlayToday,
    shouldResetGame,
    setShouldResetGame,
    isLoaded
  } = useDailyPuzzle()

  const [gameState, setGameState] = useState<GameState | null>(null)

  // Initialize game state when puzzle is loaded
  useEffect(() => {
    if (!isLoaded || !currentPuzzle) return

    if (shouldResetGame) {
      // Start fresh game
      const newGameState: GameState = {
        puzzle: currentPuzzle,
        guesses: [],
        currentGuess: 0,
        status: 'playing',
        digitTracker: {},
        startedAt: new Date().toISOString()
      }
      setGameState(newGameState)
      setShouldResetGame(false)
    } else {
      // Try to restore saved game state
      const savedState = getStoredGameState()
      if (savedState) {
        setGameState(savedState)
      } else {
        // No saved state, start fresh
        const newGameState: GameState = {
          puzzle: currentPuzzle,
          guesses: [],
          currentGuess: 0,
          status: 'playing',
          digitTracker: {},
          startedAt: new Date().toISOString()
        }
        setGameState(newGameState)
      }
    }
  }, [currentPuzzle, shouldResetGame, isLoaded, getStoredGameState, setShouldResetGame])

  const submitGuess = useCallback((guessInput: {
    matrix: Matrix2x2
    vector: Vector2x1
    result: Result2x1
  }) => {
    if (!gameState || gameState.status !== 'playing') return

    // Create the guess object
    const guess: Guess = {
      ...guessInput,
      feedback: [],
      timestamp: new Date()
    }

    // Generate feedback
    guess.feedback = generateFeedback(guess, gameState.puzzle)

    // Update game state
    setGameState(prev => {
      if (!prev) return prev

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

      const updatedState: GameState = {
        ...prev,
        guesses: newGuesses,
        currentGuess: isWin || isGameOver ? prev.currentGuess : prev.currentGuess + 1,
        status: newStatus,
        digitTracker: newDigitTracker,
        completedAt: newStatus !== 'playing' ? new Date().toISOString() : prev.completedAt
      }

      // Save to localStorage
      saveGameState(updatedState)

      return updatedState
    })
  }, [gameState, saveGameState])

  const resetGame = useCallback(() => {
    if (!currentPuzzle) return

    const newGameState: GameState = {
      puzzle: currentPuzzle,
      guesses: [],
      currentGuess: 0,
      status: 'playing',
      digitTracker: {},
      startedAt: new Date().toISOString()
    }
    
    setGameState(newGameState)
    saveGameState(newGameState)
  }, [currentPuzzle, saveGameState])

  return {
    gameState,
    submitGuess,
    resetGame,
    canPlayToday,
    isLoaded
  }
}
```

### 5. Enhanced Game Board with Daily Puzzle Integration (`src/components/GameBoard.tsx`)
```typescript
import GuessRow from './GuessRow'
import DigitTracker from './DigitTracker'
import { useGameState } from '@/hooks/useGameState'

export default function GameBoard() {
  const { gameState, submitGuess, resetGame, canPlayToday, isLoaded } = useGameState()

  // Loading state
  if (!isLoaded || !gameState) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading today's puzzle...</div>
          </div>
        </div>
      </div>
    )
  }

  // Game completed for today
  if (!canPlayToday && gameState.status !== 'playing') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center p-6 bg-gray-100 rounded-lg">
          <div className="text-lg font-semibold mb-2">
            {gameState.status === 'won' ? '🎉 Puzzle Complete!' : '😔 Puzzle Complete'}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            {gameState.status === 'won' 
              ? `You solved today's puzzle in ${gameState.guesses.length} guess${gameState.guesses.length !== 1 ? 'es' : ''}!`
              : 'You completed today\'s puzzle.'
            }
          </div>
          <div className="text-xs text-gray-500">
            Come back tomorrow for a new puzzle!
          </div>
        </div>
        
        {/* Show completed game board */}
        <div className="mt-6 opacity-75">
          <GameBoardDisplay gameState={gameState} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <GameBoardDisplay gameState={gameState} submitGuess={submitGuess} />
      
      {/* Daily puzzle indicator */}
      <div className="text-center text-xs text-gray-500 mt-4">
        Daily puzzle for {new Date(gameState.puzzle.date).toLocaleDateString()}
      </div>
    </div>
  )
}

// Separate display component to avoid duplication
function GameBoardDisplay({ 
  gameState, 
  submitGuess 
}: { 
  gameState: any
  submitGuess?: (guess: any) => void 
}) {
  const guessRows = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    isActive: index === gameState.currentGuess && gameState.status === 'playing' && submitGuess,
    isSubmitted: index < gameState.guesses.length,
    feedback: gameState.guesses[index]?.feedback
  }))

  return (
    <>
      {/* Game Board */}
      <div className="space-y-2 mb-6">
        {guessRows.map((row) => (
          <GuessRow
            key={row.id}
            rowIndex={row.id}
            isActive={row.isActive}
            isSubmitted={row.isSubmitted}
            feedback={row.feedback}
            onSubmit={submitGuess}
          />
        ))}
      </div>
      
      {/* Digit Tracker */}
      <DigitTracker digitStatus={gameState.digitTracker} />
      
      {/* Game Status */}
      {gameState.status !== 'playing' && (
        <div className="text-center mt-6 p-4 rounded-lg bg-gray-100">
          <div className="text-lg font-semibold mb-2">
            {gameState.status === 'won' ? '🎉 Congratulations!' : '😔 Game Over'}
          </div>
          <div className="text-sm text-gray-600 mb-3">
            {gameState.status === 'won' 
              ? `You solved it in ${gameState.guesses.length} guess${gameState.guesses.length !== 1 ? 'es' : ''}!`
              : 'Better luck tomorrow!'
            }
          </div>
          {gameState.status === 'lost' && (
            <div className="text-sm text-gray-700 mb-3 font-mono">
              The answer was: [{gameState.puzzle.matrix.a} {gameState.puzzle.matrix.b}] × [{gameState.puzzle.vector.e}] = [{gameState.puzzle.result.g}]
              <br />
              [{gameState.puzzle.matrix.c} {gameState.puzzle.matrix.d}]   [{gameState.puzzle.vector.f}]   [{gameState.puzzle.result.h}]
            </div>
          )}
        </div>
      )}
      
      {/* Instructions */}
      <div className="text-center text-gray-500 text-xs mt-6">
        <div className="mb-2">
          🟩 Correct position • 🟨 Wrong position • ⬜ Not in puzzle
        </div>
        <div className="font-mono text-xs">
          Enter matrix values: [a b] × [e] = calculated result
        </div>
        <div className="font-mono text-xs">
                           [c d]   [f]
        </div>
      </div>
    </>
  )
}
```

## Testing Strategy

### 1. Daily Puzzle Logic Tests (`src/lib/__tests__/puzzles.test.ts`)
```typescript
import { getTodaysPuzzle, getPuzzleForDate, isToday } from '../puzzles'

describe('Daily Puzzle System', () => {
  test('returns consistent puzzle for same date', () => {
    const puzzle1 = getPuzzleForDate('2024-01-01')
    const puzzle2 = getPuzzleForDate('2024-01-01')
    
    expect(puzzle1).toEqual(puzzle2)
  })

  test('returns different puzzles for different dates', () => {
    const puzzle1 = getPuzzleForDate('2024-01-01')
    const puzzle2 = getPuzzleForDate('2024-01-02')
    
    expect(puzzle1.id).not.toEqual(puzzle2.id)
  })

  test('puzzle math is valid', () => {
    const puzzle = getPuzzleForDate('2024-01-01')
    
    const calculatedG = puzzle.matrix.a * puzzle.vector.e + puzzle.matrix.b * puzzle.vector.f
    const calculatedH = puzzle.matrix.c * puzzle.vector.e + puzzle.matrix.d * puzzle.vector.f
    
    expect(calculatedG).toBe(puzzle.result.g)
    expect(calculatedH).toBe(puzzle.result.h)
  })

  test('isToday works correctly', () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    expect(isToday(today)).toBe(true)
    expect(isToday(yesterday)).toBe(false)
  })
})
```

### 2. LocalStorage Tests
```typescript
test('saves and restores game state', () => {
  const { result } = renderHook(() => useLocalStorage('test-key', { value: 0 }))
  
  act(() => {
    result.current[1]({ value: 42 })
  })
  
  // Simulate page reload
  const { result: newResult } = renderHook(() => useLocalStorage('test-key', { value: 0 }))
  
  expect(newResult.current[0]).toEqual({ value: 42 })
})
```

## Definition of Done

### Functional Requirements:
- [ ] Same puzzle appears for all users on same date
- [ ] Game state persists across browser sessions
- [ ] Date transitions properly reset game state
- [ ] Cannot replay completed puzzles until next day
- [ ] Timezone handling works correctly

### Data Integrity:
- [ ] Puzzle selection is deterministic
- [ ] localStorage data is valid and recoverable
- [ ] Game state validation prevents cheating
- [ ] Date-based puzzle rotation works correctly

### User Experience:
- [ ] Loading states are smooth and informative
- [ ] Game completion is satisfying
- [ ] Clear indication of daily nature
- [ ] Proper handling of edge cases (midnight, DST)

### Performance:
- [ ] Puzzle loading is fast (< 100ms)
- [ ] localStorage operations don't block UI
- [ ] Memory usage is reasonable
- [ ] No unnecessary re-renders

## Next Steps
With daily puzzles and persistence complete, Milestone 6 will add the win/loss completion flow and social sharing functionality that makes the game viral.