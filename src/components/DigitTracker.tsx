import type { DigitStat } from '@/types/game'

interface DigitTrackerProps {
  digitStats: Record<string, DigitStat>
}

function DigitCell({ digit, stat }: { digit: string; stat: DigitStat | undefined }) {
  const { placed = 0, confirmed = 0, exact = false } = stat ?? {}
  const eliminated = exact && confirmed === 0
  const unseen = !eliminated && confirmed === 0 && placed === 0
  const done = confirmed > 0 && placed === confirmed

  let bg: string
  if (eliminated) bg = 'bg-white border-gray-300 text-red-400'
  else if (unseen) bg = 'bg-gray-200 text-gray-600'
  else if (done) bg = 'bg-green-500 text-white'
  else if (placed > 0) bg = 'bg-green-400 text-white'
  else bg = 'bg-yellow-400 text-gray-900'

  const confirmedLabel = exact ? `${confirmed}` : confirmed > 0 ? `≥${confirmed}` : null

  return (
    <div
      className={`flex flex-col items-center justify-center w-9 h-11 rounded border-2 transition-colors duration-300 ${bg}`}
      role="img"
      aria-label={`Digit ${digit}: placed ${placed}, confirmed ${confirmedLabel ?? 'unknown'}`}
    >
      <span className={`text-sm font-bold leading-none ${eliminated ? 'line-through decoration-2 decoration-red-500' : ''}`}>
        {digit}
      </span>
      {!unseen && !eliminated && (
        <span className="text-xs leading-none mt-0.5 opacity-90">
          {placed}/{confirmedLabel}{done ? '✓' : ''}
        </span>
      )}
    </div>
  )
}

export default function DigitTracker({ digitStats }: DigitTrackerProps) {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="w-full max-w-2xl mx-auto py-3 px-4">
        {/* Legend */}
        <div className="text-center text-gray-500 text-xs mb-2">
          placed / confirmed &nbsp;·&nbsp; 🟩 all placed &nbsp;·&nbsp; 🟨 found, not placed &nbsp;·&nbsp; ~~strikethrough~~ not in puzzle
        </div>

        {/* Digit cells */}
        <div className="flex justify-center gap-1 mb-4">
          {digits.map(digit => (
            <DigitCell key={digit} digit={digit} stat={digitStats[digit]} />
          ))}
        </div>

        {/* Matrix Instructions */}
        <div className="text-center text-gray-500 text-xs">
          <div className="mb-2 text-gray-600 text-sm">Enter matrix values:</div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono">
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
            <span className="text-gray-600 font-bold">×</span>
            <div className="flex items-center">
              <span className="text-gray-400 mr-1">[</span>
              <div className="flex flex-col gap-0.5">
                <span className="w-3 text-center text-blue-600 font-semibold">e</span>
                <span className="w-3 text-center text-blue-600 font-semibold">f</span>
              </div>
              <span className="text-gray-400 ml-1">]</span>
            </div>
            <span className="text-gray-600 font-bold">=</span>
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
