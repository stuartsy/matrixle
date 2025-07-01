import GuessRow from './GuessRow'

export default function GameBoard() {
  // Static data for layout purposes
  const guessRows = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    isActive: index === 0, // First row active for demo
    isSubmitted: false,
    values: {
      a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''
    }
  }))

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Game Board */}
      <div className="space-y-2 mb-6">
        {guessRows.map((row) => (
          <GuessRow
            key={row.id}
            rowIndex={row.id}
            isActive={row.isActive}
            isSubmitted={row.isSubmitted}
            values={row.values}
          />
        ))}
      </div>
      
      {/* Template visualization */}
      <div className="text-center text-gray-500 text-sm mt-4">
        <div className="font-mono">
          [a b] × [e] = [g]
        </div>
        <div className="font-mono">
          [c d]   [f]   [h]
        </div>
      </div>
    </div>
  )
}