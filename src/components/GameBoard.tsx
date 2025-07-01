'use client'

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