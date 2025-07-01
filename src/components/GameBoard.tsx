'use client'

import { useState } from 'react'
import GuessRow from './GuessRow'
import DigitTracker from './DigitTracker'
import WinModal from './WinModal'
import { useGameState } from '@/hooks/useGameState'

export default function GameBoard() {
  const { gameState, submitGuess, resetGame } = useGameState()
  const [showWinModal, setShowWinModal] = useState(false)
  const [modalClosedManually, setModalClosedManually] = useState(false)
  const [gameKey, setGameKey] = useState(0)

  // Show win modal when game is won (but not if it was manually closed)
  if (gameState.status === 'won' && !showWinModal && !modalClosedManually) {
    setShowWinModal(true)
  }

  const handlePlayAgain = () => {
    resetGame()
    setShowWinModal(false)
    setModalClosedManually(false) // Reset for new game
    setGameKey(prev => prev + 1) // Force re-render of GuessRow components
  }

  const handleCloseModal = () => {
    setShowWinModal(false)
    setModalClosedManually(true) // Track that user manually closed it
  }

  const guessRows = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    isActive: index === gameState.currentGuess && gameState.status === 'playing',
    isSubmitted: index < gameState.guesses.length,
    feedback: gameState.guesses[index]?.feedback
  }))

  return (
    <div className="w-full max-w-2xl mx-auto pb-48">
      {/* Game Board */}
      <div className="space-y-2 mb-6">
        {guessRows.map((row) => (
          <GuessRow
            key={`${gameKey}-${row.id}`}
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
            <div className="mb-4">
              <div className="text-gray-600 text-sm mb-2">The answer was:</div>
              <div className="flex items-center justify-center gap-2 text-xs font-mono">
                {/* Matrix */}
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">[</span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex gap-1">
                      <span className="w-3 text-center text-blue-600 font-semibold">{gameState.puzzle.matrix.a}</span>
                      <span className="w-3 text-center text-blue-600 font-semibold">{gameState.puzzle.matrix.b}</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="w-3 text-center text-blue-600 font-semibold">{gameState.puzzle.matrix.c}</span>
                      <span className="w-3 text-center text-blue-600 font-semibold">{gameState.puzzle.matrix.d}</span>
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
                    <span className="w-3 text-center text-blue-600 font-semibold">{gameState.puzzle.vector.e}</span>
                    <span className="w-3 text-center text-blue-600 font-semibold">{gameState.puzzle.vector.f}</span>
                  </div>
                  <span className="text-gray-400 ml-1">]</span>
                </div>
                
                {/* Equals symbol */}
                <span className="text-gray-600 font-bold">=</span>
                
                {/* Result */}
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">[</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="w-3 text-center text-green-600 font-semibold">{gameState.puzzle.result.g}</span>
                    <span className="w-3 text-center text-green-600 font-semibold">{gameState.puzzle.result.h}</span>
                  </div>
                  <span className="text-gray-400 ml-1">]</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handlePlayAgain}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Play Again
          </button>
        </div>
      )}
      

      {/* Win Modal */}
      <WinModal
        isOpen={showWinModal}
        onClose={handleCloseModal}
        onPlayAgain={handlePlayAgain}
        guessCount={gameState.guesses.length}
      />
    </div>
  )
}