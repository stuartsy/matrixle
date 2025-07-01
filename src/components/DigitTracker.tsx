import type { FeedbackColor } from '@/types/game'

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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="w-full max-w-2xl mx-auto py-3 px-4">
        {/* Legend */}
        <div className="text-center text-gray-500 text-xs mb-3">
          🟩 Correct position • 🟨 Wrong position • ⬜ Not in puzzle
        </div>
        
        {/* Digit Status */}
        <div className="text-center text-sm text-gray-600 mb-2">
          Digit Status
        </div>
        <div className="flex justify-center gap-1 mb-4">
          {digits.map(digit => (
            <div
              key={digit}
              className={`
                w-8 h-8 flex items-center justify-center
                border-2 rounded text-sm font-bold
                transition-colors duration-300
                ${getDigitStyle(digitStatus[digit] || 'not-in-puzzle')}
              `}
              role="img"
              aria-label={`Digit ${digit}: ${digitStatus[digit] || 'unknown'}`}
            >
              {digit}
            </div>
          ))}
        </div>

        {/* Matrix Instructions */}
        <div className="text-center text-gray-500 text-xs">
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
    </div>
  )
}