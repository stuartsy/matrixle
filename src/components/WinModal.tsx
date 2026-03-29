'use client'

import { useEffect, useState } from 'react'

interface WinModalProps {
  isOpen: boolean
  onClose: () => void
  guessCount: number
  retried: boolean
}

export default function WinModal({ isOpen, onClose, guessCount, retried }: WinModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)` }}
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>

        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {retried ? 'Solved on retry!' : 'Congratulations!'}
          </h2>
          <p className="text-gray-600 mb-2">
            You solved it in {guessCount} guess{guessCount !== 1 ? 'es' : ''}!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Come back tomorrow for a new puzzle!
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
