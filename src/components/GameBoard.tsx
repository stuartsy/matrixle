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
    <div className="w-full max-w-2xl mx-auto pb-24">
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
      
      {/* Digit Tracker - Now sticky at bottom */}
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
        <div className="mb-4">
          🟩 Correct position • 🟨 Wrong position • ⬜ Not in puzzle
        </div>
        
        {/* Matrix visualization */}
        <div className="mb-2 text-gray-600 text-sm">Enter matrix values:</div>
        <div className="flex items-center justify-center gap-2 text-xs font-mono">
          {/* Matrix */}
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">[</span>
            <div className="flex flex-col gap-0.5">
              <div className="flex gap-1">
                <span className="w-3 text-center text-blue-600 font-semibold">a</span>
                <span className="w-3 text-center text-blue-600 font-semibold">b</span>
              </div>
              <div className="flex gap-1">
                <span className="w-3 text-center text-blue-600 font-semibold">c</span>
                <span className="w-3 text-center text-blue-600 font-semibold">d</span>
              </div>
            </div>
            <span className="text-gray-400 ml-1">]</span>
          </div>
          
          {/* Multiplication symbol */}
          <span className="text-gray-600 font-bold">×</span>
          
          {/* Vector */}
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">[</span>
            <div className="flex flex-col gap-0.5">
              <span className="w-3 text-center text-blue-600 font-semibold">e</span>
              <span className="w-3 text-center text-blue-600 font-semibold">f</span>
            </div>
            <span className="text-gray-400 ml-1">]</span>
          </div>
          
          {/* Equals symbol */}
          <span className="text-gray-600 font-bold">=</span>
          
          {/* Result */}
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">[</span>
            <div className="flex flex-col gap-0.5">
              <span className="w-3 text-center text-green-600 font-semibold">g</span>
              <span className="w-3 text-center text-green-600 font-semibold">h</span>
            </div>
            <span className="text-gray-400 ml-1">]</span>
          </div>
        </div>
      </div>
    </div>
  )
}