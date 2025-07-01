interface InputCellProps {
  value: string
  cellId: string
  size: string
  isReadOnly?: boolean
  feedback?: 'correct' | 'wrong-position' | 'not-in-puzzle'
}

export default function InputCell({ 
  value, 
  cellId, 
  size, 
  isReadOnly = false,
  feedback 
}: InputCellProps) {
  const getFeedbackColor = () => {
    if (!feedback) return 'bg-white border-gray-300'
    
    switch (feedback) {
      case 'correct':
        return 'bg-green-500 text-white border-green-500'
      case 'wrong-position':
        return 'bg-yellow-500 text-white border-yellow-500'
      case 'not-in-puzzle':
        return 'bg-gray-500 text-white border-gray-500'
      default:
        return 'bg-white border-gray-300'
    }
  }

  return (
    <input
      id={cellId}
      type="text"
      defaultValue={value}
      readOnly={true} // For milestone 2, all inputs are read-only (static demo)
      maxLength={1}
      className={`
        ${size}
        border-2 rounded-md
        text-center font-bold
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors duration-200
        ${getFeedbackColor()}
        cursor-default
      `}
      placeholder=""
    />
  )
}