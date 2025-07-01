# Milestone 4: Feedback System

## Objective
Implement Wordle-style color-coded feedback (green/yellow/gray) and digit tracking to give players the information they need to solve the puzzle strategically.

## Success Criteria
- [ ] Correct feedback colors appear after each valid guess submission
- [ ] Green (correct position), Yellow (wrong position), Gray (not in puzzle) logic works perfectly
- [ ] Digit tracker shows status of all digits 1-9 based on previous guesses
- [ ] Feedback matches the exact Wordle algorithm for consistency
- [ ] Visual feedback is clear and accessible
- [ ] Game state management tracks all guesses and feedback history

## Technical Implementation

### 1. Enhanced Feedback Logic (`src/lib/feedback.ts`)
```typescript
import type { Matrix2x2, Vector2x1, Result2x1 } from '@/types/game'

export type FeedbackColor = 'correct' | 'wrong-position' | 'not-in-puzzle'

export interface Guess {
  matrix: Matrix2x2
  vector: Vector2x1
  result: Result2x1
  feedback: FeedbackColor[]
  timestamp: Date
}

export interface Puzzle {
  matrix: Matrix2x2
  vector: Vector2x1
  result: Result2x1
  id: string
  date: string
}

/**
 * Generate Wordle-style feedback for a guess against the target puzzle
 * Returns array of 6 feedback colors for positions [a,b,c,d,e,f]
 * Note: result positions g,h are calculated, so they're not part of feedback
 */
export function generateFeedback(
  guess: Guess,
  target: Puzzle
): FeedbackColor[] {
  // Extract the 6 input positions (not the calculated results)
  const guessArray = [
    guess.matrix.a, guess.matrix.b,
    guess.matrix.c, guess.matrix.d,
    guess.vector.e, guess.vector.f
  ]
  
  const targetArray = [
    target.matrix.a, target.matrix.b,
    target.matrix.c, target.matrix.d,
    target.vector.e, target.vector.f
  ]
  
  const feedback: FeedbackColor[] = new Array(6)
  const targetUsed = new Array(6).fill(false)
  
  // First pass: mark exact position matches (GREEN)
  for (let i = 0; i < 6; i++) {
    if (guessArray[i] === targetArray[i]) {
      feedback[i] = 'correct'
      targetUsed[i] = true
    }
  }
  
  // Second pass: mark wrong position matches (YELLOW)
  for (let i = 0; i < 6; i++) {
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
  
  // Initialize all digits as unknown
  for (let i = 1; i <= 9; i++) {
    digitStatus[i.toString()] = 'not-in-puzzle'
  }
  
  // Process each guess to update digit status
  guesses.forEach(guess => {
    const guessArray = [
      guess.matrix.a, guess.matrix.b,
      guess.matrix.c, guess.matrix.d,
      guess.vector.e, guess.vector.f
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
    guess.vector.f === target.vector.f
  )
}
```

### 2. Digit Tracker Component (`src/components/DigitTracker.tsx`)
```typescript
import type { FeedbackColor } from '@/lib/feedback'

interface DigitTrackerProps {
  digitStatus: Record<string, FeedbackColor>
}

export default function DigitTracker({ digitStatus }: DigitTrackerProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  
  const getDigitStyle = (status: FeedbackColor): string => {
    switch (status) {
      case 'correct':
        return 'bg-green-500 text-white border-green-500'
      case 'wrong-position':
        return 'bg-yellow-500 text-white border-yellow-500'
      case 'not-in-puzzle':
        return 'bg-gray-500 text-white border-gray-500'
      default:
        return 'bg-gray-200 text-gray-700 border-gray-300'
    }
  }
  
  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="text-center text-sm text-gray-600 mb-2">
        Digit Status
      </div>
      <div className="flex justify-center gap-1">
        {digits.map(digit => (
          <div
            key={digit}
            className={`
              w-8 h-8 flex items-center justify-center
              border-2 rounded text-sm font-bold
              transition-colors duration-300
              ${getDigitStyle(digitStatus[digit] || 'not-in-puzzle')}
            `}
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. Updated Guess Row with Feedback Display (`src/components/GuessRow.tsx`)
```typescript
import { useState, useCallback, KeyboardEvent } from 'react'
import InputCell from './InputCell'
import { validateCompleteGuess } from '@/lib/validation'
import type { Matrix2x2, Vector2x1, Result2x1, FeedbackColor } from '@/types/game'

interface GuessRowProps {
  rowIndex: number
  isActive: boolean
  isSubmitted: boolean
  feedback?: FeedbackColor[]
  onSubmit?: (guess: {
    matrix: Matrix2x2
    vector: Vector2x1
    result: Result2x1
  }) => void
}

type CellPosition = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'

export default function GuessRow({ 
  rowIndex, 
  isActive, 
  isSubmitted, 
  feedback,
  onSubmit 
}: GuessRowProps) {
  const [values, setValues] = useState<Record<CellPosition, string>>({
    a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''
  })
  
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentFocus, setCurrentFocus] = useState<CellPosition>('a')

  // Navigation order for the 6 input positions (g,h are calculated)
  const navigationOrder: CellPosition[] = ['a', 'b', 'c', 'd', 'e', 'f']
  
  const handleCellChange = useCallback((position: CellPosition, value: string) => {
    setValues(prev => ({ ...prev, [position]: value }))
    setErrorMessage('')
    
    // Auto-advance to next cell if value is entered and we're on an input cell
    if (value && isActive && navigationOrder.includes(position)) {
      const currentIndex = navigationOrder.indexOf(position)
      if (currentIndex < navigationOrder.length - 1) {
        const nextPosition = navigationOrder[currentIndex + 1]
        setCurrentFocus(nextPosition)
      }
    }
  }, [isActive])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, position: CellPosition) => {
    const currentIndex = navigationOrder.indexOf(position)
    
    if (e.key === 'Backspace' && values[position] === '') {
      if (currentIndex > 0) {
        const prevPosition = navigationOrder[currentIndex - 1]
        setCurrentFocus(prevPosition)
      }
    } else if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
      if (currentIndex < navigationOrder.length - 1) {
        e.preventDefault()
        const nextPosition = navigationOrder[currentIndex + 1]
        setCurrentFocus(nextPosition)
      }
    } else if (e.key === 'ArrowLeft') {
      if (currentIndex > 0) {
        e.preventDefault()
        const prevPosition = navigationOrder[currentIndex - 1]
        setCurrentFocus(prevPosition)
      }
    }
  }, [values])

  const handleSubmit = useCallback(() => {
    // Check if all input cells are filled (not g,h which are calculated)
    const inputPositions: CellPosition[] = ['a', 'b', 'c', 'd', 'e', 'f']
    const isComplete = inputPositions.every(pos => values[pos] !== '')
    
    if (!isComplete) {
      setErrorMessage('Please fill in all boxes')
      return
    }
    
    // Calculate the result values g,h from the matrix multiplication
    const a = parseInt(values.a)
    const b = parseInt(values.b)
    const c = parseInt(values.c)
    const d = parseInt(values.d)
    const e = parseInt(values.e)
    const f = parseInt(values.f)
    
    const calculatedG = a * e + b * f
    const calculatedH = c * e + d * f
    
    // Validate that results are single digits (1-9)
    if (calculatedG < 1 || calculatedG > 99 || calculatedH < 1 || calculatedH > 99) {
      setErrorMessage('The calculated results must be valid numbers')
      return
    }
    
    // Update the calculated values in the display
    setValues(prev => ({
      ...prev,
      g: calculatedG.toString(),
      h: calculatedH.toString()
    }))
    
    const matrix: Matrix2x2 = { a, b, c, d }
    const vector: Vector2x1 = { e, f }
    const result: Result2x1 = { g: calculatedG, h: calculatedH }
    
    // Validate the complete guess
    const validation = validateCompleteGuess(matrix, vector, result)
    
    if (!validation.isValid) {
      setErrorMessage(validation.errors?.[0] || 'Invalid guess')
      return
    }
    
    // Submit the valid guess
    onSubmit?.({ matrix, vector, result })
  }, [values, onSubmit])

  // Check if input positions are complete
  const inputPositions: CellPosition[] = ['a', 'b', 'c', 'd', 'e', 'f']
  const isComplete = inputPositions.every(pos => values[pos] !== '')
  const cellSize = 'w-12 h-12'
  
  // Map feedback to cell positions (feedback only applies to input positions)
  const getCellFeedback = (position: CellPosition): FeedbackColor | undefined => {
    if (!feedback || !isSubmitted) return undefined
    
    const feedbackIndex = navigationOrder.indexOf(position)
    return feedbackIndex >= 0 ? feedback[feedbackIndex] : undefined
  }
  
  return (
    <div className={`
      flex flex-col items-center gap-2 p-4 rounded-lg
      ${isActive ? 'bg-blue-50 border border-blue-200' : ''}
      ${isSubmitted ? 'opacity-100' : ''}
    `}>
      {/* Main guess row */}
      <div className="flex items-center justify-center gap-2">
        {/* Matrix [a b] */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <InputCell
              value={values.a}
              onChange={(val) => handleCellChange('a', val)}
              onKeyDown={(e) => handleKeyDown(e, 'a')}
              cellId={`${rowIndex}-a`}
              position="a"
              size={cellSize}
              isReadOnly={isSubmitted}
              feedback={getCellFeedback('a')}
              autoFocus={isActive && currentFocus === 'a'}
              isError={!!errorMessage}
            />
            <InputCell
              value={values.b}
              onChange={(val) => handleCellChange('b', val)}
              onKeyDown={(e) => handleKeyDown(e, 'b')}
              cellId={`${rowIndex}-b`}
              position="b"
              size={cellSize}
              isReadOnly={isSubmitted}
              feedback={getCellFeedback('b')}
              autoFocus={isActive && currentFocus === 'b'}
              isError={!!errorMessage}
            />
          </div>
          <div className="flex gap-1">
            <InputCell
              value={values.c}
              onChange={(val) => handleCellChange('c', val)}
              onKeyDown={(e) => handleKeyDown(e, 'c')}
              cellId={`${rowIndex}-c`}
              position="c"
              size={cellSize}
              isReadOnly={isSubmitted}
              feedback={getCellFeedback('c')}
              autoFocus={isActive && currentFocus === 'c'}
              isError={!!errorMessage}
            />
            <InputCell
              value={values.d}
              onChange={(val) => handleCellChange('d', val)}
              onKeyDown={(e) => handleKeyDown(e, 'd')}
              cellId={`${rowIndex}-d`}
              position="d"
              size={cellSize}
              isReadOnly={isSubmitted}
              feedback={getCellFeedback('d')}
              autoFocus={isActive && currentFocus === 'd'}
              isError={!!errorMessage}
            />
          </div>
        </div>
        
        {/* Multiplication symbol */}
        <div className="text-2xl font-bold text-gray-600 px-2">×</div>
        
        {/* Vector [e f] */}
        <div className="flex flex-col gap-1">
          <InputCell
            value={values.e}
            onChange={(val) => handleCellChange('e', val)}
            onKeyDown={(e) => handleKeyDown(e, 'e')}
            cellId={`${rowIndex}-e`}
            position="e"
            size={cellSize}
            isReadOnly={isSubmitted}
            feedback={getCellFeedback('e')}
            autoFocus={isActive && currentFocus === 'e'}
            isError={!!errorMessage}
          />
          <InputCell
            value={values.f}
            onChange={(val) => handleCellChange('f', val)}
            onKeyDown={(e) => handleKeyDown(e, 'f')}
            cellId={`${rowIndex}-f`}
            position="f"
            size={cellSize}
            isReadOnly={isSubmitted}
            feedback={getCellFeedback('f')}
            autoFocus={isActive && currentFocus === 'f'}
            isError={!!errorMessage}
          />
        </div>
        
        {/* Equals symbol */}
        <div className="text-2xl font-bold text-gray-600 px-2">=</div>
        
        {/* Result [g h] - calculated and displayed */}
        <div className="flex flex-col gap-1">
          <InputCell
            value={values.g}
            onChange={() => {}} // Results are calculated, not editable
            cellId={`${rowIndex}-g`}
            position="g"
            size={cellSize}
            isReadOnly={true}
          />
          <InputCell
            value={values.h}
            onChange={() => {}} // Results are calculated, not editable
            cellId={`${rowIndex}-h`}
            position="h"
            size={cellSize}
            isReadOnly={true}
          />
        </div>
      </div>
      
      {/* Submit button and error message */}
      {isActive && (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`
              px-6 py-2 rounded-md font-semibold transition-colors
              ${isComplete 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Submit
          </button>
          
          {errorMessage && (
            <div className="text-red-600 text-sm font-medium" role="alert">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 4. Game State Management Hook (`src/hooks/useGameState.ts`)
```typescript
import { useState, useCallback } from 'react'
import { generateFeedback, calculateDigitTracker, isWinningGuess } from '@/lib/feedback'
import type { Guess, Puzzle, FeedbackColor } from '@/lib/feedback'
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
```

### 5. Updated Game Board with State Management (`src/components/GameBoard.tsx`)
```typescript
import GuessRow from './GuessRow'
import DigitTracker from './DigitTracker'
import { useGameState } from '@/hooks/useGameState'

export default function GameBoard() {
  const { gameState, submitGuess, resetGame } = useGameState()

  const guessRows = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    isActive: index === gameState.currentGuess && gameState.status === 'playing',
    isSubmitted: index < gameState.guesses.length,
    feedback: gameState.guesses[index]?.feedback
  }))

  return (
    <div className="w-full max-w-2xl mx-auto">
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
              : 'Better luck next time!'
            }
          </div>
          {gameState.status === 'lost' && (
            <div className="text-sm text-gray-700 mb-3">
              The answer was: [{gameState.puzzle.matrix.a} {gameState.puzzle.matrix.b}] × [{gameState.puzzle.vector.e}] = [{gameState.puzzle.result.g}]
              <br />
              [{gameState.puzzle.matrix.c} {gameState.puzzle.matrix.d}]   [{gameState.puzzle.vector.f}]   [{gameState.puzzle.result.h}]
            </div>
          )}
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Play Again
          </button>
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
    </div>
  )
}
```

## Testing Strategy

### 1. Feedback Logic Tests (`src/lib/__tests__/feedback.test.ts`)
```typescript
import { generateFeedback, calculateDigitTracker, isWinningGuess } from '../feedback'

describe('Feedback System', () => {
  const targetPuzzle = {
    id: 'test',
    date: '2024-01-01',
    matrix: { a: 2, b: 1, c: 1, d: 3 },
    vector: { e: 3, f: 2 },
    result: { g: 8, h: 9 }
  }

  test('generates correct feedback for exact match', () => {
    const guess = {
      matrix: { a: 2, b: 1, c: 1, d: 3 },
      vector: { e: 3, f: 2 },
      result: { g: 8, h: 9 },
      feedback: [],
      timestamp: new Date()
    }

    const feedback = generateFeedback(guess, targetPuzzle)
    expect(feedback).toEqual([
      'correct', 'correct', 'correct', 'correct', 'correct', 'correct'
    ])
  })

  test('generates correct feedback for wrong positions', () => {
    const guess = {
      matrix: { a: 1, b: 2, c: 3, d: 1 }, // a,b swapped, c=3 (wrong), d=1 (in puzzle but wrong pos)
      vector: { e: 2, f: 3 }, // e,f swapped
      result: { g: 8, h: 9 },
      feedback: [],
      timestamp: new Date()
    }

    const feedback = generateFeedback(guess, targetPuzzle)
    expect(feedback).toEqual([
      'wrong-position', // a=1 exists but wrong position
      'wrong-position', // b=2 exists but wrong position  
      'wrong-position', // c=3 exists but wrong position
      'wrong-position', // d=1 exists but wrong position
      'wrong-position', // e=2 exists but wrong position
      'wrong-position'  // f=3 exists but wrong position
    ])
  })

  test('generates correct feedback for non-existing digits', () => {
    const guess = {
      matrix: { a: 4, b: 5, c: 6, d: 7 }, // None of these exist in target
      vector: { e: 8, f: 9 },
      result: { g: 8, h: 9 },
      feedback: [],
      timestamp: new Date()
    }

    const feedback = generateFeedback(guess, targetPuzzle)
    expect(feedback).toEqual([
      'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 
      'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle'
    ])
  })
})
```

### 2. Integration Tests
```typescript
test('complete game flow with feedback', async () => {
  const user = userEvent.setup()
  
  render(<GameBoard />)
  
  // Make a guess
  const inputs = screen.getAllByRole('textbox')
  await user.type(inputs[0], '1') // Wrong guess
  await user.type(inputs[1], '1')
  await user.type(inputs[2], '1')
  await user.type(inputs[3], '1')
  await user.type(inputs[4], '1')
  await user.type(inputs[5], '1')
  
  const submitButton = screen.getByText('Submit')
  await user.click(submitButton)
  
  // Check that feedback colors appear
  const firstRow = screen.getByTestId('guess-row-0')
  expect(firstRow).toBeInTheDocument()
  
  // Check digit tracker updates
  const digitTracker = screen.getByText('Digit Status')
  expect(digitTracker).toBeInTheDocument()
})
```

## Definition of Done

### Functional Requirements:
- [ ] Feedback colors appear correctly after each guess
- [ ] Wordle algorithm implementation is mathematically correct
- [ ] Digit tracker updates properly based on all previous guesses
- [ ] Win/loss detection works correctly
- [ ] Game state persists correctly throughout gameplay

### Visual Requirements:
- [ ] Colors are accessible (WCAG compliant contrast)
- [ ] Feedback animation is smooth and not jarring
- [ ] Digit tracker is clearly readable
- [ ] Game status messages are helpful and clear

### Technical Requirements:
- [ ] Feedback algorithm has 100% test coverage
- [ ] Game state management is robust and bug-free
- [ ] Performance is acceptable (< 16ms per feedback calculation)
- [ ] Memory usage is optimized (no memory leaks)

### User Experience:
- [ ] Feedback is immediate and satisfying
- [ ] Game progression feels logical and fair
- [ ] Visual feedback matches user expectations from Wordle
- [ ] Color-blind users can distinguish feedback states

## Next Steps
With the feedback system complete, Milestone 5 will implement the daily puzzle system, ensuring all players get the same puzzle each day and adding local storage for game persistence.