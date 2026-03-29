import { getPuzzleNumber } from '@/lib/dailyPuzzle'

export default function Header() {
  const puzzleNumber = getPuzzleNumber()

  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        MATRIXLE
      </h1>
      <p className="text-gray-600 text-sm">
        #{puzzleNumber} &middot; Daily matrix multiplication puzzle
      </p>
    </header>
  )
}
