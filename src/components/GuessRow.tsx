import InputCell from './InputCell'

interface GuessRowProps {
  rowIndex: number
  isActive: boolean
  isSubmitted: boolean
  values: {
    a: string
    b: string
    c: string
    d: string
    e: string
    f: string
    g: string
    h: string
  }
}

export default function GuessRow({ 
  rowIndex, 
  isActive, 
  isSubmitted, 
  values 
}: GuessRowProps) {
  // Responsive cell sizes
  const cellSize = 'w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-base xs:text-lg sm:text-xl'
  
  return (
    <div className={`
      flex items-center justify-center gap-2 p-2 rounded-lg
      ${isActive ? 'bg-blue-50 border border-blue-200' : ''}
      ${isSubmitted ? 'opacity-100' : ''}
    `}>
      {/* Matrix [a b] */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <InputCell
            value={values.a}
            cellId={`${rowIndex}-a`}
            size={cellSize}
            isReadOnly={isSubmitted}
          />
          <InputCell
            value={values.b}
            cellId={`${rowIndex}-b`}
            size={cellSize}
            isReadOnly={isSubmitted}
          />
        </div>
        <div className="flex gap-1">
          <InputCell
            value={values.c}
            cellId={`${rowIndex}-c`}
            size={cellSize}
            isReadOnly={isSubmitted}
          />
          <InputCell
            value={values.d}
            cellId={`${rowIndex}-d`}
            size={cellSize}
            isReadOnly={isSubmitted}
          />
        </div>
      </div>
      
      {/* Multiplication symbol */}
      <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-600 px-1 xs:px-2">
        ×
      </div>
      
      {/* Vector [e] */}
      <div className="flex flex-col gap-1">
        <InputCell
          value={values.e}
          cellId={`${rowIndex}-e`}
          size={cellSize}
          isReadOnly={isSubmitted}
        />
        <InputCell
          value={values.f}
          cellId={`${rowIndex}-f`}
          size={cellSize}
          isReadOnly={isSubmitted}
        />
      </div>
      
      {/* Equals symbol */}
      <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-600 px-1 xs:px-2">
        =
      </div>
      
      {/* Result [g] */}
      <div className="flex flex-col gap-1">
        <InputCell
          value={values.g}
          cellId={`${rowIndex}-g`}
          size={cellSize}
          isReadOnly={isSubmitted}
        />
        <InputCell
          value={values.h}
          cellId={`${rowIndex}-h`}
          size={cellSize}
          isReadOnly={isSubmitted}
        />
      </div>
      
      {/* Submit button for active row */}
      {isActive && (
        <button
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={true} // Disabled for static demo
        >
          Submit
        </button>
      )}
    </div>
  )
}