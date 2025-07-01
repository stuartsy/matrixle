'use client'

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
          Enter matrix values: [a b] × [e] = [g]
        </div>
        <div className="font-mono text-xs">
                           [c d]   [f]   [h]
        </div>
      </div>
    </div>
  )
}