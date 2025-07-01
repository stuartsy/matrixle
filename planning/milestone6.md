# Milestone 6: Win/Loss & Sharing

## Objective
Complete the game loop with satisfying win/loss states and implement Wordle-style social sharing that drives viral growth and player engagement.

## Success Criteria
- [ ] Clear win/loss detection and appropriate celebration/consolation
- [ ] Shareable emoji grid matches actual gameplay exactly
- [ ] Copy-to-clipboard functionality works across all browsers
- [ ] Share text includes game stats and branding
- [ ] Game completion triggers share prompt automatically
- [ ] Social sharing preserves spoiler-free format
- [ ] Share functionality is accessible and intuitive

## Technical Implementation

### 1. Share Functionality (`src/lib/share.ts`)
```typescript
import type { Guess, FeedbackColor } from './feedback'

export interface ShareData {
  date: string
  guessCount: number
  won: boolean
  emojiGrid: string
  shareText: string
}

/**
 * Convert feedback colors to emoji squares
 */
function feedbackToEmoji(feedback: FeedbackColor): string {
  switch (feedback) {
    case 'correct':
      return '🟩'
    case 'wrong-position':
      return '🟨'
    case 'not-in-puzzle':
      return '⬜'
    default:
      return '⬜'
  }
}

/**
 * Generate emoji grid from game guesses
 */
export function generateEmojiGrid(guesses: Guess[]): string {
  const rows = guesses.map(guess => 
    guess.feedback.map(feedbackToEmoji).join('')
  )
  return rows.join('\n')
}

/**
 * Generate complete share text
 */
export function generateShareText(
  date: string,
  guessCount: number,
  won: boolean,
  emojiGrid: string
): string {
  const result = won ? `${guessCount}/6` : 'X/6'
  const dateFormatted = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  return `Matrixle ${dateFormatted} ${result}

${emojiGrid}

Play at matrixle.com`
}

/**
 * Create shareable data from game state
 */
export function createShareData(
  date: string,
  guesses: Guess[],
  won: boolean
): ShareData {
  const emojiGrid = generateEmojiGrid(guesses)
  const shareText = generateShareText(date, guesses.length, won, emojiGrid)
  
  return {
    date,
    guessCount: guesses.length,
    won,
    emojiGrid,
    shareText
  }
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API failed:', err)
    }
  }
  
  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    
    document.body.appendChild(textArea)
    textArea.select()
    textArea.setSelectionRange(0, 99999) // For mobile devices
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    return successful
  } catch (err) {
    console.warn('Fallback copy failed:', err)
    return false
  }
}

/**
 * Share via Web Share API (mobile) with fallback to clipboard
 */
export async function shareResults(shareData: ShareData): Promise<'shared' | 'copied' | 'failed'> {
  // Try Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Matrixle',
        text: shareData.shareText,
        url: 'https://matrixle.com'
      })
      return 'shared'
    } catch (err) {
      // User cancelled or error occurred
      console.warn('Web Share API failed:', err)
    }
  }
  
  // Fallback to clipboard
  const copied = await copyToClipboard(shareData.shareText)
  return copied ? 'copied' : 'failed'
}
```

### 2. Share Modal Component (`src/components/ShareModal.tsx`)
```typescript
import { useState, useEffect } from 'react'
import { createShareData, shareResults } from '@/lib/share'
import type { ShareData } from '@/lib/share'
import type { Guess } from '@/lib/feedback'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  guesses: Guess[]
  won: boolean
  guessCount: number
}

export default function ShareModal({
  isOpen,
  onClose,
  date,
  guesses,
  won,
  guessCount
}: ShareModalProps) {
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'shared' | 'failed'>('idle')

  useEffect(() => {
    if (isOpen) {
      const data = createShareData(date, guesses, won)
      setShareData(data)
      setShareStatus('idle')
    }
  }, [isOpen, date, guesses, won])

  const handleShare = async () => {
    if (!shareData) return

    setShareStatus('sharing')
    const result = await shareResults(shareData)
    setShareStatus(result === 'shared' ? 'shared' : result === 'copied' ? 'copied' : 'failed')
    
    if (result !== 'failed') {
      // Auto-close after successful share/copy
      setTimeout(() => onClose(), 1500)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !shareData) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {won ? '🎉 Puzzle Complete!' : '😔 Game Over'}
          </h2>
          <p className="text-sm text-gray-600">
            {won 
              ? `Solved in ${guessCount} guess${guessCount !== 1 ? 'es' : ''}!`
              : 'Better luck tomorrow!'
            }
          </p>
        </div>

        {/* Emoji Grid Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-center mb-2">
            <div className="text-sm font-semibold text-gray-700">
              Matrixle {new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })} {won ? `${guessCount}/6` : 'X/6'}
            </div>
          </div>
          <div className="font-mono text-center text-lg leading-tight">
            {shareData.emojiGrid.split('\n').map((row, index) => (
              <div key={index}>{row}</div>
            ))}
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          disabled={shareStatus === 'sharing'}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors
            ${shareStatus === 'sharing' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : shareStatus === 'copied'
              ? 'bg-green-600'
              : shareStatus === 'shared'
              ? 'bg-green-600'
              : shareStatus === 'failed'
              ? 'bg-red-600'
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {shareStatus === 'sharing' && (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Sharing...
            </>
          )}
          {shareStatus === 'copied' && '✓ Copied to clipboard!'}
          {shareStatus === 'shared' && '✓ Shared successfully!'}
          {shareStatus === 'failed' && 'Try again'}
          {shareStatus === 'idle' && (
            <>
              <span className="mr-2">📤</span>
              Share Results
            </>
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 text-center mt-3">
          Come back tomorrow for a new puzzle!
        </div>
      </div>
    </div>
  )
}
```

### 3. Game Completion Component (`src/components/GameComplete.tsx`)
```typescript
import { useState } from 'react'
import ShareModal from './ShareModal'
import type { GameState } from '@/hooks/useGameState'

interface GameCompleteProps {
  gameState: GameState
  onNewGame?: () => void
}

export default function GameComplete({ gameState, onNewGame }: GameCompleteProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  
  const handleShare = () => {
    setShowShareModal(true)
  }

  const isWon = gameState.status === 'won'
  const guessCount = gameState.guesses.length

  return (
    <div className="text-center mt-6 p-6 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border">
      {/* Main Result */}
      <div className="mb-4">
        <div className="text-3xl mb-2">
          {isWon ? '🎉' : '😔'}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isWon ? 'Congratulations!' : 'Game Over'}
        </h2>
        <p className="text-gray-600">
          {isWon 
            ? `You solved today's puzzle in ${guessCount} guess${guessCount !== 1 ? 'es' : ''}!`
            : 'Better luck tomorrow!'
          }
        </p>
      </div>

      {/* Solution Display (for losses) */}
      {!isWon && (
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <div className="text-sm text-gray-600 mb-2">The solution was:</div>
          <div className="font-mono text-lg text-gray-900">
            [{gameState.puzzle.matrix.a} {gameState.puzzle.matrix.b}] × [{gameState.puzzle.vector.e}] = [{gameState.puzzle.result.g}]
          </div>
          <div className="font-mono text-lg text-gray-900">
            [{gameState.puzzle.matrix.c} {gameState.puzzle.matrix.d}]   [{gameState.puzzle.vector.f}]   [{gameState.puzzle.result.h}]
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{guessCount}</div>
          <div className="text-xs text-gray-600">Guesses</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {isWon ? '100%' : '0%'}
          </div>
          <div className="text-xs text-gray-600">Success Rate</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          📤 Share Results
        </button>
        
        {onNewGame && (
          <button
            onClick={onNewGame}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Play Again (Tomorrow)
          </button>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        date={gameState.puzzle.date}
        guesses={gameState.guesses}
        won={isWon}
        guessCount={guessCount}
      />
    </div>
  )
}
```

### 4. Enhanced Game Board with Completion Flow (`src/components/GameBoard.tsx`)
```typescript
import { useEffect, useState } from 'react'
import GuessRow from './GuessRow'
import DigitTracker from './DigitTracker'
import GameComplete from './GameComplete'
import { useGameState } from '@/hooks/useGameState'

export default function GameBoard() {
  const { gameState, submitGuess, resetGame, canPlayToday, isLoaded } = useGameState()
  const [showCompletion, setShowCompletion] = useState(false)

  // Show completion screen when game ends
  useEffect(() => {
    if (gameState && gameState.status !== 'playing') {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowCompletion(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else {
      setShowCompletion(false)
    }
  }, [gameState?.status])

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

  const guessRows = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    isActive: index === gameState.currentGuess && gameState.status === 'playing',
    isSubmitted: index < gameState.guesses.length,
    feedback: gameState.guesses[index]?.feedback
  }))

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Game Board */}
      <div className={`space-y-2 mb-6 transition-opacity duration-500 ${showCompletion ? 'opacity-50' : ''}`}>
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
      
      {/* Game Completion */}
      {showCompletion && gameState.status !== 'playing' && (
        <GameComplete 
          gameState={gameState}
          onNewGame={resetGame}
        />
      )}
      
      {/* Daily puzzle indicator */}
      <div className="text-center text-xs text-gray-500 mt-4">
        Daily puzzle for {new Date(gameState.puzzle.date).toLocaleDateString()}
      </div>
      
      {/* Instructions */}
      {gameState.status === 'playing' && (
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
      )}
    </div>
  )
}
```

### 5. Enhanced Game State with Completion Tracking (`src/hooks/useGameState.ts`)
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
  stats: {
    totalGuesses: number
    correctGuesses: number
    timeToComplete?: number
  }
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
        startedAt: new Date().toISOString(),
        stats: {
          totalGuesses: 0,
          correctGuesses: 0
        }
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
          startedAt: new Date().toISOString(),
          stats: {
            totalGuesses: 0,
            correctGuesses: 0
          }
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

      const completedAt = newStatus !== 'playing' ? new Date().toISOString() : prev.completedAt
      const timeToComplete = completedAt && prev.startedAt 
        ? new Date(completedAt).getTime() - new Date(prev.startedAt).getTime()
        : undefined

      const updatedState: GameState = {
        ...prev,
        guesses: newGuesses,
        currentGuess: isWin || isGameOver ? prev.currentGuess : prev.currentGuess + 1,
        status: newStatus,
        digitTracker: newDigitTracker,
        completedAt,
        stats: {
          totalGuesses: newGuesses.length,
          correctGuesses: isWin ? 1 : 0,
          timeToComplete
        }
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
      startedAt: new Date().toISOString(),
      stats: {
        totalGuesses: 0,
        correctGuesses: 0
      }
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

## Testing Strategy

### 1. Share Functionality Tests (`src/lib/__tests__/share.test.ts`)
```typescript
import { generateEmojiGrid, generateShareText, createShareData } from '../share'

describe('Share Functionality', () => {
  const mockGuesses = [
    {
      matrix: { a: 1, b: 2, c: 3, d: 4 },
      vector: { e: 5, f: 6 },
      result: { g: 17, h: 39 },
      feedback: ['correct', 'wrong-position', 'not-in-puzzle', 'correct', 'wrong-position', 'not-in-puzzle'],
      timestamp: new Date()
    }
  ]

  test('generates correct emoji grid', () => {
    const emojiGrid = generateEmojiGrid(mockGuesses)
    expect(emojiGrid).toBe('🟩🟨⬜🟩🟨⬜')
  })

  test('generates correct share text', () => {
    const shareText = generateShareText('2024-01-01', 3, true, '🟩🟨⬜\n🟩🟩🟩\n🟩🟩🟩')
    
    expect(shareText).toContain('Matrixle')
    expect(shareText).toContain('3/6')
    expect(shareText).toContain('🟩🟨⬜')
    expect(shareText).toContain('matrixle.com')
  })

  test('creates complete share data', () => {
    const shareData = createShareData('2024-01-01', mockGuesses, true)
    
    expect(shareData.date).toBe('2024-01-01')
    expect(shareData.guessCount).toBe(1)
    expect(shareData.won).toBe(true)
    expect(shareData.emojiGrid).toBe('🟩🟨⬜🟩🟨⬜')
    expect(shareData.shareText).toContain('Matrixle')
  })
})
```

### 2. Integration Tests
```typescript
test('complete game flow with sharing', async () => {
  const user = userEvent.setup()
  
  render(<GameBoard />)
  
  // Play a complete game that results in a win
  // ... (game playing logic)
  
  // Check that share modal appears
  await waitFor(() => {
    expect(screen.getByText('Share Results')).toBeInTheDocument()
  })
  
  // Test share functionality
  const shareButton = screen.getByText('Share Results')
  await user.click(shareButton)
  
  // Verify share modal content
  expect(screen.getByText('🎉 Puzzle Complete!')).toBeInTheDocument()
  expect(screen.getByText(/Solved in \d+ guess/)).toBeInTheDocument()
})
```

## Definition of Done

### Functional Requirements:
- [ ] Win/loss detection is accurate and immediate
- [ ] Share modal appears automatically on game completion
- [ ] Emoji grid exactly matches the player's guesses
- [ ] Copy-to-clipboard works on all target browsers
- [ ] Web Share API works on supported mobile devices

### Content Requirements:
- [ ] Share text is engaging and branded
- [ ] Emoji grid is spoiler-free (no solution revealed)
- [ ] Date formatting is consistent and clear
- [ ] Share text drives traffic back to the game

### User Experience:
- [ ] Game completion feels satisfying and rewarding
- [ ] Share flow is intuitive and frictionless
- [ ] Visual feedback for share success/failure
- [ ] Appropriate celebrations for wins and consolations for losses

### Technical Requirements:
- [ ] Share functionality works offline
- [ ] No memory leaks in modal management
- [ ] Proper error handling for clipboard failures
- [ ] Accessibility compliance for all UI elements

## Next Steps
With the core game complete, Milestone 7 will focus on production polish, performance optimization, and deployment preparation to ensure a smooth launch.