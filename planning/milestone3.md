# Milestone 3: Input System

## Objective
Transform the static game board into a fully interactive input system with real-time validation, auto-focus navigation, and user-friendly error handling.

## Success Criteria
- [ ] Users can enter digits 1-9 in any input cell
- [ ] Auto-focus advances to next cell after valid input
- [ ] Backspace/delete moves to previous cell when current is empty
- [ ] Invalid inputs (0, letters, symbols) are rejected silently
- [ ] Submit button is enabled only when all 6 cells are filled
- [ ] Mathematical validation prevents invalid submissions
- [ ] Clear error messages for invalid mathematics
- [ ] Keyboard navigation works perfectly (Tab, Enter, Escape)

## Technical Implementation

### 1. Enhanced Input Cell (`src/components/InputCell.tsx`)
```typescript
import { useRef, useEffect, KeyboardEvent, FocusEvent } from 'react'

interface InputCellProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  cellId: string
  position: string // 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'
  size: string
  isReadOnly?: boolean
  feedback?: 'correct' | 'wrong-position' | 'not-in-puzzle'
  autoFocus?: boolean
  isError?: boolean
}

export default function InputCell({ 
  value, 
  onChange,
  onKeyDown,
  onFocus,
  cellId, 
  position,
  size, 
  isReadOnly = false,
  feedback,
  autoFocus = false,
  isError = false
}: InputCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Only allow single digits 1-9
    if (newValue === '' || /^[1-9]$/.test(newValue)) {
      onChange(newValue)
    }
    // Silently reject invalid input
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation keys
    if (['Tab', 'Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      return
    }
    
    // Handle backspace/delete
    if (['Backspace', 'Delete'].includes(e.key)) {
      if (value === '') {
        // Move to previous cell if current is empty
        onKeyDown?.(e)
      }
      return
    }
    
    // Forward other key events
    onKeyDown?.(e)
  }

  const getFeedbackColor = () => {
    if (isError) return 'border-red-500 bg-red-50'
    if (!feedback) return 'bg-white border-gray-300'
    
    switch (feedback) {
      case 'correct':
        return 'bg-green-500 text-white border-green-500'
      case 'wrong-position':
        return 'bg-yellow-500 text-white border-yellow-500'
      case 'not-in-puzzle':
        return 'bg-gray-500 text-white border-gray-500'
      default:
        return 'bg-white border-gray-300'
    }
  }

  return (
    <input
      ref={inputRef}
      id={cellId}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      readOnly={isReadOnly}
      maxLength={1}
      className={`
        ${size}
        border-2 rounded-md
        text-center text-xl font-bold
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors duration-200
        ${getFeedbackColor()}
        ${isReadOnly ? 'cursor-default' : 'cursor-text'}
      `}
      aria-label={`Matrix position ${position}`}
      aria-describedby={`${cellId}-help`}
      inputMode="numeric"
    />
  )
}
```

### 2. Enhanced Guess Row with Input Logic (`src/components/GuessRow.tsx`)
```typescript
import { useState, useCallback, KeyboardEvent } from 'react'
import InputCell from './InputCell'
import { validateCompleteGuess } from '@/lib/validation'
import type { Matrix2x2, Vector2x1, Result2x1 } from '@/types/game'

interface GuessRowProps {
  rowIndex: number
  isActive: boolean
  isSubmitted: boolean
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
  onSubmit 
}: GuessRowProps) {
  const [values, setValues] = useState<Record<CellPosition, string>>({
    a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''
  })
  
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentFocus, setCurrentFocus] = useState<CellPosition>('a')

  // Define the navigation order
  const navigationOrder: CellPosition[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  
  const handleCellChange = useCallback((position: CellPosition, value: string) => {
    setValues(prev => ({ ...prev, [position]: value }))
    setErrorMessage('') // Clear error when user starts typing
    
    // Auto-advance to next cell if value is entered
    if (value && isActive) {
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
      // Move to previous cell if current is empty
      if (currentIndex > 0) {
        const prevPosition = navigationOrder[currentIndex - 1]
        setCurrentFocus(prevPosition)
      }
    } else if (e.key === 'Enter') {
      // Try to submit the guess
      handleSubmit()
    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
      // Move to next cell
      if (currentIndex < navigationOrder.length - 1) {
        e.preventDefault()
        const nextPosition = navigationOrder[currentIndex + 1]
        setCurrentFocus(nextPosition)
      }
    } else if (e.key === 'ArrowLeft') {
      // Move to previous cell
      if (currentIndex > 0) {
        e.preventDefault()
        const prevPosition = navigationOrder[currentIndex - 1]
        setCurrentFocus(prevPosition)
      }
    }
  }, [values])

  const handleSubmit = useCallback(() => {
    // Check if all cells are filled
    const isComplete = Object.values(values).every(val => val !== '')
    
    if (!isComplete) {
      setErrorMessage('Please fill in all boxes')
      return
    }
    
    // Convert to numbers and validate
    const matrix: Matrix2x2 = {
      a: parseInt(values.a),
      b: parseInt(values.b),
      c: parseInt(values.c),
      d: parseInt(values.d)
    }
    
    const vector: Vector2x1 = {
      e: parseInt(values.e),
      f: parseInt(values.f)
    }
    
    const result: Result2x1 = {
      g: parseInt(values.g),
      h: parseInt(values.h)
    }
    
    // Validate the guess
    const validation = validateCompleteGuess(matrix, vector, result)
    
    if (!validation.isValid) {
      setErrorMessage(validation.errors?.[0] || 'Invalid guess')
      return
    }
    
    // Submit the valid guess
    onSubmit?.({ matrix, vector, result })
  }, [values, onSubmit])

  const isComplete = Object.values(values).every(val => val !== '')
  const cellSize = 'w-12 h-12'
  
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
            autoFocus={isActive && currentFocus === 'f'}
            isError={!!errorMessage}
          />
        </div>
        
        {/* Equals symbol */}
        <div className="text-2xl font-bold text-gray-600 px-2">=</div>
        
        {/* Result [g h] */}
        <div className="flex flex-col gap-1">
          <InputCell
            value={values.g}
            onChange={(val) => handleCellChange('g', val)}
            onKeyDown={(e) => handleKeyDown(e, 'g')}
            cellId={`${rowIndex}-g`}
            position="g"
            size={cellSize}
            isReadOnly={isSubmitted}
            autoFocus={isActive && currentFocus === 'g'}
            isError={!!errorMessage}
          />
          <InputCell
            value={values.h}
            onChange={(val) => handleCellChange('h', val)}
            onKeyDown={(e) => handleKeyDown(e, 'h')}
            cellId={`${rowIndex}-h`}
            position="h"
            size={cellSize}
            isReadOnly={isSubmitted}
            autoFocus={isActive && currentFocus === 'h'}
            isError={!!errorMessage}
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

### 3. Updated Game Board (`src/components/GameBoard.tsx`)
```typescript
import { useState } from 'react'
import GuessRow from './GuessRow'
import type { Matrix2x2, Vector2x1, Result2x1 } from '@/types/game'

interface Guess {
  matrix: Matrix2x2
  vector: Vector2x1
  result: Result2x1
}

export default function GameBoard() {
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [currentGuess, setCurrentGuess] = useState(0)
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')

  const handleGuessSubmit = (guess: Guess) => {
    const newGuesses = [...guesses, guess]
    setGuesses(newGuesses)
    
    // For now, just move to next guess (we'll add win/loss logic in Milestone 4)
    if (newGuesses.length < 6) {
      setCurrentGuess(newGuesses.length)
    } else {
      setGameStatus('lost') // Used all guesses
    }
  }

  const guessRows = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    isActive: index === currentGuess && gameStatus === 'playing',
    isSubmitted: index < guesses.length,
    guess: guesses[index] || null
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
            onSubmit={handleGuessSubmit}
          />
        ))}
      </div>
      
      {/* Game status */}
      {gameStatus !== 'playing' && (
        <div className="text-center mt-4">
          <div className="text-lg font-semibold">
            {gameStatus === 'won' ? 'Congratulations!' : 'Game Over'}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            You made {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}
          </div>
        </div>
      )}
      
      {/* Template visualization */}
      <div className="text-center text-gray-500 text-sm mt-6">
        <div className="font-mono text-xs">
          Matrix format: [a b] × [e] = [g]
        </div>
        <div className="font-mono text-xs">
                       [c d]   [f]   [h]
        </div>
      </div>
    </div>
  )
}
```

### 4. Input Validation Utilities (`src/lib/input-utils.ts`)
```typescript
export function sanitizeInput(input: string): string {
  // Remove all non-digit characters and limit to single digit
  const digits = input.replace(/\D/g, '')
  return digits.slice(0, 1)
}

export function isValidGameInput(input: string): boolean {
  return /^[1-9]$/.test(input)
}

export function formatInputForDisplay(input: string): string {
  // Ensure input is always uppercase and trimmed
  return input.trim().toUpperCase()
}

// Debounce function for input validation
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
```

### 5. Enhanced Testing (`src/components/__tests__/InputCell.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InputCell from '../InputCell'

describe('InputCell', () => {
  const mockOnChange = jest.fn()
  const mockOnKeyDown = jest.fn()
  
  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnKeyDown.mockClear()
  })

  test('accepts valid digits 1-9', async () => {
    const user = userEvent.setup()
    
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
      />
    )
    
    const input = screen.getByRole('textbox')
    
    await user.type(input, '5')
    expect(mockOnChange).toHaveBeenCalledWith('5')
  })

  test('rejects invalid inputs', async () => {
    const user = userEvent.setup()
    
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
      />
    )
    
    const input = screen.getByRole('textbox')
    
    // Try invalid inputs
    await user.type(input, '0')
    await user.type(input, 'a')
    await user.type(input, '!')
    await user.type(input, '10')
    
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('handles backspace navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        onKeyDown={mockOnKeyDown}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.type(input, '{backspace}')
    
    expect(mockOnKeyDown).toHaveBeenCalled()
  })

  test('displays error state', () => {
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
        isError={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
  })
})
```

## User Experience Features

### 1. Smart Auto-Focus
- Focus advances automatically after valid input
- Backspace moves to previous cell when current is empty
- Tab/Shift+Tab for manual navigation
- Arrow keys for directional navigation

### 2. Input Validation
- Only digits 1-9 are accepted
- Invalid characters are silently rejected
- No need for error messages on invalid keystrokes

### 3. Visual Feedback
- Submit button is disabled until all cells are filled
- Error messages appear below the active row
- Input cells show error state with red border
- Clear visual indication of current focus

### 4. Keyboard Shortcuts
- Enter: Submit current guess
- Escape: Clear current guess (future enhancement)
- Tab: Navigate between cells
- Arrows: Navigate between cells

## Testing Strategy

### 1. Unit Tests
```typescript
// Input validation tests
describe('Input Validation', () => {
  test('accepts digits 1-9', () => {
    expect(isValidGameInput('5')).toBe(true)
  })
  
  test('rejects invalid inputs', () => {
    expect(isValidGameInput('0')).toBe(false)
    expect(isValidGameInput('a')).toBe(false)
    expect(isValidGameInput('10')).toBe(false)
  })
})
```

### 2. Integration Tests
```typescript
// Full guess flow test
test('complete guess submission flow', async () => {
  const user = userEvent.setup()
  const mockOnSubmit = jest.fn()
  
  render(<GuessRow rowIndex={0} isActive={true} onSubmit={mockOnSubmit} />)
  
  // Fill in a valid guess
  const inputs = screen.getAllByRole('textbox')
  await user.type(inputs[0], '2') // a
  await user.type(inputs[1], '1') // b
  await user.type(inputs[2], '1') // c
  await user.type(inputs[3], '3') // d
  await user.type(inputs[4], '3') // e
  await user.type(inputs[5], '2') // f
  await user.type(inputs[6], '8') // g
  await user.type(inputs[7], '9') // h
  
  // Submit
  const submitButton = screen.getByText('Submit')
  await user.click(submitButton)
  
  expect(mockOnSubmit).toHaveBeenCalledWith({
    matrix: { a: 2, b: 1, c: 1, d: 3 },
    vector: { e: 3, f: 2 },
    result: { g: 8, h: 9 }
  })
})
```

### 3. Accessibility Tests
```typescript
test('keyboard navigation works correctly', async () => {
  const user = userEvent.setup()
  
  render(<GuessRow rowIndex={0} isActive={true} />)
  
  const inputs = screen.getAllByRole('textbox')
  
  // Tab through inputs
  await user.tab()
  expect(inputs[0]).toHaveFocus()
  
  await user.tab()
  expect(inputs[1]).toHaveFocus()
})
```

## Definition of Done

### Functional Requirements:
- [ ] Users can enter digits 1-9 in any input cell
- [ ] Auto-focus works correctly in all directions
- [ ] Invalid inputs are rejected silently
- [ ] Submit button state updates correctly
- [ ] Mathematical validation prevents invalid submissions
- [ ] Error messages are clear and helpful

### UX Requirements:
- [ ] Keyboard navigation is intuitive
- [ ] Touch interaction works on mobile
- [ ] Visual feedback is immediate and clear
- [ ] Error states are visually distinct

### Technical Requirements:
- [ ] All components are properly typed
- [ ] Input validation is comprehensive
- [ ] Event handlers are properly optimized
- [ ] No memory leaks or performance issues

### Testing Requirements:
- [ ] Unit tests cover all input scenarios
- [ ] Integration tests cover complete workflows
- [ ] Accessibility tests pass
- [ ] Manual testing confirms smooth UX

## Next Steps
With a fully functional input system, Milestone 4 will add the color-coded feedback system and digit tracking that gives players the crucial information they need to solve the puzzle.