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
      <div className="w-full max-w-md mx-auto py-3 px-4">
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
              role="img"
              aria-label={`Digit ${digit}: ${digitStatus[digit] || 'unknown'}`}
            >
              {digit}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}